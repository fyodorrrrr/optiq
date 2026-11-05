import asyncio
import unittest
from unittest.mock import patch
from tempfile import SpooledTemporaryFile

from api_client import api_client
from middleware.request_body_limits import RequestBodyLimitMiddleware


class RequestBodyLimitTests(unittest.TestCase):
    def run_request(self, chunks, *, headers=(), path='/api/labs/1/load', method='POST', disconnect=False):
        events = [{'type': 'http.request', 'body': chunk, 'more_body': index < len(chunks) - 1}
                  for index, chunk in enumerate(chunks)]
        if disconnect:
            events = [{'type': 'http.disconnect'}]
        messages, received = [], []
        calls = {'reads': 0, 'downstream': 0}
        async def receive():
            calls['reads'] += 1
            return events.pop(0)
        async def send(message):
            messages.append(message)
        async def app(scope, replay, send):
            calls['downstream'] += 1
            while True:
                event = await replay()
                received.append(event['body'])
                if not event.get('more_body', False):
                    break
            await send({'type': 'http.response.start', 'status': 200, 'headers': []})
            await send({'type': 'http.response.body', 'body': b'ok'})
        middleware = RequestBodyLimitMiddleware(app, max_bytes=4, pair_max_bytes=8)
        asyncio.run(middleware({'type': 'http', 'path': path, 'method': method,
                                'headers': list(headers)}, receive, send))
        return messages, received, calls

    def test_declared_oversize_rejected_without_receiving(self):
        messages, _, calls = self.run_request([b'x'], headers=[(b'content-length', b'5')])
        self.assertEqual(messages[0]['status'], 413)
        self.assertEqual(calls, {'reads': 0, 'downstream': 0})

    def test_streamed_oversize_and_false_small_length(self):
        for headers in ([], [(b'content-length', b'1')]):
            messages, _, calls = self.run_request([b'ab', b'cde'], headers=headers)
            self.assertEqual(messages[0]['status'], 413)
            self.assertEqual(calls['downstream'], 0)
            self.assertIn((b'cache-control', b'no-store'), messages[0]['headers'])

    def test_exact_boundary_replayed_unchanged(self):
        messages, received, _ = self.run_request([b'a', b'bcd'])
        self.assertEqual(messages[0]['status'], 200)
        self.assertEqual(b''.join(received), b'abcd')

    def test_two_image_route_larger_allowance(self):
        messages, received, _ = self.run_request([b'abcdefgh'], path='/api/labs/4/experiment')
        self.assertEqual(messages[0]['status'], 200)
        self.assertEqual(b''.join(received), b'abcdefgh')
        messages, _, _ = self.run_request([b'abcdefghi'], path='/api/labs/4/experiment')
        self.assertEqual(messages[0]['status'], 413)

    def test_invalid_and_duplicate_lengths(self):
        for values in ([b'-1'], [b'x'], [b'1, 1'], [b'1', b'1'], [b'+1']):
            messages, _, calls = self.run_request([b'a'], headers=[(b'content-length', v) for v in values])
            self.assertEqual(messages[0]['status'], 400)
            self.assertEqual(calls['reads'], 0)

    def test_disconnect_does_not_invoke_parser(self):
        messages, _, calls = self.run_request([], disconnect=True)
        self.assertEqual(messages, [])
        self.assertEqual(calls['downstream'], 0)

    def test_tempfile_closed_on_accept_reject_and_disconnect(self):
        files = []
        def temporary_file(*args, **kwargs):
            file = SpooledTemporaryFile(*args, **kwargs)
            files.append(file)
            return file
        with patch('middleware.request_body_limits.SpooledTemporaryFile', side_effect=temporary_file):
            self.run_request([b'abcd'])
            self.run_request([b'abcde'])
            self.run_request([], disconnect=True)
        self.assertEqual(len(files), 3)
        self.assertTrue(all(file.closed for file in files))

    def test_real_api_rejects_before_validation(self):
        with api_client() as client:
            response = client.post('/api/labs/1/load', content=b'x' * (6 * 1024 * 1024 + 1))
            self.assertEqual(response.status_code, 413)
            self.assertIn('detail', response.json())
            self.assertEqual(client.get('/api/health').status_code, 200)

    def test_legal_file_with_multipart_overhead_reaches_file_validation(self):
        with api_client() as client:
            # Body exceeds the image limit, but the file itself is exactly 5 MiB.
            response = client.post('/api/labs/1/load', files={
                'file': ('test.png', b'x' * (5 * 1024 * 1024), 'image/png'),
            })
            self.assertEqual(response.status_code, 422)  # Invalid image, not oversized body.

    def test_rate_limit_precedes_body_limit(self):
        from fastapi.testclient import TestClient
        from main import create_app
        from services.rate_limits import RateLimiter
        with TestClient(create_app(RateLimiter(60, 1, clock=lambda: 0))) as client:
            client.get('/api/labs/1/missing')
            response = client.post('/api/labs/1/load', content=b'',
                                   headers={'Content-Length': str(7 * 1024 * 1024)})
            self.assertEqual(response.status_code, 429)

    def test_cancelled_receive_closes_staged_file(self):
        files = []
        def temporary_file(*args, **kwargs):
            file = SpooledTemporaryFile(*args, **kwargs)
            files.append(file)
            return file
        async def exercise():
            waiting = asyncio.Event()
            async def app(scope, receive, send):
                self.fail('Incomplete request reached parser')
            async def receive():
                waiting.set()
                await asyncio.Event().wait()
            async def send(message):
                self.fail('Cancelled request received a response')
            task = asyncio.create_task(RequestBodyLimitMiddleware(app)(
                {'type': 'http', 'method': 'POST', 'path': '/api/labs/1/load', 'headers': []},
                receive, send))
            await waiting.wait()
            task.cancel()
            with self.assertRaises(asyncio.CancelledError):
                await task
        with patch('middleware.request_body_limits.SpooledTemporaryFile', side_effect=temporary_file):
            asyncio.run(exercise())
        self.assertTrue(files[0].closed)

    def test_tempfile_spills_and_closes_when_downstream_fails(self):
        files = []
        def temporary_file(*args, **kwargs):
            file = SpooledTemporaryFile(*args, **kwargs)
            files.append(file)
            return file
        async def exercise():
            async def app(scope, receive, send):
                self.assertTrue(files[0]._rolled)
                data = bytearray()
                while True:
                    message = await receive()
                    self.assertLessEqual(len(message['body']), 64 * 1024)
                    data.extend(message['body'])
                    if not message['more_body']:
                        break
                self.assertEqual(len(data), 2 * 1024 * 1024)
                raise RuntimeError('downstream failed')
            async def receive():
                return {'type': 'http.request', 'body': b'x' * (2 * 1024 * 1024), 'more_body': False}
            async def send(message):
                pass
            with self.assertRaisesRegex(RuntimeError, 'downstream failed'):
                await RequestBodyLimitMiddleware(app)(
                    {'type': 'http', 'method': 'POST', 'path': '/api/labs/1/load', 'headers': []},
                    receive, send)
        with patch('middleware.request_body_limits.SpooledTemporaryFile', side_effect=temporary_file):
            asyncio.run(exercise())
        self.assertTrue(files[0].closed)

    def test_cancellation_waits_for_spool_io_before_closing(self):
        from threading import Event
        for operation in ('write', 'read'):
            with self.subTest(operation=operation):
                started, release, finished = Event(), Event(), Event()
                files, errors = [], []
                def temporary_file(*args, **kwargs):
                    file = SpooledTemporaryFile(*args, **kwargs)
                    original = getattr(file, operation)
                    def blocked(*args):
                        started.set()
                        try:
                            if not release.wait(5):
                                raise RuntimeError('Timed out waiting for test release')
                            return original(*args)
                        except Exception as error:
                            errors.append(error)
                            raise
                        finally:
                            finished.set()
                    setattr(file, operation, blocked)
                    files.append(file)
                    return file
                async def exercise():
                    async def app(scope, receive, send):
                        await receive()
                    async def receive():
                        return {'type': 'http.request', 'body': b'x' * (2 * 1024 * 1024),
                                'more_body': False}
                    async def send(message):
                        pass
                    task = asyncio.create_task(RequestBodyLimitMiddleware(app)(
                        {'type': 'http', 'method': 'POST', 'path': '/api/labs/1/load', 'headers': []},
                        receive, send))
                    self.assertTrue(await asyncio.to_thread(started.wait, 5))
                    try:
                        task.cancel()
                        await asyncio.sleep(0)
                        task.cancel()  # Repeated cancellation must not close active IO either.
                        await asyncio.sleep(0)
                        self.assertFalse(files[0].closed)
                    finally:
                        release.set()
                        try:
                            await task
                        except asyncio.CancelledError:
                            pass
                        await asyncio.to_thread(finished.wait, 5)
                    self.assertTrue(files[0].closed)
                    self.assertEqual(errors, [])
                with patch('middleware.request_body_limits.SpooledTemporaryFile', side_effect=temporary_file):
                    asyncio.run(exercise())
