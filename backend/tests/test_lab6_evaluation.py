import hashlib
import json
import logging
import types
from types import SimpleNamespace
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from PIL import Image

from services.lab6_dataset import validate_dataset
from services.lab6_evaluation import verify_test_inputs, test_review_status
from services import lab6


class HeldOutEvaluationTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        for index, split in enumerate(['train', 'val', 'test']):
            (self.root / 'images' / split).mkdir(parents=True)
            (self.root / 'labels' / split).mkdir(parents=True)
            Image.new('RGB', (32, 32), (index * 70, 30, 80)).save(self.root / 'images' / split / 'image.png')
            (self.root / 'labels' / split / 'image.txt').write_text('0 .5 .5 .5 .5\n')
        self.config = self.root / 'data.yaml'
        self.config.write_text('path: .\ntrain: images/train\nval: images/val\ntest: images/test\nnames: [bottle]\n')
        self.weights = self.root / 'best.pt'
        self.weights.write_bytes(b'frozen checkpoint')
        self.training = {
            'status': 'completed', 'epochs_completed': 100,
            'weight_sha256': hashlib.sha256(self.weights.read_bytes()).hexdigest(),
            'dataset_sha256': validate_dataset(self.config, include_test=False)['sha256'],
        }

    def test_matches_original_training_without_changing_artifacts(self):
        original = self.config.read_bytes(), self.weights.read_bytes(), json.dumps(self.training)
        manifest = verify_test_inputs(self.config, self.training, self.weights)
        self.assertEqual(manifest['splits']['test']['images'], 1)
        self.assertNotEqual(manifest['sha256'], self.training['dataset_sha256'])
        self.assertEqual(original, (self.config.read_bytes(), self.weights.read_bytes(), json.dumps(self.training)))

    def test_rejects_changed_checkpoint_or_training_data(self):
        self.weights.write_bytes(b'another checkpoint')
        with self.assertRaisesRegex(ValueError, 'checkpoint'):
            verify_test_inputs(self.config, self.training, self.weights)
        self.weights.write_bytes(b'frozen checkpoint')
        (self.root / 'labels/train/image.txt').write_text('0 .5 .5 .4 .4\n')
        with self.assertRaisesRegex(ValueError, 'training/validation'):
            verify_test_inputs(self.config, self.training, self.weights)

    def test_rejects_overlap_and_missing_test_split(self):
        (self.root / 'images/test/image.png').write_bytes((self.root / 'images/train/image.png').read_bytes())
        with self.assertRaisesRegex(ValueError, 'Duplicate'):
            verify_test_inputs(self.config, self.training, self.weights)
        self.config.write_text(self.config.read_text().replace('test: images/test\n', ''))
        with self.assertRaisesRegex(ValueError, 'test split'):
            verify_test_inputs(self.config, self.training, self.weights)

    def test_approval_requires_matching_decisions_and_current_bytes(self):
        record = {'id': 'image', 'split': 'test', 'image': 'images/test/image.png',
                  'label_file': 'labels/test/image.txt'}
        fingerprint = hashlib.sha256(json.dumps([record], sort_keys=True).encode()).hexdigest()
        (self.root / 'manifest.json').write_text(json.dumps({'images': [record], 'fingerprint': fingerprint,
                                                           'review_status': 'user_approved'}))
        self.assertEqual(test_review_status(self.config), 'pending_user_review')
        decision = {'image_id': 'image', 'status': 'approved',
                    'image_sha256': hashlib.sha256((self.root / record['image']).read_bytes()).hexdigest(),
                    'label_sha256': hashlib.sha256((self.root / record['label_file']).read_bytes()).hexdigest()}
        (self.root / 'review-decisions.json').write_text(json.dumps({'dataset_fingerprint': fingerprint, 'images': [decision]}))
        self.assertEqual(test_review_status(self.config), 'user_approved')
        (self.root / record['label_file']).write_text('0 .5 .5 .4 .4\n')
        self.assertEqual(test_review_status(self.config), 'pending_user_review')

    def test_evaluation_only_publishes_separate_result(self):
        from scripts import evaluate_yolo
        (self.root / 'custom').mkdir()
        self.weights.replace(self.root / 'custom/best.pt')
        training_path = self.root / 'training.json'
        training_path.write_text(json.dumps(self.training))
        before = training_path.read_bytes()
        cache = self.root / 'labels/test.cache'
        cache.write_bytes(b'stale labels with unchanged byte lengths')
        calls = []

        class FrozenModel:
            def __init__(self, checkpoint, task):
                calls.append(('load', checkpoint))

            def val(self, **kwargs):
                self_cache = Path(kwargs['data']).parent / 'labels/test.cache'
                if self_cache.exists():
                    raise AssertionError('Stale label cache was not discarded')
                calls.append(('evaluate', kwargs['split']))
                return SimpleNamespace(box=SimpleNamespace(mp=.8, mr=.7, map50=.75, map=.6))

        fake = types.ModuleType('ultralytics')
        fake.YOLO, fake.__version__ = FrozenModel, 'test-version'
        utils = types.ModuleType('ultralytics.utils')
        utils.LOGGER = logging.getLogger('heldout-test')
        torch = types.ModuleType('torch')
        torch.__version__ = 'test-version'
        with patch.object(evaluate_yolo, 'ROOT', self.root), patch.dict('sys.modules', {
            'ultralytics': fake, 'ultralytics.utils': utils, 'torch': torch,
        }):
            evaluate_yolo.evaluate(self.config, 'frozen-test')
        result = json.loads((self.root / 'evaluation.json').read_text())
        self.assertEqual(result['evaluation_split'], 'test')
        self.assertEqual(result['review_status'], 'pending_user_review')
        self.assertEqual(result['metrics']['map50'], .75)
        self.assertEqual(calls[-1], ('evaluate', 'test'))
        self.assertEqual(before, training_path.read_bytes())


class EvaluationStatusTests(unittest.TestCase):
    def test_only_matching_completed_evaluation_is_public(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'custom').mkdir()
            (root / 'custom/best.pt').write_bytes(b'frozen')
            weight = hashlib.sha256(b'frozen').hexdigest()
            training = {'status': 'completed', 'message': 'Completed', 'epochs_completed': 100,
                        'weight_sha256': weight, 'dataset_sha256': 'original', 'evaluation_split': 'val',
                        'metrics': dict(precision=.8, recall=.7, map50=.75, map50_95=.6), 'history': [{'epoch': 1}]}
            (root / 'training.json').write_text(json.dumps(training))
            evaluation = {'status': 'completed', 'evaluation_split': 'test', 'review_status': 'pending_user_review',
                          'training_dataset_sha256': 'original', 'dataset_sha256': 'heldout',
                          'weight_sha256': weight, 'images': 18, 'objects': 27,
                          'metrics': dict(precision=.7, recall=.6, map50=.65, map50_95=.5),
                          'parameters': {'imgsz': 640, 'data': '/private/internal/data.yaml'}}
            (root / 'evaluation.json').write_text(json.dumps(evaluation))
            # This fixture represents a prepared full local runtime, regardless
            # of whether CI's minimal OpenCV build includes camera/display APIs.
            with (patch.object(lab6, 'ROOT', root),
                  patch.object(lab6.importlib.util, 'find_spec', return_value=object()),
                  patch.object(lab6.cv2, 'imshow', create=True),
                  patch.object(lab6.cv2, 'VideoCapture', create=True)):
                status = lab6.status().model_dump()
                self.assertEqual(status['evaluation']['images'], 18)
                self.assertEqual(status['training']['evaluation_split'], 'val')
                self.assertNotIn('data', status['evaluation']['parameters'])
                evaluation['weight_sha256'] = 'another-model'
                (root / 'evaluation.json').write_text(json.dumps(evaluation))
                self.assertIsNone(lab6.status().evaluation)
