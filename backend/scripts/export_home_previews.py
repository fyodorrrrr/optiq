"""Export static homepage examples from real lab computations; never run on page load.

Run from the repository root with backend/.venv/bin/python. Prepare LFW and
YOLO11n using the existing setup scripts first; this script does not download.
"""
import argparse
import base64
import hashlib
import io
import json
from pathlib import Path
import sys

from PIL import Image, ImageDraw, ImageOps

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

from schemas.lab1 import Grayscale
from schemas.lab2 import EdgeSettings
from schemas.lab3 import ContrastSettings
from schemas.lab4 import FeatureSettings
from schemas.lab5 import Settings as PcaSettings
from schemas.lab6 import Settings as DetectionSettings
from schemas.lab7 import Settings as SegmentationSettings
from services import images, lab1, lab2, lab3, lab4, lab5, lab6, lab7

DESTINATION = BACKEND.parent / 'frontend/src/assets/lab-previews'


def content(frame):
    return base64.b64decode(frame.image.split(',', 1)[1])


def picture(frame):
    return Image.open(io.BytesIO(content(frame))).convert('RGB')


def pair(first, second):
    canvas = Image.new('RGB', (640, 280), '#f7f7f5')
    for index, image in enumerate([picture(first), picture(second)]):
        image = ImageOps.contain(image, (304, 248), Image.Resampling.LANCZOS)
        canvas.paste(image, (index * 320 + (320 - image.width) // 2, (280 - image.height) // 2))
    return canvas


def export(labs=(1, 2, 3, 4, 5, 6, 7)):
    DESTINATION.mkdir(parents=True, exist_ok=True)
    provenance_path = DESTINATION / 'provenance.json'
    records = json.loads(provenance_path.read_text()) if provenance_path.is_file() else {}

    def comparison(number, before, after):
        for name, frame in [("before", before), ("after", after)]:
            picture(frame).save(DESTINATION / f"lab-{number}-{name}.webp", format="WEBP", lossless=number in {1, 2, 3, 4, 7}, quality=90, method=6)

    def save(number, image, record):
        image.save(DESTINATION / f'lab-{number}.webp', format='WEBP', lossless=number in {1, 2, 3, 4, 7}, quality=85, method=6)
        if number in {1, 2, 3, 4, 7}:
            sample_file = {1: 'mascot.png', 2: 'mascot-compare.png', 3: 'mascot-understand.png',
                           4: 'mascot-compare.png', 7: 'mascot-understand.png'}[number]
            record['sample_file'] = sample_file
            record['sample_sha256'] = hashlib.sha256((BACKEND / 'assets' / sample_file).read_bytes()).hexdigest()
            record['execution'] = 'recorded real lab computation; default mascot sample'
        records[str(number)] = record
        print(f'Exported Lab {number} preview', flush=True)

    if 1 in labs:
        source = images.sample_image('mascot')
        gray = lab1.execute(content(source), Grayscale(operation='grayscale'))
        comparison(1, source, gray.result)
        save(1, pair(source, gray.result), {'source': 'Optiq start learning-card scene · emerald pixel art on neutral paper', 'operation': 'grayscale', 'engine': gray.engine})

    if 2 in labs:
        edges = lab2.execute(content(lab2.sample_image('mascot')), EdgeSettings())
        comparison(2, edges.original, edges.canny)
        save(2, pair(edges.original, edges.canny), {'source': 'Optiq compare learning-card scene · grayscale', 'operation': 'Canny', 'settings': edges.parameters.model_dump(), 'engine': edges.engine})

    if 3 in labs:
        contrast = lab3.execute(content(lab3.sample_image('mascot')), ContrastSettings(mode='color'))
        comparison(3, contrast.original.frame, contrast.equalized.frame)
        chart = Image.new('RGB', (640, 370), '#f7f7f5')
        chart.paste(pair(contrast.original.frame, contrast.equalized.frame), (0, 0))
        draw = ImageDraw.Draw(chart)
        maximum = max(max(contrast.original.histogram), max(contrast.equalized.histogram), 1)
        for index, counts in enumerate([contrast.original.histogram, contrast.equalized.histogram]):
            for intensity, count in enumerate(counts):
                x = index * 320 + 32 + intensity
                draw.line((x, 350, x, 350 - round(count / maximum * 64)), fill='#087f46')
        save(3, chart, {'source': 'Optiq understand learning-card scene · low contrast: round(0.35 × channel + 90)', 'operation': 'Global histogram equalization', 'histogram': '256 bins, shared maximum count scale', 'settings': contrast.parameters.model_dump(), 'engine': contrast.engine})

    if 4 in labs:
        samples = lab4.sample_pair('mascot')
        first, _ = lab4.grayscale_image(content(samples.first))
        second, _ = lab4.grayscale_image(content(samples.second))
        feature_settings = FeatureSettings(max_features=120, max_matches=20)
        features = lab4.compare_algorithm('sift', first, second, feature_settings)
        if features.status != 'ok' or features.matches_image is None:
            raise RuntimeError('SIFT preview could not be computed; do not substitute an illustrative result.')
        save(4, ImageOps.contain(picture(features.matches_image), (640, 320)), {'source': samples.notes, 'operation': 'SIFT candidate matches', 'settings': feature_settings.model_dump(), 'verified_accuracy': False})

    if 5 in labs:
        pca_settings = PcaSettings(components=150)
        pca = lab5.execute(pca_settings)
        gallery = Image.new('RGB', (640, 350), '#f7f7f5')
        for index, component in enumerate(pca.eigenfaces[:6]):
            face = ImageOps.contain(picture(component.frame), (168, 145), Image.Resampling.NEAREST)
            gallery.paste(face, (index % 3 * 208 + (208 - face.width) // 2 + 8, index // 3 * 166 + 12))
        save(5, gallery, {'source': 'LFW prepared local dataset', 'operation': 'First six training-only PCA eigenfaces', 'settings': pca_settings.model_dump(), 'provenance': pca.provenance})

    if 6 in labs:
        detection_settings = DetectionSettings()
        detection = lab6.execute((lab6.ROOT / 'bus.jpg').read_bytes(), detection_settings)
        comparison(6, lab6.sample(), detection.output)
        save(6, ImageOps.contain(picture(detection.output), (640, 400)), {'source': 'Ultralytics bus demonstration image', 'source_url': 'https://raw.githubusercontent.com/ultralytics/ultralytics/main/ultralytics/assets/bus.jpg', 'operation': 'Pretrained YOLO11n detections', 'settings': detection_settings.model_dump(), 'provenance': detection.provenance, 'custom_training': 'Not represented by this pretrained example'})

    if 7 in labs:
        segmentation_settings = SegmentationSettings(method='region', invert=True, seed_x=240, seed_y=180)
        segmentation_source = lab7.sample('mascot')
        segmentation = lab7.execute(content(segmentation_source), segmentation_settings)
        watershed = next(view.frame for view in segmentation.views if view.title == 'Watershed regions')
        comparison(7, segmentation_source, watershed)
        save(7, pair(segmentation_source, watershed), {'source': 'Optiq understand learning-card scene · neutral paper background', 'operation': 'Watershed regions', 'settings': segmentation_settings.model_dump(), 'class_predictions': False})

    (DESTINATION / 'provenance.json').write_text(json.dumps(records, indent=2) + '\n')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--labs', type=int, nargs='+', choices=range(1, 8), default=list(range(1, 8)))
    args = parser.parse_args()
    export(args.labs)
