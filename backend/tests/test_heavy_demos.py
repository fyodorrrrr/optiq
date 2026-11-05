import base64
import hashlib
import io
import json
from pathlib import Path
import unittest

from PIL import Image
from schemas.lab6 import Result as DetectionResult, Status
from schemas.lab7 import Result as SemanticResult

ROOT = Path(__file__).resolve().parents[2] / 'frontend/public/demos'


class HeavyDemoTests(unittest.TestCase):
    def bundle(self, lab):
        root = ROOT / f'lab{lab}'
        index = json.loads((root / 'manifest.json').read_text())
        self.assertEqual(index['execution'], 'precomputed')
        self.assertEqual(index['schema_version'], 1)
        samples = {item['id']: item for item in index['samples']}
        combinations = {(run['sample'], run['parameters'].get('model', 'semantic'),
                         run['parameters'].get('confidence', run['parameters'].get('opacity')))
                        for run in index['runs']}
        expected = {(sample, model, value) for sample in ('bus', 'bottle')
                    for model in (('custom', 'pretrained') if lab == 6 else ('semantic',))
                    for value in (.25, .5, .75)}
        self.assertEqual(combinations, expected)
        self.assertEqual(len({run['id'] for run in index['runs']}), len(index['runs']))
        self.assertEqual(set(samples), {'bus', 'bottle'})
        self.assertTrue(any('Feeling My Age' in note for note in samples['bottle']['frame']['notes']))
        for sample in samples.values():
            data = base64.b64decode(sample['frame']['image'].split(',', 1)[1])
            self.assertEqual(hashlib.sha256(data).hexdigest(), sample['input_sha256'])
            self.assertLessEqual(max(sample['frame']['width'], sample['frame']['height']), 640 if lab == 6 else 480)
        for run in index['runs']:
            content = (root / run['file']).read_bytes()
            self.assertEqual(hashlib.sha256(content).hexdigest(), run['sha256'])
            result = (DetectionResult if lab == 6 else SemanticResult).model_validate_json(content)
            self.assertEqual(result.provenance['execution'], 'precomputed demonstration')
            self.assertEqual(result.provenance['input_sha256'], samples[run['sample']]['input_sha256'])
            self.assertEqual(result.provenance['source_service_sha256'], index['source_service_sha256'])
            for key, value in run['parameters'].items():
                self.assertEqual(getattr(result.parameters, key), value)
            yield index, samples[run['sample']], result

    def test_detection_bundles_match_real_checkpoint_and_coordinates(self):
        results = list(self.bundle(6))
        self.assertEqual(len(results), 12)
        status = Status.model_validate(results[0][0]['context'])
        self.assertEqual(status.evaluation.review_status, 'user_approved')
        self.assertEqual(status.training['dataset_sha256'], status.dataset['sha256'])
        for index, sample, result in results:
            self.assertEqual(result.output.width, sample['frame']['width'])
            self.assertEqual(result.output.height, sample['frame']['height'])
            if result.parameters.model == 'custom':
                self.assertEqual(result.provenance['weight_sha256'], status.training['weight_sha256'])
            for detection in result.detections:
                self.assertGreaterEqual(detection.confidence, result.parameters.confidence)
                x1, y1, x2, y2 = detection.xyxy
                self.assertTrue(0 <= x1 <= x2 <= result.output.width)
                self.assertTrue(0 <= y1 <= y2 <= result.output.height)
                if result.parameters.model == 'custom':
                    self.assertEqual(detection.label, 'bottle')
        log = ROOT / 'lab6' / index['training_log']['file']
        self.assertEqual(hashlib.sha256(log.read_bytes()).hexdigest(), index['training_log']['sha256'])
        for private_prefix in ('/Users/', '/home/', '/opt/optiq/'):
            self.assertNotIn(private_prefix, log.read_text())
            self.assertNotIn(private_prefix, json.dumps(index['context']))

    def test_bottle_default_uses_640px_input_and_shows_real_detection(self):
        root = ROOT / 'lab6'
        index = json.loads((root / 'manifest.json').read_text())
        self.assertEqual(index['default_run'], 'bottle-custom-25')
        result = DetectionResult.model_validate_json((root / 'bottle-custom-25.json').read_text())
        self.assertTrue(any(item.label == 'bottle' for item in result.detections))
        self.assertEqual((result.output.width, result.output.height), (640, 640))

    def test_semantic_labels_and_legend_counts_match(self):
        results = list(self.bundle(7))
        self.assertEqual(len(results), 6)
        for _, sample, result in results:
            self.assertEqual(result.parameters.method, 'semantic')
            self.assertEqual(len(result.views), 2)
            labels = Image.open(io.BytesIO(base64.b64decode(result.labels_png.split(',', 1)[1])))
            self.assertEqual(labels.size, (sample['frame']['width'], sample['frame']['height']))
            counts = {}
            for label in labels.get_flattened_data():
                self.assertTrue(0 <= label <= 20)
                counts[label] = counts.get(label, 0) + 1
            self.assertEqual({item.id: item.pixels for item in result.legend}, counts)
            self.assertNotIn('iou', result.measurements)
