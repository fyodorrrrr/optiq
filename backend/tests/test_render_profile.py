"""Fresh-process checks prove the lightweight entrypoint avoids heavy imports."""
import os
from pathlib import Path
import subprocess
import sys
import textwrap
import unittest

BACKEND = Path(__file__).resolve().parents[1]


class RenderProfileTests(unittest.TestCase):
    def run_profile(self, script, profile='render-free'):
        result = subprocess.run([sys.executable, '-c', textwrap.dedent(script)], cwd=BACKEND,
                                env={**os.environ, 'OPTIQ_PROFILE': profile},
                                capture_output=True, text=True, timeout=45)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_invalid_profile_fails_startup(self):
        result = subprocess.run([sys.executable, '-c', 'import main'], cwd=BACKEND,
                                env={**os.environ, 'OPTIQ_PROFILE': 'typo'},
                                capture_output=True, text=True, timeout=15)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('OPTIQ_PROFILE', result.stderr)

    def test_render_works_without_any_heavy_dependency_import(self):
        self.run_profile('''
            import importlib.abc, sys
            class NoHeavy(importlib.abc.MetaPathFinder):
                def find_spec(self, fullname, path=None, target=None):
                    if fullname.split('.')[0] in {'sklearn', 'scipy', 'torch', 'torchvision', 'ultralytics'}:
                        raise AssertionError('Heavy dependency imported: ' + fullname)
            sys.meta_path.insert(0, NoHeavy())
            from fastapi.testclient import TestClient
            from main import app
            with TestClient(app) as client:
                assert client.get('/api/health').status_code == 200
                ready = client.get('/api/ready')
                assert ready.status_code == 200, ready.text[:240]
                assert set(ready.json()['checks']) == {'feature_algorithms', 'temporary_storage'}
                for lab in (1,2,3,4,7):
                    response = client.get(f'/api/labs/{lab}/sample')
                    assert response.status_code == 200, response.text[:240]
                    mascot = client.get(f'/api/labs/{lab}/sample?kind=mascot')
                    assert mascot.status_code == 200, mascot.text[:240]
                    frame = mascot.json()['first'] if lab == 4 else mascot.json()
                    assert frame['width'] == 480 and frame['height'] == 360
                    assert frame['width'] * frame['height'] <= 350000
                assert client.get('/api/labs/5/dataset').status_code == 404
                assert client.get('/api/labs/6/status').status_code == 404
            assert not any(name.split('.')[0] in {'sklearn','scipy','torch','torchvision','ultralytics'} for name in sys.modules)
        ''')

    def test_bounds_resize_scene_and_semantic_denial(self):
        self.run_profile('''
            import io, json
            from PIL import Image
            from fastapi.testclient import TestClient
            from main import app
            def image(size):
                stream=io.BytesIO(); Image.new('RGB',size).save(stream,format='PNG');return stream.getvalue()
            with TestClient(app) as client:
                oversized=client.post('/api/labs/1/load',files={'file':('large.png',image((700,501)),'image/png')})
                assert oversized.status_code == 413, oversized.text[:240]
                assert '350,000' in oversized.json()['detail']
                normal=image((640,480))
                loaded=client.post('/api/labs/1/load',files={'file':('small.png',normal,'image/png')})
                assert loaded.status_code == 200, loaded.text[:240]
                resize=client.post('/api/labs/1/experiment',files={'file':('small.png',normal,'image/png')},data={'settings':json.dumps({'operation':'resize','width':700,'height':501})})
                assert resize.status_code == 422, resize.text[:240]
                scene=client.get('/api/labs/7/sample?kind=scene')
                assert scene.status_code == 200, scene.text[:240]
                assert scene.json()['width']*scene.json()['height'] <= 350000
                semantic=client.post('/api/labs/7/experiment',files={'file':('small.png',normal,'image/png')},data={'settings':'{"method":"semantic"}'})
                assert semantic.status_code == 403, semantic.text[:240]
                classical=client.post('/api/labs/7/experiment',files={'file':('small.png',normal,'image/png')},data={'settings':'{"method":"threshold"}'})
                assert classical.status_code == 200, classical.text[:240]
        ''')

    def test_default_full_profile_retains_original_limits(self):
        self.run_profile('''
            from services.images import MAX_PIXELS, MAX_SIDE
            from main import app
            assert MAX_PIXELS == 4000000 and MAX_SIDE == 4096
            assert '/api/labs/5/experiment' in app.openapi()['paths']
            assert '/api/labs/6/experiment' in app.openapi()['paths']
        ''', profile='full')
