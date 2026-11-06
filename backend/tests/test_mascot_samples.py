import base64
import json
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

import cv2
import numpy as np
from PIL import Image

from api_client import api_client


def decoded(frame):
    return cv2.imdecode(np.frombuffer(base64.b64decode(frame['image'].split(',')[1]), np.uint8), cv2.IMREAD_UNCHANGED)


class MascotSampleTests(unittest.TestCase):
    def setUp(self):
        self.client = api_client()

    def sample(self, lab, kind='mascot'):
        response = self.client.get(f'/api/labs/{lab}/sample?kind={kind}')
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()

    def test_shared_color_sample_is_repeatable_and_old_samples_remain(self):
        source = self.sample(1)
        self.assertEqual(source, self.sample(1))
        self.assertEqual(source['shape'], [360, 480, 3])
        self.assertTrue(any('mascot' in note.lower() for note in source['notes']))
        self.assertLessEqual(source['width'] * source['height'], 350000)
        self.assertFalse(np.array_equal(decoded(source), decoded(self.sample(7))))
        image = decoded(source).astype(np.int16)
        self.assertEqual(image[0, 0].tolist(), [245, 247, 247])
        # A presentation border must not become an edge in the algorithm input.
        np.testing.assert_array_equal(image[12, :, :], np.tile([245, 247, 247], (480, 1)))
        self.assertTrue(np.any((image[:, :, 1] > image[:, :, 0] + 20) & (image[:, :, 1] > image[:, :, 2] + 20)))
        for lab, kinds in {1: ['color', 'grayscale'], 2: ['shapes', 'noisy'],
                           3: ['low-contrast', 'uneven', 'color'],
                           4: ['rotated', 'scaled'], 7: ['touching', 'uneven', 'contours']}.items():
            for kind in kinds:
                self.sample(lab, kind)

    def test_edge_sample_matches_real_grayscale_and_produces_edges(self):
        from services.images import mascot_image
        color, _ = mascot_image('compare')
        edge = self.sample(2)
        self.assertEqual(edge['channels'], 1)
        np.testing.assert_array_equal(decoded(edge), cv2.cvtColor(color, cv2.COLOR_BGR2GRAY))
        response = self.client.post('/api/labs/2/experiment', files={
            'file': ('mascot.png', base64.b64decode(edge['image'].split(',')[1]), 'image/png')}, data={'settings': '{}'})
        self.assertEqual(response.status_code, 200, response.text)
        self.assertGreater(response.json()['statistics']['canny_edge_pixels'], 0)

    def test_contrast_sample_is_labeled_compressed_and_changes_under_equalization(self):
        sample = self.sample(3)
        image = decoded(sample)
        self.assertEqual(sample['channels'], 3)
        self.assertLessEqual(int(image.max()) - int(image.min()), 90)
        self.assertTrue(any('low-contrast' in note.lower() for note in sample['notes']))
        response = self.client.post('/api/labs/3/experiment', files={
            'file': ('mascot.png', base64.b64decode(sample['image'].split(',')[1]), 'image/png')},
            data={'settings': json.dumps({'mode': 'color'})})
        self.assertEqual(response.status_code, 200, response.text)
        result = response.json()
        self.assertNotEqual(result['original']['frame']['image'], result['equalized']['frame']['image'])

    def test_feature_pair_has_real_geometric_transform_and_usable_matches(self):
        from services.images import mascot_image
        pair = self.sample(4)
        color, _ = mascot_image('compare')
        np.testing.assert_array_equal(decoded(pair['first']), color)
        self.assertEqual(pair['first']['shape'], pair['second']['shape'])
        self.assertNotEqual(pair['first']['image'], pair['second']['image'])
        response = self.client.post('/api/labs/4/experiment', files={
            key: (f'{key}.png', base64.b64decode(pair[key]['image'].split(',')[1]), 'image/png')
            for key in ('first', 'second')}, data={'settings': '{}'})
        self.assertEqual(response.status_code, 200, response.text)
        sift = next(item for item in response.json()['algorithms'] if item['algorithm'] == 'sift')
        self.assertEqual(sift['status'], 'ok')
        self.assertGreater(sift['good_matches'], 0)

    def test_classical_segmentation_accepts_mascot_for_each_method(self):
        sample = self.sample(7)
        for method in ('threshold', 'region', 'edges'):
            response = self.client.post('/api/labs/7/experiment', files={
                'file': ('mascot.png', base64.b64decode(sample['image'].split(',')[1]), 'image/png')},
                data={'settings': json.dumps({'method': method, 'invert': True, 'seed_x': 240, 'seed_y': 180})})
            self.assertEqual(response.status_code, 200, response.text)
            self.assertTrue(response.json()['views'])

    def test_selective_preview_export_preserves_unselected_labs(self):
        from scripts import export_home_previews as exporter
        with TemporaryDirectory() as directory:
            destination = Path(directory)
            retained = {'5': {'source': 'retained PCA'}, '6': {'source': 'retained detection'}}
            (destination / 'provenance.json').write_text(json.dumps(retained))
            (destination / 'lab-5.webp').write_bytes(b'unchanged existing asset')
            with patch.object(exporter, 'DESTINATION', destination), \
                    patch.object(exporter.lab5, 'execute', side_effect=AssertionError('PCA must not run')), \
                    patch.object(exporter.lab6, 'execute', side_effect=AssertionError('Detection must not run')):
                exporter.export((1, 2, 3, 4, 7))
            records = json.loads((destination / 'provenance.json').read_text())
            self.assertEqual(records['5'], retained['5'])
            self.assertEqual(records['6'], retained['6'])
            self.assertEqual((destination / 'lab-5.webp').read_bytes(), b'unchanged existing asset')
            source = decoded(self.sample(1))
            # Lossless before-image is the exact RGB transport image, not a mockup.
            before = np.asarray(Image.open(destination / 'lab-1-before.webp').convert('RGB'))
            np.testing.assert_array_equal(before, cv2.cvtColor(source, cv2.COLOR_BGR2RGB))
            for lab in (1, 2, 3, 4, 7):
                self.assertTrue((destination / f'lab-{lab}.webp').is_file())
                self.assertIn('sample_sha256', records[str(lab)])
