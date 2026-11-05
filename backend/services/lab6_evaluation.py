"""Local held-out evaluation guards; never retrains or replaces a checkpoint."""
import hashlib
from pathlib import Path

from services.lab6_dataset import validate_dataset


def file_hash(path):
    digest = hashlib.sha256()
    with Path(path).open('rb') as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def verify_test_inputs(config, training, checkpoint):
    if training.get('status') != 'completed' or not training.get('epochs_completed'):
        raise ValueError('A completed training run is required before held-out evaluation.')
    if file_hash(checkpoint) != training.get('weight_sha256'):
        raise ValueError('The frozen checkpoint does not match the completed training run.')
    manifest = validate_dataset(config)
    if 'test' not in manifest['splits']:
        raise ValueError('Provide a separate test split; validation is not a test result.')
    original = validate_dataset(config, include_test=False)
    if original['sha256'] != training.get('dataset_sha256'):
        raise ValueError('The training/validation images or labels differ from the completed run.')
    return manifest


def dataset_root(config):
    import yaml
    config = Path(config).resolve()
    values = yaml.safe_load(config.read_text())
    return (config.parent / values.get('path', '.')).resolve()


def test_review_status(config):
    """Approval belongs to exported decisions and current bytes, never a status flag."""
    import json
    root = dataset_root(config)
    try:
        manifest = json.loads((root / 'manifest.json').read_text())
        decisions = json.loads((root / 'review-decisions.json').read_text())
        records = manifest['images']
        fingerprint = hashlib.sha256(json.dumps(records, sort_keys=True).encode()).hexdigest()
        if fingerprint != manifest['fingerprint'] or decisions['dataset_fingerprint'] != fingerprint:
            return 'pending_user_review'
        actual = set()
        for image in (root / 'images/test').rglob('*'):
            if image.suffix.lower() in {'.png', '.jpg', '.jpeg'}:
                label = root / 'labels/test' / image.relative_to(root / 'images/test').with_suffix('.txt')
                actual.add((file_hash(image), file_hash(label)))
        expected = set()
        for record in records:
            image, label = root / record['image'], root / record['label_file']
            if (record['split'] != 'test' or not image.resolve().is_relative_to(root / 'images/test')
                    or not label.resolve().is_relative_to(root / 'labels/test')):
                return 'pending_user_review'
            expected.add((file_hash(image), file_hash(label)))
        approved = {(row['image_sha256'], row['label_sha256']) for row in decisions['images'] if row['status'] == 'approved'}
        if actual and len(records) == len(actual) == len(decisions['images']) and actual == expected == approved:
            return 'user_approved'
    except (OSError, ValueError, KeyError, TypeError):
        pass
    return 'pending_user_review'
