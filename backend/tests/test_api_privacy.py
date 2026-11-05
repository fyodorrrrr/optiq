"""Public artifacts retain learning evidence without exposing server details."""
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from api_client import api_client
from services import lab6
from services.images import ImageError
from routers.image_io import process
from fastapi import HTTPException
import asyncio


class ApiPrivacyTests(unittest.TestCase):
    def setUp(self):
        self.client = api_client()

    def test_status_filters_internal_paths_and_unrecognized_training_parameters(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(lab6, 'ROOT', Path(directory)):
            root = Path(directory)
            training = {
                'status': 'completed', 'message': 'Custom training and evaluation completed.',
                'epochs_completed': 100, 'evaluation_split': 'val', 'history': [{'epoch': 1, 'train/box_loss': .4}],
                'metrics': {'precision': .8, 'recall': .75, 'map50': .74, 'map50_95': .65},
                'weight_sha256': 'a' * 64, 'dataset_sha256': 'b' * 64,
                'run_directory': '/Users/private-user/Private Project/runs/baseline',
                'parameters': {'epochs': 100, 'imgsz': 640, 'seed': 42, 'batch': 4, 'device': 'cpu',
                               'data': '/Users/private-user/Private Project/data.yaml',
                               'project': '/Users/private-user/Private Project/runs',
                               'api_key': 'private-test-credential'},
            }
            original = json.dumps(training)
            (root / 'training.json').write_text(original)
            response = self.client.get('/api/labs/6/status')
            self.assertEqual(response.status_code, 200)
            public = response.json()['training']
            self.assertNotIn('private-user', response.text)
            self.assertNotIn('private-test-credential', response.text)
            self.assertNotIn('run_directory', public)
            self.assertEqual(public['parameters']['imgsz'], 640)
            self.assertEqual(public['history'], training['history'])
            self.assertEqual(public['metrics'], training['metrics'])
            self.assertEqual((root / 'training.json').read_text(), original)

    def test_shared_processing_errors_keep_internal_file_details_private(self):
        def fail():
            raise ImageError('Cannot read /Users/private-user/Private Project/image.png', 503)
        with self.assertRaises(HTTPException) as caught:
            asyncio.run(process(fail))
        self.assertEqual(caught.exception.status_code, 503)
        self.assertNotIn('private-user', caught.exception.detail)

    def test_failed_training_does_not_echo_internal_exception(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(lab6, 'ROOT', Path(directory)):
            (Path(directory) / 'training.json').write_text(json.dumps({
                'status': 'failed', 'message': 'Cannot open /Users/private-user/Private Project/data.yaml'}))
            response = self.client.get('/api/labs/6/status')
            self.assertEqual(response.json()['training']['status'], 'failed')
            self.assertNotIn('private-user', response.text)

    def test_log_download_redacts_paths_and_credentials_without_modifying_source(self):
        lines = [
            'Epoch 100/100 box_loss=0.4',
            "data='/Users/private-user/Private Project/data.yaml'",
            'File "/opt/private-project/services/train.py", line 3',
            '\x1b[1m/Users/private-user/Private Project/weights\x1b[0m',
            r'Output C:\Users\private-user\Private Project\weights',
            r'Output \\private-host\private-share\weights',
            'API_KEY=private-test-credential',
            'Authorization: Bearer private-bearer-token',
            'https://example.org/download?token=private-url-token',
            'Precision 0.80 Recall 0.75',
        ]
        with tempfile.TemporaryDirectory() as directory, patch.object(lab6, 'ROOT', Path(directory)):
            source = Path(directory) / 'training.log'
            original = '\n'.join(lines)
            source.write_text(original)
            response = self.client.get('/api/labs/6/artifacts/log')
            self.assertEqual(response.status_code, 200)
            for private in ['private-user', 'private-project', 'private-host', 'private-test-credential', 'private-bearer-token', 'private-url-token']:
                self.assertNotIn(private, response.text)
            self.assertIn(lines[0], response.text)
            self.assertIn(lines[-1], response.text)
            self.assertEqual(source.read_text(), original)


if __name__ == '__main__':
    unittest.main()
