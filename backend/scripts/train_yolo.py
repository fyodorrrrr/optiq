"""Validate a local YOLO dataset, optionally train, and publish actual artifacts."""
import argparse
import csv
import hashlib
import json
import logging
import os
from pathlib import Path
import shutil
import sys
from datetime import datetime, timezone

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))
from services.lab6_dataset import validate_dataset

ROOT = BACKEND / '.cache' / 'lab6'


def write_json(name, value):
    ROOT.mkdir(parents=True, exist_ok=True)
    path = ROOT / name
    temporary = path.with_suffix('.tmp')
    temporary.write_text(json.dumps(value, indent=2, allow_nan=False) + '\n')
    temporary.replace(path)


def run(args):
    manifest = validate_dataset(args.data)
    write_json('dataset.json', manifest)
    print(json.dumps(manifest, indent=2), flush=True)
    if args.validate_only:
        return
    weights = ROOT / 'yolo11n.pt'
    if not weights.is_file():
        raise ValueError('Run scripts/prepare_yolo.py first.')
    if args.split not in manifest['splits']:
        raise ValueError(f'The dataset has no {args.split} split.')
    (ROOT / 'settings').mkdir(parents=True, exist_ok=True)
    os.environ.setdefault('YOLO_CONFIG_DIR', str(ROOT / 'settings'))
    os.environ.setdefault('YOLO_AUTOINSTALL', 'false')
    from ultralytics import YOLO, __version__
    import torch
    from ultralytics.utils import LOGGER
    handler = logging.FileHandler(ROOT / 'training.log', mode='w')
    LOGGER.addHandler(handler)
    effective = {'epochs': args.epochs, 'imgsz': 640, 'batch': args.batch, 'device': args.device,
                 'seed': 42, 'workers': 0, 'patience': 0, 'deterministic': True,
                 'data': str(Path(args.data).resolve()), 'project': str(ROOT / 'runs'), 'name': args.name,
                 'exist_ok': False, 'amp': False, 'plots': True}
    provenance = {'status': 'running', 'message': 'Local custom training is running; results are not complete.',
                  'started_utc': datetime.now(timezone.utc).isoformat(), 'dataset_sha256': manifest['sha256'],
                  'parameters': effective, 'ultralytics': __version__, 'torch': torch.__version__,
                  'evaluation_split': args.split, 'baseline': args.epochs == 100,
                  'initial_weight_sha256': hashlib.sha256(weights.read_bytes()).hexdigest()}
    write_json('training.json', provenance)
    try:
        model = YOLO(str(weights), task='detect')
        model.train(**effective)
        run_dir = Path(model.trainer.save_dir)
        best = run_dir / 'weights' / 'best.pt'
        if not best.is_file():
            raise ValueError('Training produced no best.pt weights.')
        validated = YOLO(str(best), task='detect').val(data=effective['data'], split=args.split, imgsz=640,
                                                     device=args.device, workers=0, project=str(ROOT / 'evaluations'), name=args.name)
        with (run_dir / 'results.csv').open() as source:
            history = [{key.strip(): float(value) for key, value in row.items()} for row in csv.DictReader(source)]
        if not history or len(history) < args.epochs:
            raise ValueError('Training did not complete the requested epoch count; inspect the retained run.')
        destination = ROOT / 'custom' / 'best.pt'
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(best, destination.with_suffix('.tmp'))
        destination.with_suffix('.tmp').replace(destination)
        provenance.update(status='completed', message='Custom training and evaluation completed.',
                          completed_utc=datetime.now(timezone.utc).isoformat(), epochs_completed=len(history),
                          weight_sha256=hashlib.sha256(destination.read_bytes()).hexdigest(),
                          run_directory=str(run_dir), history=history,
                          metrics={'precision': float(validated.box.mp), 'recall': float(validated.box.mr),
                                   'map50': float(validated.box.map50), 'map50_95': float(validated.box.map)})
        write_json('training.json', provenance)
        print('Published custom model and metrics for Optiq.', flush=True)
    except (Exception, KeyboardInterrupt) as error:
        provenance.update(status='failed', message=f'Local training/evaluation failed or was interrupted: {error}')
        write_json('training.json', provenance)
        raise
    finally:
        LOGGER.removeHandler(handler)
        handler.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--data', required=True, type=Path)
    parser.add_argument('--validate-only', action='store_true')
    parser.add_argument('--epochs', type=int, default=100)
    parser.add_argument('--batch', type=int, default=4)
    parser.add_argument('--device', choices=['cpu', 'mps'], default='cpu')
    parser.add_argument('--split', choices=['val', 'test'], default='val')
    parser.add_argument('--name', default='custom')
    args = parser.parse_args()
    if args.epochs < 1 or args.epochs > 1000 or args.batch < 1 or args.batch > 32:
        parser.error('epochs must be 1–1000 and batch 1–32.')
    if not args.name or any(character not in 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_' for character in args.name):
        parser.error('Use letters, digits, hyphens or underscores for --name.')
    run(args)
