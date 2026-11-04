"""Prepare a review-only, attributed Open Images bottle subset. Never trains a model."""
import argparse
import base64
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
import csv
import hashlib
import io
import json
import math
from pathlib import Path
import urllib.request

from PIL import Image, ImageDraw, ImageFont

BACKEND = Path(__file__).resolve().parents[1]
CACHE = BACKEND / '.cache/lab6/dataset-review'
DEFAULT_OUTPUT = BACKEND / '.cache/lab6/datasets/openimages-bottle-reviewed-v1'
BOTTLE = '/m/04dr76w'
SOURCES = {
    'classes': ('openimages-class-descriptions.csv', 'https://storage.googleapis.com/openimages/v5/class-descriptions-boxable.csv'),
    'boxes': ('openimages-validation-boxes.csv', 'https://storage.googleapis.com/openimages/v5/validation-annotations-bbox.csv'),
    'images': ('openimages-validation-images.csv', 'https://storage.googleapis.com/openimages/2018_04/validation/validation-images-with-rotation.csv'),
}


def fetch(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'Optiq-Lab6-dataset-review/1.0'})
    with urllib.request.urlopen(request, timeout=45) as response:
        return response.read()


def to_yolo(box):
    xmin, xmax, ymin, ymax = (float(box[key]) for key in ['XMin', 'XMax', 'YMin', 'YMax'])
    if not all(math.isfinite(value) for value in [xmin, xmax, ymin, ymax]) or not (0 <= xmin < xmax <= 1 and 0 <= ymin < ymax <= 1):
        raise ValueError('Source box must have positive dimensions within normalized image bounds.')
    return [0, (xmin + xmax) / 2, (ymin + ymax) / 2, xmax - xmin, ymax - ymin]


def stable_order(value, seed):
    return hashlib.sha256(f'{seed}:{value}'.encode()).hexdigest()


def candidates(boxes, metadata, seed):
    suitable = []
    for image_id, rows in boxes.items():
        info = metadata.get(image_id)
        if not info or info.get('License') != 'https://creativecommons.org/licenses/by/2.0/' or info.get('Rotation') != '0.0':
            continue
        if len(rows) > 5 or any(row['IsGroupOf'] == '1' or row['IsDepiction'] == '1' for row in rows):
            continue
        labels = [to_yolo(row) for row in rows]
        if min(label[3] * label[4] for label in labels) < .0015 or max(label[3] * label[4] for label in labels) < .035:
            continue
        suitable.append(image_id)
    singles = sorted((i for i in suitable if len(boxes[i]) == 1), key=lambda i: stable_order(i, seed))
    multiples = sorted((i for i in suitable if len(boxes[i]) > 1), key=lambda i: stable_order(i, seed))
    # Interleave to retain both simple and multi-bottle scenes in the review batch.
    order = []
    while singles or multiples:
        if multiples:
            order.append(multiples.pop(0))
        for _ in range(2):
            if singles:
                order.append(singles.pop(0))
    authors = set()
    result = []
    for image_id in order:
        author = metadata[image_id].get('AuthorProfileURL') or metadata[image_id].get('Author')
        if not author or author in authors:
            continue
        authors.add(author)
        result.append(image_id)
    return result


def dhash(image):
    pixels = list(image.convert('L').resize((9, 8)).tobytes())
    result = 0
    for y in range(8):
        for x in range(8):
            result = (result << 1) | (pixels[y * 9 + x] > pixels[y * 9 + x + 1])
    return result


def review_html(records, fingerprint, image_root=None):
    template = (Path(__file__).with_name('bottle_review.html')).read_text()
    display_records = [{**item, 'display_image': 'data:image/jpeg;base64,' + base64.b64encode((image_root / item['image']).read_bytes()).decode()} for item in records] if image_root else records
    payload = json.dumps({'images': display_records, 'fingerprint': fingerprint}, ensure_ascii=False).replace('<', '\\u003c')
    return template.replace('/*REVIEW_DATA*/', payload)


def prepare(output, count, seed, selection_path=None):
    if count < 10 or count > 100:
        raise ValueError('Use 10–100 images for this bounded review workflow.')
    if (output / 'manifest.json').exists():
        raise ValueError('Review dataset already exists. Use a new --output path to preserve its review history.')
    CACHE.mkdir(parents=True, exist_ok=True)
    source_records = {}
    for key, (filename, url) in SOURCES.items():
        path = CACHE / filename
        if not path.is_file():
            path.write_bytes(fetch(url))
        source_records[key] = {'url': url, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
    boxes = defaultdict(list)
    for row in csv.DictReader((CACHE / SOURCES['boxes'][0]).open()):
        if row['LabelName'] == BOTTLE:
            boxes[row['ImageID']].append(row)
    metadata = {row['ImageID']: row for row in csv.DictReader((CACHE / SOURCES['images'][0]).open()) if row['ImageID'] in boxes}
    order = candidates(boxes, metadata, seed)
    selection = json.loads(selection_path.read_text()) if selection_path else None
    if selection:
        requested = selection['image_ids']
        if len(set(requested)) != count or len(requested) != count or not set(requested).issubset(order):
            raise ValueError('Selection must contain the requested number of unique eligible image IDs.')
        order = requested
    downloads = CACHE / 'openimages-bottle-downloads'
    downloads.mkdir(exist_ok=True)

    def download(image_id):
        url = f'https://open-images-dataset.s3.amazonaws.com/validation/{image_id}.jpg'
        path = downloads / f'{image_id}.jpg'
        try:
            if not path.exists():
                path.write_bytes(fetch(url))
            raw = path.read_bytes()
            with Image.open(io.BytesIO(raw)) as image:
                image.load()
                if image.format != 'JPEG' or image.width > 4096 or image.height > 4096 or image.width * image.height > 4_000_000:
                    raise ValueError('Image exceeds Optiq limits or is not JPEG.')
                image = image.convert('RGB')
                decoded = hashlib.sha256(str(image.size).encode() + image.tobytes()).hexdigest()
                return image_id, raw, image, decoded, dhash(image), None
        except Exception as error:
            return image_id, None, None, None, None, str(error)

    selected, skipped = [], []
    for start in range(0, len(order), 12):
        with ThreadPoolExecutor(max_workers=4) as pool:
            batch = list(pool.map(download, order[start:start + 12]))
        for image_id, raw, image, decoded, perceptual, error in batch:
            if len(selected) >= count:
                break
            if error:
                skipped.append({'image_id': image_id, 'reason': error})
                continue
            if any(item['decoded_sha256'] == decoded or (int(item['dhash'], 16) ^ perceptual).bit_count() <= 3 for item in selected):
                skipped.append({'image_id': image_id, 'reason': 'Exact duplicate or highly similar dHash; excluded conservatively.'})
                continue
            info = metadata[image_id]
            labels = []
            for row in boxes[image_id]:
                label = to_yolo(row)
                if label not in labels:
                    labels.append(label)
            selected.append({
                'id': image_id, 'width': image.width, 'height': image.height, 'labels': labels,
                'source_dataset': 'Open Images V7; V5 validation bounding-box release',
                'source_split': 'validation', 'source_class': BOTTLE, 'source_boxes': boxes[image_id],
                'image_url': f'https://open-images-dataset.s3.amazonaws.com/validation/{image_id}.jpg',
                'source_page': info['OriginalLandingURL'], 'author': info['Author'], 'author_url': info['AuthorProfileURL'],
                'title': info['Title'], 'image_license': info['License'],
                'annotation_license': 'https://creativecommons.org/licenses/by/4.0/',
                'download_sha256': hashlib.sha256(raw).hexdigest(), 'decoded_sha256': decoded, 'dhash': f'{perceptual:016x}',
                'annotation_origin': 'Published Open Images bounding boxes converted to normalized YOLO; not newly hand-drawn or model predictions.',
                'review_status': 'pending', 'assistant_review': 'contact_sheet_checked' if selection else 'pending',
                'assistant_notes': selection.get('notes', {}).get(image_id, '') if selection else '',
                'flags': sorted({flag for row in boxes[image_id] for flag in ['IsOccluded', 'IsTruncated', 'IsInside'] if row[flag] == '1'}),
            })
            print(f'Selected {len(selected)}/{count}: {image_id} ({len(labels)} boxes)', flush=True)
        if len(selected) >= count:
            break
    if len(selected) != count:
        raise ValueError(f'Only {len(selected)} suitable images available; no incomplete dataset exported.')
    val_count = max(2, round(count * .2))
    validation = {item['id'] for item in sorted(selected, key=lambda item: stable_order(item['id'], seed + 1))[:val_count]}
    output.mkdir(parents=True, exist_ok=True)
    (output / 'previews').mkdir(exist_ok=True)
    font_path = Path('/System/Library/Fonts/Helvetica.ttc')
    font = ImageFont.truetype(str(font_path), 18) if font_path.exists() else ImageFont.load_default(size=18)
    for index, item in enumerate(selected, 1):
        image_id = item['id']
        split = 'val' if image_id in validation else 'train'
        item.update({'review_number': index, 'split': split, 'image': f'images/{split}/{image_id}.jpg', 'label_file': f'labels/{split}/{image_id}.txt', 'preview': f'previews/{image_id}.jpg'})
        for parent in ['images', 'labels']:
            (output / parent / split).mkdir(parents=True, exist_ok=True)
        raw = (downloads / f'{image_id}.jpg').read_bytes()
        (output / item['image']).write_bytes(raw)
        lines = ['0 ' + ' '.join(f'{value:.8f}' for value in label[1:]) for label in item['labels']]
        label_data = ('\n'.join(lines) + '\n').encode()
        (output / item['label_file']).write_bytes(label_data)
        item['label_sha256'] = hashlib.sha256(label_data).hexdigest()
        image = Image.open(io.BytesIO(raw)).convert('RGB')
        draw = ImageDraw.Draw(image)
        for box_index, (_, x, y, width, height) in enumerate(item['labels'], 1):
            bounds = [(x-width/2)*image.width, (y-height/2)*image.height, (x+width/2)*image.width, (y+height/2)*image.height]
            draw.rectangle(bounds, outline='#00ef8b', width=3)
            draw.text((bounds[0]+3, max(0, bounds[1]-23)), f'bottle {box_index}', font=font, fill='#00ef8b', stroke_width=2, stroke_fill='#10251c')
        image.save(output / item['preview'], quality=90)
    manifest = {
        'status': 'draft_pending_user_review', 'class_names': ['bottle'], 'seed': seed,
        'source_metadata': source_records, 'source_dataset_url': 'https://storage.googleapis.com/openimages/web/download_v7.html',
        'annotation_origin': 'Official human-annotated Open Images boxes converted to YOLO; user review pending.',
        'split_policy': 'Local 80/20 train/val from the Open Images validation source pool; one image per photographer, exact/hash similarity checks. Not official Open Images benchmark splits. No independent test set.',
        'limits': f'Positive-only {count}-image starter subset; not sufficient evidence of webcam generalization. No training performed.',
        'images': selected, 'skipped': skipped,
        'curation': selection if selection else None,
    }
    fingerprint = hashlib.sha256(json.dumps(selected, sort_keys=True).encode()).hexdigest()
    manifest['fingerprint'] = fingerprint
    (output / 'manifest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
    (output / 'data.yaml').write_text('path: .\ntrain: images/train\nval: images/val\nnames:\n  0: bottle\n')
    (output / 'review.html').write_text(review_html(selected, fingerprint, output))
    with (output / 'attribution.csv').open('w', newline='') as handle:
        writer = csv.DictWriter(handle, fieldnames=['id', 'author', 'author_url', 'title', 'source_page', 'image_url', 'image_license', 'annotation_license'])
        writer.writeheader()
        writer.writerows({key: item[key] for key in writer.fieldnames} for item in selected)
    with (output / 'review.csv').open('w', newline='') as handle:
        writer = csv.writer(handle)
        writer.writerow(['review_number', 'image_id', 'split', 'boxes', 'status', 'notes'])
        writer.writerows([item['review_number'], item['id'], item['split'], len(item['labels']), 'pending', ''] for item in selected)
    counts = Counter(item['split'] for item in selected)
    total_boxes = sum(len(item['labels']) for item in selected)
    (output / 'README.md').write_text(
        '# Bottle annotation review pack\n\n'
        'Status: draft, awaiting user review. No training performed.\n\n'
        f'{len(selected)} images / {total_boxes} bottle boxes; {counts["train"]} train and {counts["val"]} validation images.\n\n'
        'Open review.html offline. Approve, flag, or reject each image, then download the review decisions JSON. '
        'Decisions remain in the browser until exported; they do not rewrite labels or start training.\n\n'
        'Annotations are published Open Images boxes converted to YOLO, not newly hand-drawn or model predictions. '
        'Assistant notes are an initial review, not user approval. Review class boundaries, every bottle, and partial instances.\n\n'
        'Image licenses are recorded as CC BY 2.0 in source metadata; Google annotations are CC BY 4.0. '
        'Keep attribution.csv and manifest.json with the images. Current source-page licenses were not independently verified.\n\n'
        'This positive-only starter subset uses local train/val splits within the source validation pool. '
        'There is no independent test set or claim of webcam generalization.\n\n'
        'See docs/LAB6_DATASET_REVIEW.md and docs/LAB6_SETUP.md in the Optiq repository for preparation and next steps.\n'
    )
    # Contact sheets are inspection aids; source images and label coordinates are unmodified.
    for page in range(math.ceil(len(selected)/6)):
        sheet = Image.new('RGB', (1200, 1080), '#f7f7f5')
        draw = ImageDraw.Draw(sheet)
        for slot, item in enumerate(selected[page*6:(page+1)*6]):
            preview = Image.open(output / item['preview'])
            preview.thumbnail((580, 310))
            x, y = slot % 2 * 600, slot // 2 * 360
            sheet.paste(preview, (x+(600-preview.width)//2, y+32+(310-preview.height)//2))
            draw.text((x+12,y+5), f"#{item['review_number']:02d} {item['id']} | {item['split']} | {len(item['labels'])} boxes", font=font, fill='#171717')
        sheet.save(output / f'contact-sheet-{page+1:02d}.jpg', quality=90)
    print(json.dumps({'output':str(output),'images':len(selected),'boxes':sum(len(i['labels']) for i in selected),'splits':dict(Counter(i['split'] for i in selected))},indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument('--count', type=int, default=38)
    parser.add_argument('--seed', type=int, default=42)
    parser.add_argument('--selection', type=Path, default=Path(__file__).with_name('bottle_review_selection.json'), help='Reviewed selection of eligible source IDs.')
    args = parser.parse_args()
    prepare(args.output.resolve(), args.count, args.seed, args.selection)
