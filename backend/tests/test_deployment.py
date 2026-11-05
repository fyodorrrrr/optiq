import asyncio
import unittest
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient
from main import create_app
from services.readiness import Readiness, inspect_resources
from services.configuration import allowed_origins
from middleware.request_deadline import RequestDeadlineMiddleware


class DeploymentTests(unittest.TestCase):
    def test_readiness_cached_and_public(self):
        now = [0]
        with patch('services.readiness.inspect_resources', return_value={'models': False}) as check:
            ready = Readiness(clock=lambda: now[0])
            self.assertEqual(ready.report(), {'status': 'not_ready', 'checks': {'models': False}})
            ready.report()
            self.assertEqual(check.call_count, 1)
            now[0] = 61
            ready.report()
            self.assertEqual(check.call_count, 2)

    def test_ready_http_status_and_health_independence(self):
        with patch('services.readiness.inspect_resources', return_value={'models': False}):
            with TestClient(create_app()) as client:
                response = client.get('/api/ready')
                self.assertEqual(response.status_code, 503)
                self.assertEqual(response.headers['cache-control'], 'no-store')
                self.assertEqual(client.get('/api/health').status_code, 200)
        with patch('services.readiness.inspect_resources', return_value={'models': True}):
            with TestClient(create_app()) as client:
                self.assertEqual(client.get('/api/ready').status_code, 200)

    def test_cors_exact_origins_on_errors(self):
        with patch.dict('os.environ', {'OPTIQ_ALLOWED_ORIGINS': 'https://optiq.example'}):
            with TestClient(create_app()) as client:
                response = client.post('/api/labs/1/load', content=b'',
                                       headers={'Origin': 'https://optiq.example', 'Content-Length': '99999999'})
                self.assertEqual(response.status_code, 413)
                self.assertEqual(response.headers['access-control-allow-origin'], 'https://optiq.example')
                denied = client.options('/api/labs/1/load', headers={
                    'Origin': 'https://other.example', 'Access-Control-Request-Method': 'POST'})
                self.assertEqual(denied.status_code, 400)
                self.assertNotIn('access-control-allow-origin', denied.headers)

    def test_origins_reject_wildcards_and_non_origins(self):
        for value in ('*', 'https://host/path', 'https://host?x=1', 'null', 'https://user:pass@host'):
            with patch.dict('os.environ', {'OPTIQ_ALLOWED_ORIGINS': value}):
                with self.assertRaises(ValueError):
                    allowed_origins()

    def test_http_deadline_returns_json_and_leaves_health_alone(self):
        app = FastAPI()
        app.add_middleware(RequestDeadlineMiddleware, seconds=0.01)
        @app.get('/api/labs/1/slow')
        async def slow():
            await asyncio.sleep(1)
        @app.get('/api/health')
        async def health():
            return {'status': 'ok'}
        with TestClient(app) as client:
            response = client.get('/api/labs/1/slow')
            self.assertEqual(response.status_code, 504)
            self.assertIn('detail', response.json())
            self.assertEqual(client.get('/api/health').status_code, 200)

    def test_upload_receipt_timeout(self):
        from middleware.request_body_limits import RequestBodyLimitMiddleware
        messages = []
        async def app(scope, receive, send):
            self.fail('Stalled upload reached application')
        async def receive():
            await asyncio.sleep(1)
        async def send(message):
            messages.append(message)
        asyncio.run(RequestBodyLimitMiddleware(app, read_seconds=0.01)(
            {'type': 'http', 'method': 'POST', 'path': '/api/labs/1/load', 'headers': []}, receive, send))
        self.assertEqual(messages[0]['status'], 408)


    def test_readiness_failure_details_are_not_public(self):
        with (patch('services.readiness.lab4.capabilities', side_effect=RuntimeError('/private/secret/model.pt')),
              patch('services.readiness.lab5.load_dataset', side_effect=RuntimeError('secret')),
              patch('services.readiness.lab6.status', side_effect=RuntimeError('secret')),
              patch('services.readiness._detection_runtime', return_value=True),
              patch('services.readiness._semantic_weights', return_value=False)):
            report = inspect_resources()
        self.assertFalse(report['feature_algorithms'])
        self.assertFalse(report['face_dataset'])
        self.assertFalse(report['detection_models'])
        self.assertTrue(all(type(value) is bool for value in report.values()))
        self.assertNotIn('secret', str(report))

    def test_deadline_preserves_running_processing_slot(self):
        from threading import Event
        from routers.image_io import process
        from services.processing_limits import ProcessingLimiter, ProcessingBusy
        limiter = ProcessingLimiter(1)
        release, finished = Event(), Event()
        def work():
            try:
                release.wait(5)
            finally:
                finished.set()
        app = FastAPI()
        app.add_middleware(RequestDeadlineMiddleware, seconds=.02)
        @app.get('/api/labs/1/slow')
        async def slow():
            return await process(work)
        with patch('routers.image_io.processing_limiter', limiter):
            with TestClient(app) as client:
                try:
                    self.assertEqual(client.get('/api/labs/1/slow').status_code, 504)
                    with self.assertRaises(ProcessingBusy):
                        limiter.reserve()
                finally:
                    release.set()
                    self.assertTrue(finished.wait(5))
        limiter.reserve().cancel_if_pending()

    def test_partial_response_is_never_replaced_by_504(self):
        messages = []
        async def app(scope, receive, send):
            await send({'type': 'http.response.start', 'status': 200, 'headers': []})
            await asyncio.sleep(1)
        async def receive():
            return {'type': 'http.request', 'body': b''}
        async def send(message):
            messages.append(message)
        with self.assertRaises(TimeoutError):
            asyncio.run(RequestDeadlineMiddleware(app, seconds=.01)(
                {'type': 'http', 'method': 'GET', 'path': '/api/labs/1/sample'}, receive, send))
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0]['status'], 200)
