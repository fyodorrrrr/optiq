"""Validation for the explicitly configured local YOLO detection dataset."""
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image
import yaml


def validate_dataset(config_path):
    config_path = Path(config_path).resolve()
    config = yaml.safe_load(config_path.read_text())
    if not isinstance(config, dict):
        raise ValueError('data.yaml must contain a mapping.')
    names = config.get('names')
    if isinstance(names, dict) and set(names) == set(range(len(names))):
        names = [names[index] for index in range(len(names))]
    if not isinstance(names, list) or not names or any(not isinstance(name, str) or not name.strip() for name in names) or len(set(names)) != len(names):
        raise ValueError('Provide unique, non-empty class names indexed from zero.')
    if config.get('nc', len(names)) != len(names):
        raise ValueError('nc must match the number of names.')
    root_value = config.get('path', '.')
    if not isinstance(root_value, str):
        raise ValueError('Dataset path must be a directory string.')
    root = (config_path.parent / root_value).resolve()
    digest = hashlib.sha256()
    digest.update('|'.join(names).encode())
    seen = {}
    splits = {}
    train_classes = set()
    image_splits = {}
    file_pairs = set()
    for split in ['train', 'val', 'test']:
        value = config.get(split)
        if not value and split == 'test':
            continue
        if not isinstance(value, str):
            raise ValueError(f'Provide an images/{split} directory in data.yaml.')
        folder = (root / value).resolve()
        if not folder.is_relative_to(root) or folder.name != split or folder.parent.name != 'images':
            raise ValueError(f'Use images/{split} inside the dataset root.')
        images = sorted(path for path in folder.rglob('*') if path.suffix.lower() in {'.png', '.jpg', '.jpeg'})
        if not images:
            raise ValueError(f'No PNG/JPEG images found in {split}.')
        objects = 0
        backgrounds = 0
        expected_labels = set()
        for path in images:
            if not path.resolve().is_relative_to(root):
                raise ValueError('Dataset image links must stay inside the root.')
            with Image.open(path) as image:
                if image.format not in {'PNG', 'JPEG'}:
                    raise ValueError(f'Unsupported image: {path.name}')
                pixels = np.asarray(image.convert('RGB'))
                content_hash = hashlib.sha256(str(pixels.shape).encode() + pixels.tobytes()).hexdigest()
            if content_hash in seen:
                raise ValueError('Duplicate image content appears in multiple splits or files; remove duplicates before training.')
            seen[content_hash] = split
            label = root / 'labels' / split / path.relative_to(folder).with_suffix('.txt')
            if not label.resolve().is_relative_to(root) or not label.is_file():
                raise ValueError(f'Missing label for {split}/{path.name}; use an empty .txt file for a background image.')
            if label.resolve() in expected_labels:
                raise ValueError(f'Ambiguous label pairing for {split}/{path.name}; use unique image stems.')
            expected_labels.add(label.resolve())
            image_sha = hashlib.sha256(path.read_bytes()).hexdigest()
            image_splits[image_sha] = split
            file_pairs.add((image_sha, hashlib.sha256(label.read_bytes()).hexdigest()))
            lines = label.read_text().strip().splitlines()
            backgrounds += not lines
            for line in lines:
                parts = line.split()
                if len(parts) != 5:
                    raise ValueError(f'{label.name}: each detection needs class_id x_center y_center width height.')
                try:
                    class_id = int(parts[0])
                    x, y, width, height = map(float, parts[1:])
                except ValueError:
                    raise ValueError(f'{label.name}: invalid numeric label.') from None
                if class_id < 0 or class_id >= len(names) or not all(np.isfinite([x, y, width, height])) or width <= 0 or height <= 0 or min(x - width / 2, y - height / 2) < -1e-6 or max(x + width / 2, y + height / 2) > 1 + 1e-6:
                    raise ValueError(f'{label.name}: boxes must be positive and normalized within image bounds, with valid class IDs.')
                if split == 'train':
                    train_classes.add(class_id)
                objects += 1
            digest.update(f'{split}/{path.relative_to(folder)}:{content_hash}:'.encode() + label.read_bytes())
        actual_labels = {path.resolve() for path in (root / 'labels' / split).rglob('*.txt')}
        if actual_labels != expected_labels:
            raise ValueError(f'Orphan or ambiguous labels in {split}; use one label file for each image.')
        splits[split] = {'images': len(images), 'objects': objects, 'backgrounds': backgrounds}
    if train_classes != set(range(len(names))):
        raise ValueError('Every configured class must have an annotated object in training images.')
    reviewed_images = 0
    review_path = root / 'review-decisions.json'
    if review_path.is_file() and review_path.stat().st_size <= 2_000_000:
        try:
            records = json.loads(review_path.read_text())['images']
            approved = {(row['image_sha256'], row['label_sha256']) for row in records if row['status'] == 'approved'}
            if len(records) == len(file_pairs) and approved == file_pairs:
                reviewed_images = len(file_pairs)
        except (OSError, ValueError, KeyError, TypeError):
            pass  # Structural validation does not imply human approval.
    return {'ready': True, 'names': names, 'splits': splits, 'sha256': digest.hexdigest(),
            'reviewed_images': reviewed_images, 'image_splits': image_splits,
            'config': str(config_path), 'message': 'Labels and exact decoded-image split separation validated; review related scenes manually.'}
