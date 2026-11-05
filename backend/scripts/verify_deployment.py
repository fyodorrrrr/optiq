"""Offline deployment checks; optional real inference, never downloads or trains."""
import argparse
import json
from pathlib import Path
import sys

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--inference', action='store_true', help='Also load local checkpoints and test real predictions.')
    args = parser.parse_args()
    from services.readiness import Readiness
    report = Readiness().report()
    if args.inference and report['status'] == 'ready':
        from schemas.lab6 import Settings
        from services import lab6, lab7_semantic
        from services.images import decode_image
        content = (lab6.ROOT / 'bottle.jpg').read_bytes()
        for kind in ('pretrained', 'custom'):
            result = lab6.execute(content, Settings(model=kind, confidence=.25))
            report['checks'][f'{kind}_inference'] = bool(result.output.width and result.output.height)
        image, _ = decode_image((lab6.ROOT / 'bus.jpg').read_bytes())
        labels, _, _ = lab7_semantic.predict(image)
        report['checks']['semantic_inference'] = labels.shape == image.shape[:2]
        report['status'] = 'ready' if all(report['checks'].values()) else 'not_ready'
    print(json.dumps(report, indent=2))
    return 0 if report['status'] == 'ready' else 1


if __name__ == '__main__':
    raise SystemExit(main())
