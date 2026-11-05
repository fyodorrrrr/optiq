"""Record real Lab 5 PCA/SVM runs for the static demonstration preview."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import sys

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))


def export_runs(destination):
    from schemas.lab5 import Settings
    from services.lab5 import execute
    destination.mkdir(parents=True, exist_ok=True)
    recorded = datetime.now(timezone.utc).isoformat()
    source_hash = hashlib.sha256((BACKEND / 'services/lab5.py').read_bytes()).hexdigest()
    entries = []
    baseline = None
    for components in (25, 75, 150):
        result = execute(Settings(components=components))
        if baseline is None:
            baseline = result
        elif (result.provenance['dataset_sha256'] != baseline.provenance['dataset_sha256']
              or result.test_indices != baseline.test_indices):
            raise ValueError('All saved runs must use the same dataset and test split.')
        result.provenance.update({
            'source_execution': result.provenance['execution'],
            'execution': 'precomputed demonstration',
            'recorded_utc': recorded,
            'source_service_sha256': source_hash,
        })
        content = result.model_dump_json().encode() + b'\n'
        filename = f'components-{components}.json'
        (destination / filename).write_bytes(content)
        entries.append({'components': components, 'file': filename,
                        'sha256': hashlib.sha256(content).hexdigest()})
        print(f'{components} components: {result.accuracy:.4%} accuracy; {len(content):,} bytes', flush=True)
    manifest = {'schema_version': 1, 'execution': 'precomputed', 'recorded_utc': recorded,
                'source_service_sha256': source_hash,
                'dataset_sha256': baseline.provenance['dataset_sha256'],
                'dataset': baseline.dataset.model_dump(), 'runs': entries}
    (destination / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path,
                        default=BACKEND.parent / 'frontend/public/demos/lab5')
    export_runs(parser.parse_args().output)
