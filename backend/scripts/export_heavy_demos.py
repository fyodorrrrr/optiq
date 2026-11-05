"""Record actual YOLO and DeepLab results for lightweight browser demonstrations."""
import argparse
import base64
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import sys

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))


def digest(content):
    return hashlib.sha256(content).hexdigest()


def write_json(root, filename, value):
    content = json.dumps(value, separators=(',', ':'), allow_nan=False).encode() + b'\n'
    (root / filename).write_bytes(content)
    return {'file': filename, 'sha256': digest(content)}


def export(destination, labs=(6, 7)):
    import cv2
    from schemas.lab6 import Settings as DetectionSettings
    from schemas.lab7 import Settings as SemanticSettings
    from services import lab6, lab7
    from services.images import decode_image, frame
    from services.public_metadata import public_log

    recorded = datetime.now(timezone.utc).isoformat()
    for lab in labs:
        longest = 640 if lab == 6 else 480
        samples = []
        contents = {}
        for name in ('bottle', 'bus'):
            original = (lab6.ROOT / f'{name}.jpg').read_bytes()
            image, _ = decode_image(original)
            notes = lab6.sample(name).notes
            scale = min(1, longest / max(image.shape[:2]))
            image = cv2.resize(image, (round(image.shape[1] * scale), round(image.shape[0] * scale)), interpolation=cv2.INTER_AREA)
            displayed = frame(image, [*notes, f'Recorded sample resized to longest side {longest} before inference.',
                                     'Bottle: reviewed validation sample.' if name == 'bottle' else 'Ultralytics bus demonstration photo.'])
            content = base64.b64decode(displayed.image.split(',', 1)[1])
            contents[name] = content
            samples.append({'id': name, 'title': 'Bottle' if name == 'bottle' else 'Bus',
                            'frame': displayed.model_dump(), 'input_sha256': digest(content),
                            'original_sample_sha256': digest(original)})
        root = destination / f'lab{lab}'
        root.mkdir(parents=True, exist_ok=True)
        source_hash = digest((BACKEND / f'services/lab{lab}.py').read_bytes())
        index = {'schema_version': 1, 'execution': 'precomputed', 'recorded_utc': recorded,
                 'source_service_sha256': source_hash, 'samples': samples, 'runs': [],
                 'default_run': 'bottle-custom-25' if lab == 6 else 'bus-semantic-50'}
        if lab == 6:
            state = lab6.status()
            if not all(model.available for model in state.models) or not state.evaluation:
                raise ValueError('Prepared, reviewed detector artifacts are required before export.')
            index['context'] = state.model_dump()
            if state.training_log_available:
                log = public_log((lab6.ROOT / 'training.log').read_text(errors='replace')).encode()
                (root / 'training.txt').write_bytes(log)
                index['training_log'] = {'file': 'training.txt', 'sha256': digest(log)}
        for sample in samples:
            name = sample['id']
            variants = [(model, confidence) for model in ('custom', 'pretrained') for confidence in (.25, .5, .75)] if lab == 6 else [('semantic', opacity) for opacity in (.25, .5, .75)]
            for model, value in variants:
                result = (lab6.execute(contents[name], DetectionSettings(model=model, confidence=value)) if lab == 6
                          else lab7.execute(contents[name], SemanticSettings(method='semantic', opacity=value)))
                result.provenance.update({'execution': 'precomputed demonstration', 'recorded_utc': recorded,
                                          'input_sha256': sample['input_sha256'], 'source_service_sha256': source_hash})
                identifier = f'{name}-{model}-{round(value * 100)}'
                entry = {'id': identifier, 'sample': name,
                         'parameters': {'model': model, 'confidence': value} if lab == 6 else {'method': 'semantic', 'opacity': value}}
                entry.update(write_json(root, f'{identifier}.json', result.model_dump()))
                index['runs'].append(entry)
                print(f'Lab {lab}: {identifier}', flush=True)
        write_json(root, 'manifest.json', index)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=BACKEND.parent / 'frontend/public/demos')
    parser.add_argument('--lab', type=int, choices=(6, 7), help='Regenerate one lab only; default exports both.')
    args = parser.parse_args()
    export(args.output, (args.lab,) if args.lab else (6, 7))
