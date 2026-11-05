"""Sequential end-to-end API checks for all labs; no downloads or training."""
import argparse
import base64
import json
import uuid
from urllib.request import Request, urlopen


def multipart(files, settings):
    boundary = 'optiq-' + uuid.uuid4().hex
    parts = []
    for name, frame in files.items():
        content = base64.b64decode(frame['image'].split(',', 1)[1], validate=True)
        parts.extend([f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"; filename="sample.png"\r\nContent-Type: image/png\r\n\r\n'.encode(), content, b'\r\n'])
    parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="settings"\r\n\r\n{json.dumps(settings)}\r\n--{boundary}--\r\n'.encode())
    return b''.join(parts), f'multipart/form-data; boundary={boundary}'


def run(base_url, *, full=False, origin=None):
    def request(path, data=None, content_type=None):
        headers = {'Content-Type': content_type} if content_type else {}
        if origin:
            headers['Origin'] = origin
        with urlopen(Request(base_url.rstrip('/') + path, data=data, headers=headers), timeout=125) as response:
            if origin and response.headers.get('Access-Control-Allow-Origin') != origin:
                raise RuntimeError('Missing CORS permission for the configured frontend origin')
            return json.load(response)
    def experiment(lab, files, settings):
        body, kind = multipart(files, settings)
        return request(f'/api/labs/{lab}/experiment', body, kind)
    if request('/api/health').get('status') != 'ok':
        raise RuntimeError('Health check failed')
    if request('/api/ready').get('status') != 'ready':
        raise RuntimeError('Readiness check failed')
    for lab in range(1, 8):
        if lab == 5:
            if not request('/api/labs/5/dataset').get('ready'):
                raise RuntimeError('Face dataset unavailable')
            if full:
                result = request('/api/labs/5/experiment', b'{"components":150}', 'application/json')
                if result.get('test_count', 0) <= 0:
                    raise RuntimeError('PCA experiment returned no held-out predictions')
        else:
            sample = request(f'/api/labs/{lab}/sample')
            if full:
                if lab == 4:
                    result = experiment(lab, {'first': sample['first'], 'second': sample['second']}, {})
                    if not all(item['status'] == 'ok' for item in result['algorithms']):
                        raise RuntimeError('A required feature algorithm is unavailable')
                else:
                    settings = {1: {'operation': 'grayscale'}, 2: {}, 3: {},
                                6: {'model': 'custom', 'confidence': .25}, 7: {'method': 'threshold'}}[lab]
                    result = experiment(lab, {'file': sample}, settings)
                    if not result:
                        raise RuntimeError('Empty experiment response')
                    if lab == 6:
                        experiment(lab, {'file': sample}, {'model': 'pretrained', 'confidence': .25})
                    if lab == 7:
                        scene = request('/api/labs/7/sample?kind=scene')
                        experiment(lab, {'file': scene}, {'method': 'semantic'})
        print(f'Lab {lab}: OK', flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url', required=True)
    parser.add_argument('--origin', help='Also verify CORS for this exact frontend origin')
    parser.add_argument('--full', action='store_true', help='Run real experiments, including PCA and both detection models.')
    args = parser.parse_args()
    run(args.base_url, full=args.full, origin=args.origin)


if __name__ == '__main__':
    main()
