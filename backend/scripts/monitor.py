"""One bounded health/readiness probe for a timer or external monitor."""
import argparse
import json
import shutil
import sys
import tempfile
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import urlopen


def probe(base_url, *, min_free_mib=1024):
    try:
        for path in ('/api/health', '/api/ready'):
            with urlopen(base_url.rstrip('/') + path, timeout=15) as response:
                data = json.loads(response.read(65536))
                if data.get('status') not in {'ok', 'ready'}:
                    return False
        directories = (Path(__file__).resolve().parents[1] / '.cache', Path(tempfile.gettempdir()))
        return all(shutil.disk_usage(directory).free >= min_free_mib * 1024 * 1024 for directory in directories)
    except (HTTPError, URLError, TimeoutError, OSError, ValueError):
        return False


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url', default='http://127.0.0.1:8000')
    args = parser.parse_args()
    healthy = probe(args.base_url)
    print('Optiq readiness and local storage: ' + ('OK' if healthy else 'FAILED'), flush=True)
    return 0 if healthy else 1


if __name__ == '__main__':
    sys.exit(main())
