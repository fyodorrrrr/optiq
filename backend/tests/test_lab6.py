import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import cv2
import numpy as np
from PIL import Image

from api_client import api_client
from services import lab6
from services.lab6_dataset import validate_dataset


def png():
    output = io.BytesIO()
    Image.new('RGB', (80, 60), (120, 120, 120)).save(output, format='PNG')
    return output.getvalue()


class Lab6Tests(unittest.TestCase):
    def setUp(self):
        self.client = api_client()

    def test_validation_and_missing_weights(self):
        for settings in [{'confidence': 0}, {'confidence': 1.1}, {'model': '../anything'}, {'confidence': True}]:
            response = self.client.post('/api/labs/6/experiment', files={'file': ('a.png', png(), 'image/png')}, data={'settings': json.dumps(settings)})
            self.assertEqual(response.status_code, 422)
        with tempfile.TemporaryDirectory() as directory, patch.object(lab6, 'ROOT', Path(directory)):
            status = self.client.get('/api/labs/6/status').json()
            self.assertFalse(status['models'][0]['available'])
            self.assertEqual(status['training']['status'], 'pending')
            response = self.client.post('/api/labs/6/experiment', files={'file': ('a.png', png(), 'image/png')}, data={'settings': '{}'})
            self.assertEqual(response.status_code, 503)
        response = self.client.post('/api/labs/6/load', files={'file': ('bad.png', b'broken', 'image/png')})
        self.assertEqual(response.status_code, 422)

    def test_review_approval_requires_exact_image_and_label_hashes(self):
        import hashlib
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for index, split in enumerate(['train', 'val']):
                (root / 'images' / split).mkdir(parents=True)
                (root / 'labels' / split).mkdir(parents=True)
                Image.new('RGB', (12, 10), (index * 80, 10, 20)).save(root / 'images' / split / 'photo.png')
                (root / 'labels' / split / 'photo.txt').write_text('0 .5 .5 .5 .5')
            config = root / 'data.yaml'
            config.write_text('train: images/train\nval: images/val\nnames: [bottle]\n')
            records = [{'image_sha256': hashlib.sha256((root / 'images' / split / 'photo.png').read_bytes()).hexdigest(),
                        'label_sha256': hashlib.sha256((root / 'labels' / split / 'photo.txt').read_bytes()).hexdigest(),
                        'status': 'approved'} for split in ['train', 'val']]
            review = root / 'review-decisions.json'
            review.write_text(json.dumps({'images': records}))
            result = validate_dataset(config)
            self.assertEqual(result['reviewed_images'], 2)
            self.assertEqual(len(result['image_splits']), 2)
            records[0]['label_sha256'] = 'changed'
            review.write_text(json.dumps({'images': records}))
            self.assertEqual(validate_dataset(config)['reviewed_images'], 0)

    def test_sample_split_requires_matching_dataset_and_image(self):
        import hashlib
        with tempfile.TemporaryDirectory() as directory, patch.object(lab6, 'ROOT', Path(directory)):
            root = Path(directory)
            (root / 'bottle.jpg').write_bytes(png())
            checksum = hashlib.sha256(png()).hexdigest()
            (root / 'dataset.json').write_text(json.dumps({'sha256': 'dataset-a', 'image_splits': {checksum: 'val'}}))
            training = {'status': 'pending', 'message': 'Pending', 'dataset_sha256': 'dataset-a'}
            (root / 'training.json').write_text(json.dumps(training))
            self.assertEqual(lab6.status().bottle_sample_split, 'val')
            training['dataset_sha256'] = 'dataset-b'
            (root / 'training.json').write_text(json.dumps(training))
            self.assertIsNone(lab6.status().bottle_sample_split)

    def test_bottle_sample_availability_content_and_invalid_selection(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(lab6, 'ROOT', Path(directory)):
            self.assertFalse(self.client.get('/api/labs/6/status').json()['bottle_sample_available'])
            self.assertEqual(self.client.get('/api/labs/6/sample?kind=bottle').status_code, 503)
            (Path(directory) / 'bottle.jpg').write_bytes(png())
            self.assertTrue(self.client.get('/api/labs/6/status').json()['bottle_sample_available'])
            response = self.client.get('/api/labs/6/sample?kind=bottle')
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()['width'], 80)
            self.assertIn('validation', ' '.join(response.json()['notes']))
            self.assertEqual(self.client.get('/api/labs/6/sample?kind=../other').status_code, 422)

    def test_boxes_preserve_original_coordinates_and_empty_result(self):
        class Boxes:
            xyxy = np.array([[10., 12., 70., 50.]])
            conf = np.array([.8])
            cls = np.array([0.])
        class Prediction:
            boxes = Boxes()
            names = {0: 'object'}
            speed = {'preprocess': 1., 'inference': 2., 'postprocess': 1.}
        class Model:
            def predict(self, **kwargs):
                self.kwargs = kwargs
                return [Prediction()]
        model = Model()
        with patch.object(lab6, 'get_model', return_value=(model, 'test-hash')):
            result = lab6.execute(png(), lab6.Settings())
            self.assertEqual(result.detections[0].xyxy, [10, 12, 70, 50])
            self.assertEqual(result.output.width, 80)
            self.assertEqual(result.output.height, 60)
            self.assertEqual(model.kwargs['imgsz'], 640)
            self.assertEqual(model.kwargs['max_det'], 100)
            self.assertEqual(model.kwargs['device'], 'cpu')
            Prediction.boxes = type('Empty', (), {'xyxy': np.empty((0, 4)), 'conf': [], 'cls': []})()
            self.assertEqual(lab6.execute(png(), lab6.Settings()).detections, [])

    def test_busy_guard(self):
        lab6.INFERENCE_LOCK.acquire()
        try:
            with self.assertRaises(lab6.ImageError) as caught:
                lab6.execute(png(), lab6.Settings())
            self.assertEqual(caught.exception.status, 409)
        finally:
            lab6.INFERENCE_LOCK.release()

    def test_dataset_validation_and_leakage(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for split in ['train', 'val']:
                (root / 'images' / split).mkdir(parents=True)
                (root / 'labels' / split).mkdir(parents=True)
                image = np.full((20, 20, 3), 0 if split == 'train' else 255, np.uint8)
                cv2.imwrite(str(root / 'images' / split / 'a.png'), image)
                (root / 'labels' / split / 'a.txt').write_text('0 0.5 0.5 0.4 0.4\n')
            config = root / 'data.yaml'
            config.write_text('train: images/train\nval: images/val\nnames: [object]\n')
            result = validate_dataset(config)
            self.assertEqual(result['splits']['train']['images'], 1)
            self.assertEqual(result['names'], ['object'])
            (root / 'labels' / 'train' / 'a.txt').write_text('0 0.99 0.5 0.4 0.4\n')
            with self.assertRaises(ValueError):
                validate_dataset(config)
            (root / 'labels' / 'train' / 'a.txt').write_text('0 0.5 0.5 0.4 0.4\n')
            (root / 'images' / 'val' / 'a.png').write_bytes((root / 'images' / 'train' / 'a.png').read_bytes())
            with self.assertRaisesRegex(ValueError, 'multiple splits'):
                validate_dataset(config)

    def test_untrusted_artifacts_are_not_completed(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(lab6, 'ROOT', Path(directory)):
            root = Path(directory)
            (root / 'training.json').write_text('{broken')
            status = lab6.status()
            self.assertEqual(status.training['status'], 'invalid')
            self.assertFalse(status.models[1].available)

    def test_incomplete_completed_artifact_is_invalid(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(lab6, 'ROOT', Path(directory)):
            (Path(directory) / 'training.json').write_text(json.dumps({'status': 'completed', 'message': 'incomplete'}))
            self.assertEqual(lab6.status().training['status'], 'invalid')

    def test_log_is_only_available_after_local_training(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(lab6, 'ROOT', Path(directory)):
            self.assertEqual(self.client.get('/api/labs/6/artifacts/log').status_code, 404)
            (Path(directory) / 'training.log').write_text('local training test log')
            response = self.client.get('/api/labs/6/artifacts/log')
            self.assertEqual(response.text, 'local training test log')
            self.assertEqual(self.client.get('/api/labs/6/artifacts/weights').status_code, 422)

    @unittest.skipUnless((lab6.ROOT / 'yolo11n.pt').is_file() and hasattr(cv2, 'imshow'), 'Run explicit YOLO setup for real-model checks.')
    def test_real_pretrained_sample_and_blank_inference(self):
        content = (lab6.ROOT / 'bus.jpg').read_bytes()
        result = lab6.execute(content, lab6.Settings())
        self.assertTrue(any(item.label == 'bus' for item in result.detections))
        for item in result.detections:
            x1, y1, x2, y2 = item.xyxy
            self.assertTrue(0 <= x1 <= x2 <= result.output.width)
            self.assertTrue(0 <= y1 <= y2 <= result.output.height)
            self.assertGreaterEqual(item.confidence, .25)
        higher = lab6.execute(content, lab6.Settings(confidence=.9))
        self.assertLessEqual(len(higher.detections), len(result.detections))
        self.assertGreater(result.elapsed_ms, 0)
        self.assertEqual(len(result.provenance['weight_sha256']), 64)
        self.assertEqual(lab6.execute(png(), lab6.Settings()).detections, [])
