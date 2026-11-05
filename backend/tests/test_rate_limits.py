import asyncio
import unittest
from concurrent.futures import ThreadPoolExecutor
from unittest.mock import patch

from fastapi.testclient import TestClient
from main import create_app
from services.rate_limits import RateLimiter, client_key


class RateLimitTests(unittest.TestCase):
    def test_burst_refill_and_separate_clients(self):
        clock = [0.0]
        limiter = RateLimiter(60, 2, clock=lambda: clock[0])
        self.assertEqual([limiter.check('a') for _ in range(3)], [0, 0, 1])
        clock[0] = 0.5
        self.assertEqual(limiter.check('a'), 1)
        clock[0] = 1
        self.assertEqual(limiter.check('a'), 0)
        self.assertEqual(limiter.check('b'), 0)

    def test_client_capacity_and_expiry(self):
        clock = [0.0]
        limiter = RateLimiter(60, 2, max_clients=1, clock=lambda: clock[0])
        self.assertEqual(limiter.check('a'), 0)
        self.assertEqual(limiter.check('b'), 2)
        self.assertEqual(limiter.check('a'), 0)
        self.assertEqual(limiter.check('a'), 1)
        clock[0] = 2
        self.assertEqual(limiter.check('b'), 0)
        self.assertEqual(len(limiter._buckets), 1)

    def test_thread_safety(self):
        limiter = RateLimiter(60, 3, clock=lambda: 0)
        with ThreadPoolExecutor(max_workers=8) as pool:
            outcomes = list(pool.map(limiter.check, ['a'] * 20))
        self.assertEqual(outcomes.count(0), 3)

    def test_configuration(self):
        with patch.dict('os.environ', {'OPTIQ_RATE_LIMIT_PER_MINUTE': '0'}):
            with self.assertRaises(ValueError):
                RateLimiter.from_environment()
        for value in (0, -1, True, 1.5):
            with self.assertRaises(ValueError):
                RateLimiter(value, 2)

    def test_identity(self):
        self.assertEqual(client_key({'client': ('::ffff:192.0.2.1', 1)}), '192.0.2.1')
        self.assertEqual(client_key({'client': ('2001:0db8::1', 1)}), '2001:db8::1')
        self.assertEqual(client_key({}), 'unknown')

    def test_api_shared_quota_and_exemptions(self):
        with TestClient(create_app(RateLimiter(60, 1, clock=lambda: 0))) as client:
            self.assertEqual(client.get('/api/labs/1/missing').status_code, 404)
            response = client.get('/api/labs/2/sample', headers={'X-Forwarded-For': '192.0.2.9'})
            self.assertEqual(response.status_code, 429)
            self.assertEqual(response.headers['retry-after'], '1')
            self.assertEqual(response.headers['cache-control'], 'no-store')
            self.assertIn('detail', response.json())
            self.assertEqual(client.get('/api/health').status_code, 200)
            self.assertNotEqual(client.options('/api/labs/1/load').status_code, 429)

    def test_camera_cadence(self):
        clock = [0.0]
        limiter = RateLimiter(240, 24, clock=lambda: clock[0])
        for frame in range(240):
            clock[0] = frame / 2
            self.assertEqual(limiter.check('camera'), 0)

    def test_rejected_upload_does_not_read_body(self):
        from middleware.rate_limits import RateLimitMiddleware
        limiter = RateLimiter(60, 1, clock=lambda: 0)
        limiter.check('192.0.2.1')
        messages = []
        async def downstream(scope, receive, send):
            self.fail('Rejected request reached application')
        async def receive():
            self.fail('Rejected request body was read')
        async def send(message):
            messages.append(message)
        asyncio.run(RateLimitMiddleware(downstream, limiter)(
            {'type': 'http', 'method': 'POST', 'path': '/api/labs/1/load',
             'client': ('192.0.2.1', 1), 'headers': []}, receive, send))
        self.assertEqual(messages[0]['status'], 429)
