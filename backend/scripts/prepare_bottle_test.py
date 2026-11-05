"""Prepare held-out bottle labels and a review page; never runs model inference."""
import argparse
import csv
import hashlib
import json
from pathlib import Path
import shutil
import sys
import tempfile

from PIL import Image, ImageDraw

from prepare_bottle_review import prepare, review_html

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))
from services.lab6_dataset import validate_dataset
from services.lab6_evaluation import file_hash

ROOT = BACKEND / '.cache/lab6'


def prepare_test(baseline, output, selection):
    if output.exists():
        raise ValueError('Test pack already exists. Use a new output path; never overwrite review history.')
    original = json.loads((baseline / 'manifest.json').read_text())
    training = json.loads((ROOT / 'training.json').read_text())
    original_validation = validate_dataset(baseline / 'data.yaml')
    if original_validation['sha256'] != training.get('dataset_sha256'):
        raise ValueError('Baseline data does not match the frozen training artifact.')
    curated = json.loads(selection.read_text())
    old_ids = {r['id'] for r in original['images']}
    old_authors = {r['author_url'] or r['author'] for r in original['images']}
    with tempfile.TemporaryDirectory() as staging:
        draft = Path(staging) / 'draft'
        prepare(draft, len(curated['image_ids']), curated['seed'], selection)
        draft_manifest = json.loads((draft / 'manifest.json').read_text())
        records = draft_manifest['images']
        for record in records:
            if record['id'] in old_ids or (record['author_url'] or record['author']) in old_authors:
                raise ValueError('Held-out source ID or photographer overlaps baseline data.')
            if any(record['decoded_sha256'] == previous['decoded_sha256'] or
                   (int(record['dhash'], 16) ^ int(previous['dhash'], 16)).bit_count() <= 3
                   for previous in original['images']):
                raise ValueError('Held-out image matches or closely resembles baseline content.')
        output.mkdir(parents=True)
        for category in ['images', 'labels']:
            for split in ['train', 'val']:
                shutil.copytree(baseline / category / split, output / category / split)
            (output / category / 'test').mkdir()
        (output / 'previews').mkdir()
        for number, record in enumerate(records, 1):
            image_source, label_source = draft / record['image'], draft / record['label_file']
            record.update(review_number=number, split='test', image=f"images/test/{record['id']}.jpg",
                          label_file=f"labels/test/{record['id']}.txt", review_status='pending',
                          assistant_review='visual_check_before_inference')
            shutil.copy2(image_source, output / record['image'])
            shutil.copy2(label_source, output / record['label_file'])
            shutil.copy2(draft / record['preview'], output / record['preview'])
        manifest = {
            'status': 'heldout_test_labels_pending_user_review', 'review_status': 'pending_user_review',
            'class_names': ['bottle'], 'images': records, 'curation': curated,
            'source_metadata': draft_manifest['source_metadata'],
            'annotation_origin': 'Published human annotations converted to YOLO; assistant visually checked, user review pending.',
            'training_dataset_sha256': original_validation['sha256'],
            'frozen_weight_sha256': file_hash(ROOT / 'custom/best.pt'),
            'split_policy': 'New local test images from the public validation pool; new photographers, exact decoded hashes and conservative dHash checks. Not an official benchmark test split. No claim about pretraining overlap.',
        }
        manifest['fingerprint'] = hashlib.sha256(json.dumps(records, sort_keys=True).encode()).hexdigest()
        (output / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
        page = review_html(records, manifest['fingerprint'], output)
        page = page.replace('training has not started.', 'these test labels have not been approved by you. The trained model stays frozen.')
        page = page.replace('This is a small learning subset, not a completed training/evaluation run. Local train/val splits differ from the source dataset splits.', 'This is a small local held-out test subset, not an official benchmark split. Evaluation does not retrain the model.')
        (output / 'review.html').write_text(page)
        # Absolute root avoids Ultralytics resolving path: . against another working directory.
        (output / 'data.yaml').write_text(f'path: {output.resolve()}\ntrain: images/train\nval: images/val\ntest: images/test\nnames: [bottle]\n')
        with (output / 'attribution.csv').open('w', newline='') as handle:
            columns = ['id', 'author', 'author_url', 'source_page', 'image_license', 'annotation_license']
            writer = csv.DictWriter(handle, fieldnames=columns)
            writer.writeheader()
            writer.writerows({key: r[key] for key in columns} for r in records)
        for start in range(0, len(records), 6):
            sheet = Image.new('RGB', (1200, 1080), '#f7f7f5')
            draw = ImageDraw.Draw(sheet)
            for slot, record in enumerate(records[start:start + 6]):
                preview = Image.open(output / record['preview'])
                preview.thumbnail((580, 310))
                x, y = slot % 2 * 600, slot // 2 * 360
                sheet.paste(preview, (x + (600 - preview.width) // 2, y + 32 + (310 - preview.height) // 2))
                draw.text((x + 12, y + 5), f"#{record['review_number']} {record['id']} | test | {len(record['labels'])} boxes", fill='#171717')
            sheet.save(output / f'contact-sheet-{start // 6 + 1:02d}.jpg')
        result = validate_dataset(output / 'data.yaml')
        (output / 'validation.json').write_text(json.dumps(result, indent=2) + '\n')
        print(json.dumps({'output': str(output), 'test': result['splits']['test'], 'review': 'pending_user_review'}, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--baseline', type=Path, default=ROOT / 'datasets/openimages-bottle-reviewed-v1')
    parser.add_argument('--output', type=Path, default=ROOT / 'datasets/bottle-heldout-test-v1')
    parser.add_argument('--selection', type=Path, default=Path(__file__).with_name('bottle_test_selection.json'))
    args = parser.parse_args()
    prepare_test(args.baseline.resolve(), args.output.resolve(), args.selection.resolve())
