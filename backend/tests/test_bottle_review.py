"""Checks for reproducible, bounded conversion of published annotation data."""
import importlib.util
import base64
import json
import tempfile

from PIL import Image
from pathlib import Path
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / 'scripts/prepare_bottle_review.py'
spec = importlib.util.spec_from_file_location('prepare_bottle_review', SCRIPT)
review = importlib.util.module_from_spec(spec)
spec.loader.exec_module(review)


def box(**changes):
    return {'XMin': '.1', 'XMax': '.5', 'YMin': '.2', 'YMax': '.8',
            'IsGroupOf': '0', 'IsDepiction': '0', **changes}


class BottleReviewTests(unittest.TestCase):
    def test_published_corners_convert_to_yolo_center_and_size(self):
        converted = review.to_yolo(box())
        self.assertEqual(converted[0], 0)
        for actual, expected in zip(converted[1:], [.3, .5, .4, .6]):
            self.assertAlmostEqual(actual, expected)

    def test_invalid_source_boxes_are_rejected_instead_of_silently_clipped(self):
        for invalid in [box(XMin='-.1'), box(XMax='1.1'), box(XMax='.1'), box(YMin='nan'), box(YMax='inf')]:
            with self.subTest(box=invalid), self.assertRaises(ValueError):
                review.to_yolo(invalid)

    def test_review_page_embeds_photos_without_changing_records_or_fingerprint(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            photo = root / 'sample.jpg'
            Image.new('RGB', (8, 6), 'green').save(photo)
            records = [{'id': 'sample', 'image': 'sample.jpg', 'title': '</script>example'}]
            html = review.review_html(records, 'original-fingerprint', root)
            payload, _ = json.JSONDecoder().raw_decode(html.split('const dataset=', 1)[1])
            embedded = payload['images'][0]['display_image']
            self.assertEqual(base64.b64decode(embedded.split(',', 1)[1]), photo.read_bytes())
            self.assertEqual(payload['fingerprint'], 'original-fingerprint')
            self.assertNotIn('display_image', records[0])
            self.assertEqual(html.count('</script>'), 1)
            self.assertIn('<img id="photo"', html)

    def test_selection_preserves_one_photograph_per_author_and_filters_ambiguous_cases(self):
        boxes = {str(i): [box()] for i in range(8)}
        metadata = {str(i): {'License': 'https://creativecommons.org/licenses/by/2.0/',
                            'Rotation': '0.0', 'AuthorProfileURL': f'author-{i}'} for i in range(8)}
        metadata['1']['AuthorProfileURL'] = metadata['0']['AuthorProfileURL']
        boxes['2'] = [box(IsGroupOf='1')]
        boxes['3'] = [box(IsDepiction='1')]
        metadata['4']['Rotation'] = '90.0'
        metadata['5']['License'] = ''
        boxes['6'] = [box(XMax='.11', YMax='.21')]
        chosen = review.candidates(boxes, metadata, 42)
        self.assertEqual(chosen, review.candidates(boxes, metadata, 42))
        self.assertEqual(len(chosen), 2)
        self.assertEqual(len({metadata[i]['AuthorProfileURL'] for i in chosen}), 2)
        self.assertFalse(set(chosen) & {'2', '3', '4', '5', '6'})


if __name__ == '__main__':
    unittest.main()
