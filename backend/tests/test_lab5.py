import unittest
from unittest.mock import patch

import numpy as np
from sklearn.utils import Bunch
from sklearn.metrics import accuracy_score

from api_client import api_client
from services import lab5


def dataset():
    rng = np.random.default_rng(42)
    images = rng.random((80, 6, 6), dtype=np.float32)
    return Bunch(images=images, data=images.reshape(80, -1), target=np.arange(80) % 2,
                 target_names=np.array(['Person A', 'Person B']))


class Lab5Tests(unittest.TestCase):
    def setUp(self):
        self.client = api_client()

    def test_missing_dataset_and_validation(self):
        with patch.object(lab5, 'load_dataset', side_effect=lab5.DatasetUnavailable('Prepare LFW first.')):
            self.assertFalse(self.client.get('/api/labs/5/dataset').json()['ready'])
            self.assertEqual(self.client.post('/api/labs/5/experiment', json={'components': 12}).status_code, 503)
        for value in [0, 11, 301, 12.5, True]:
            self.assertEqual(self.client.post('/api/labs/5/experiment', json={'components': value}).status_code, 422)

    @patch.object(lab5, 'load_dataset', side_effect=dataset)
    def test_real_pipeline_metrics_and_split(self, _):
        result = self.client.post('/api/labs/5/experiment', json={'components': 12})
        self.assertEqual(result.status_code, 200, result.text)
        body = result.json()
        self.assertEqual(body['train_count'], 64)
        self.assertEqual(body['test_count'], 16)
        self.assertFalse(set(body['train_indices']) & set(body['test_indices']))
        self.assertAlmostEqual(body['accuracy'], accuracy_score(body['actual'], body['predicted']))
        self.assertEqual(body['misclassified_count'], sum(a != b for a, b in zip(body['actual'], body['predicted'])))
        curve = body['cumulative_variance']
        k = body['components_90']
        self.assertGreaterEqual(curve[k - 1], .9)
        if k > 1:
            self.assertLess(curve[k - 2], .9)
        self.assertEqual(len(body['eigenfaces']), 12)
        self.assertTrue(all(row['actual'] != row['predicted'] for row in body['failures']))
        self.assertEqual(sum(row['support'] for row in body['report'] if row['kind'] == 'class'), 16)

    @patch.object(lab5, 'load_dataset', side_effect=dataset)
    def test_pca_fits_training_only_and_is_repeatable(self, _):
        from sklearn.decomposition import PCA
        original = PCA.fit
        seen = []
        def fit(instance, values, *args, **kwargs):
            seen.append(values.copy())
            return original(instance, values, *args, **kwargs)
        with patch.object(PCA, 'fit', fit):
            first = lab5.execute(lab5.Settings(components=12))
        expected = dataset().data[first.train_indices]
        self.assertTrue(seen)
        for values in seen:
            np.testing.assert_array_equal(values, expected)
        second = lab5.execute(lab5.Settings(components=12))
        self.assertEqual(first.predicted, second.predicted)
        self.assertEqual(first.eigenfaces, second.eigenfaces)

    @patch.object(lab5, 'load_dataset', side_effect=dataset)
    def test_dataset_rank_limit_and_busy_guard(self, _):
        self.assertEqual(self.client.post('/api/labs/5/experiment', json={'components': 50}).status_code, 422)
        lab5.RUN_LOCK.acquire()
        try:
            self.assertEqual(self.client.post('/api/labs/5/experiment', json={'components': 12}).status_code, 409)
        finally:
            lab5.RUN_LOCK.release()

    @patch.object(lab5, 'load_dataset', side_effect=dataset)
    def test_no_misclassifications_and_lock_released_after_error(self, _):
        from sklearn.model_selection import train_test_split
        _, indices = train_test_split(np.arange(80), test_size=.2, random_state=42)
        with patch.object(lab5.SVC, 'predict', return_value=dataset().target[indices]):
            result = lab5.execute(lab5.Settings(components=12))
        self.assertEqual(result.misclassified_count, 0)
        self.assertEqual(result.failures, [])
        with patch.object(lab5, 'fit_experiment', side_effect=RuntimeError('test failure')):
            with self.assertRaises(RuntimeError):
                lab5.execute(lab5.Settings(components=12))
        self.assertFalse(lab5.RUN_LOCK.locked())
