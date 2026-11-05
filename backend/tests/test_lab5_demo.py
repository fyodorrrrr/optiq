"""Validate the actual static demonstration bundle without ML dependencies/data."""
import hashlib
import json
from pathlib import Path
import unittest

from schemas.lab5 import Result

ROOT = Path(__file__).resolve().parents[2] / 'frontend/public/demos/lab5'


class Lab5DemoTests(unittest.TestCase):
    def test_saved_runs_are_real_consistent_and_hash_bound(self):
        manifest = json.loads((ROOT / 'manifest.json').read_text())
        self.assertEqual(manifest['schema_version'], 1)
        self.assertEqual(manifest['execution'], 'precomputed')
        self.assertEqual([item['components'] for item in manifest['runs']], [25, 75, 150])
        previous = None
        for item in manifest['runs']:
            content = (ROOT / item['file']).read_bytes()
            self.assertEqual(hashlib.sha256(content).hexdigest(), item['sha256'])
            result = Result.model_validate_json(content)
            self.assertEqual(result.parameters.components, item['components'])
            self.assertEqual(result.provenance['dataset_sha256'], manifest['dataset_sha256'])
            self.assertEqual(result.provenance['execution'], 'precomputed demonstration')
            self.assertEqual(result.provenance['source_service_sha256'], manifest['source_service_sha256'])
            self.assertEqual(result.test_count, len(result.actual))
            self.assertEqual(result.test_count, len(result.predicted))
            correct = sum(a == b for a, b in zip(result.actual, result.predicted))
            self.assertAlmostEqual(result.accuracy, correct / result.test_count)
            self.assertEqual(result.misclassified_count, result.test_count - correct)
            self.assertFalse(set(result.train_indices) & set(result.test_indices))
            self.assertEqual(result.train_count + result.test_count, result.dataset.samples)
            self.assertEqual(len(result.eigenfaces), 12)
            self.assertEqual(result.tail_eigenfaces[-1].component, item['components'])
            self.assertGreaterEqual(result.cumulative_variance[result.components_90 - 1], .9)
            self.assertTrue(all(face.actual != face.predicted for face in result.failures))
            if previous:
                self.assertEqual(result.train_indices, previous.train_indices)
                self.assertEqual(result.test_indices, previous.test_indices)
                self.assertEqual(result.actual, previous.actual)
            previous = result
