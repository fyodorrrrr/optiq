"""Explicitly download trusted YOLO11n weights and the bus and attributed Open Images bottle samples."""
from pathlib import Path
import os
import sys
from urllib.request import urlretrieve

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
DESTINATION = ROOT / '.cache' / 'lab6'

if __name__ == '__main__':
    DESTINATION.mkdir(parents=True, exist_ok=True)
    (DESTINATION / 'settings').mkdir(parents=True, exist_ok=True)
    os.environ.setdefault('YOLO_CONFIG_DIR', str(DESTINATION / 'settings'))
    # Use explicit fixed upstream URLs rather than a request-time auto-download.
    assets = {
        'yolo11n.pt': 'https://github.com/ultralytics/assets/releases/download/v8.3.0/yolo11n.pt',
        'bottle.jpg': 'https://open-images-dataset.s3.amazonaws.com/validation/9bd3e32a2337f9bc.jpg',
        'bus.jpg': 'https://raw.githubusercontent.com/ultralytics/ultralytics/main/ultralytics/assets/bus.jpg',
    }
    for name, url in assets.items():
        target = DESTINATION / name
        if not target.exists():
            temporary = target.with_suffix(target.suffix + '.download')
            print(f'Downloading {name}…', flush=True)
            try:
                urlretrieve(url, temporary)
                temporary.replace(target)
            finally:
                temporary.unlink(missing_ok=True)
    from services.lab6 import get_model, weight_hash
    get_model('pretrained')
    print('YOLO11n prepared:', weight_hash(DESTINATION / 'yolo11n.pt'))
