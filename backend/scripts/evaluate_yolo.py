"""Evaluate a frozen custom checkpoint on a separate test split without training."""
import argparse
from datetime import datetime, timezone
import json
import logging
import os
from pathlib import Path
import sys

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))
from services.lab6_evaluation import dataset_root, file_hash, test_review_status, verify_test_inputs

ROOT = BACKEND / '.cache/lab6'


def evaluate(config, name):
    training_path = ROOT / 'training.json'
    training_hash = file_hash(training_path)
    training = json.loads(training_path.read_text())
    checkpoint = ROOT / 'custom/best.pt'
    manifest = verify_test_inputs(config, training, checkpoint)
    review_status = test_review_status(config)
    os.environ.setdefault('YOLO_CONFIG_DIR', str(ROOT / 'settings'))
    os.environ.setdefault('YOLO_AUTOINSTALL', 'false')
    from ultralytics import YOLO, __version__
    from ultralytics.utils import LOGGER
    import torch
    run_dir = ROOT / 'test-evaluations' / name
    if run_dir.exists():
        raise ValueError('Evaluation output already exists; choose a new name to preserve evidence.')
    run_dir.mkdir(parents=True)
    handler = logging.FileHandler(run_dir / 'evaluation.log')
    LOGGER.addHandler(handler)
    try:
        # Ultralytics caches label contents using file sizes; same-length edits must reload.
        (dataset_root(config) / 'labels/test.cache').unlink(missing_ok=True)
        model = YOLO(str(checkpoint), task='detect')
        metrics = model.val(data=str(config.resolve()), split='test', imgsz=640, batch=4,
                            device='cpu', workers=0, seed=42, deterministic=True,
                            conf=.001, iou=.7, plots=True, project=str(run_dir), name='metrics')
        result = {
            'status': 'completed', 'evaluation_split': 'test', 'review_status': review_status,
            'completed_utc': datetime.now(timezone.utc).isoformat(),
            'training_dataset_sha256': training['dataset_sha256'],
            'dataset_sha256': manifest['sha256'], 'weight_sha256': training['weight_sha256'],
            'images': manifest['splits']['test']['images'], 'objects': manifest['splits']['test']['objects'],
            'metrics': {'precision': float(metrics.box.mp), 'recall': float(metrics.box.mr),
                        'map50': float(metrics.box.map50), 'map50_95': float(metrics.box.map)},
            'parameters': {'imgsz': 640, 'batch': 4, 'device': 'cpu', 'conf': .001, 'iou': .7, 'seed': 42},
            'ultralytics': __version__, 'torch': str(torch.__version__),
        }
        if verify_test_inputs(config, training, checkpoint)['sha256'] != manifest['sha256']:
            raise ValueError('Dataset changed during evaluation; results were not published.')
        if file_hash(checkpoint) != training['weight_sha256'] or file_hash(training_path) != training_hash:
            raise ValueError('Training artifacts changed during evaluation; results were not published.')
        (run_dir / 'result.json').write_text(json.dumps(result, indent=2, allow_nan=False) + '\n')
        temporary = ROOT / 'evaluation.tmp'
        temporary.write_text(json.dumps(result, indent=2, allow_nan=False) + '\n')
        temporary.replace(ROOT / 'evaluation.json')
        print(json.dumps(result, indent=2), flush=True)
    finally:
        LOGGER.removeHandler(handler)
        handler.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--data', type=Path, required=True)
    parser.add_argument('--name', default='bottle-heldout-v1')
    args = parser.parse_args()
    if not args.name or any(c not in 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_' for c in args.name):
        parser.error('Use letters, digits, hyphens or underscores for --name.')
    evaluate(args.data.resolve(), args.name)
