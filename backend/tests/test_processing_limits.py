import asyncio
from concurrent.futures import ThreadPoolExecutor
from threading import Event
import unittest
from unittest.mock import patch

from fastapi import HTTPException
from fastapi.testclient import TestClient

from main import app
from routers import image_io
from services.images import ImageError
from services.processing_limits import ProcessingBusy, ProcessingLimiter, configured_limit


class ProcessingLimiterTests(unittest.TestCase):
    def test_config_defaults_and_rejects_invalid_limits(self):
        with patch.dict('os.environ', {}, clear=True):
            self.assertEqual(configured_limit(), 1)
        for value in ['0', '-1', '1.5', 'many', '']:
            with patch.dict('os.environ', {'OPTIQ_MAX_CONCURRENT_JOBS': value}):
                with self.assertRaisesRegex(ValueError, 'positive integer'):
                    configured_limit()
        with patch.dict('os.environ', {'OPTIQ_MAX_CONCURRENT_JOBS': '2'}):
            self.assertEqual(configured_limit(), 2)

    def test_capacity_is_bounded_and_pending_release_is_idempotent(self):
        limiter = ProcessingLimiter(2)
        first, second = limiter.reserve(), limiter.reserve()
        with self.assertRaises(ProcessingBusy):
            limiter.reserve()
        first.cancel_if_pending()
        first.cancel_if_pending()
        third = limiter.reserve()
        with self.assertRaises(ProcessingBusy):
            limiter.reserve()
        second.cancel_if_pending()
        third.cancel_if_pending()

    def test_cancelled_pending_slot_never_runs_its_function(self):
        slot = ProcessingLimiter(1).reserve()
        slot.cancel_if_pending()
        called = []
        slot.run(lambda: called.append(True))
        self.assertEqual(called, [])

    def test_api_rejects_other_labs_while_health_remains_available(self):
        limiter = ProcessingLimiter(1)
        started, finish = Event(), Event()

        def slow_sample(kind):
            started.set()
            if not finish.wait(5):
                raise AssertionError('Test job was not released')
            raise ImageError('Deliberate processing failure', 422)

        with patch.object(image_io, 'processing_limiter', limiter), patch('routers.lab1.sample_image', slow_sample):
            with TestClient(app) as client, ThreadPoolExecutor(max_workers=1) as pool:
                running = pool.submit(client.get, '/api/labs/1/sample')
                try:
                    self.assertTrue(started.wait(5))
                    for path in ['/api/labs/2/sample', '/api/labs/5/dataset', '/api/labs/6/status']:
                        response = client.get(path)
                        self.assertEqual(response.status_code, 503, path)
                        self.assertEqual(response.headers['Retry-After'], '2')
                        self.assertIn('busy', response.json()['detail'])
                    self.assertEqual(client.get('/api/health').status_code, 200)
                    self.assertEqual(client.get('/api/labs/4/capabilities').status_code, 200)
                    self.assertEqual(client.get('/api/labs/7/status').status_code, 200)
                finally:
                    finish.set()
                self.assertEqual(running.result(timeout=5).status_code, 422)
                self.assertEqual(client.get('/api/labs/2/sample').status_code, 200)


class ProcessingCancellationTests(unittest.IsolatedAsyncioTestCase):
    async def test_failure_releases_the_shared_slot(self):
        def fail():
            raise RuntimeError('Unexpected processing failure')

        with patch.object(image_io, 'processing_limiter', ProcessingLimiter(1)):
            with self.assertRaises(RuntimeError):
                await image_io.process(fail)
            self.assertEqual(await image_io.process(lambda: 'recovered'), 'recovered')

    async def test_cancelling_dispatched_job_keeps_slot_until_worker_finishes(self):
        started, finish, done = Event(), Event(), Event()

        def slow():
            started.set()
            try:
                if not finish.wait(5):
                    raise AssertionError('Test job was not released')
            finally:
                done.set()

        limiter = ProcessingLimiter(1)
        with patch.object(image_io, 'processing_limiter', limiter):
            task = asyncio.create_task(image_io.process(slow))
            try:
                self.assertTrue(await asyncio.to_thread(started.wait, 5))
                task.cancel()
                with self.assertRaises(asyncio.CancelledError):
                    await task
                with self.assertRaises(HTTPException) as caught:
                    await image_io.process(lambda: 'must not start')
                self.assertEqual(caught.exception.status_code, 503)
            finally:
                finish.set()
            self.assertTrue(await asyncio.to_thread(done.wait, 5))
            # done is signaled by the callable just before the reservation's finally.
            for _ in range(100):
                try:
                    self.assertEqual(await image_io.process(lambda: 'finished'), 'finished')
                    break
                except HTTPException:
                    await asyncio.sleep(.01)
            else:
                self.fail('Slot was not released after the worker finished')

    async def test_cancellation_before_dispatch_releases_reserved_slot(self):
        queued = asyncio.Event()
        called = []

        async def delayed_dispatch(function, *args):
            queued.set()
            await asyncio.Event().wait()

        limiter = ProcessingLimiter(1)
        with patch.object(image_io, 'processing_limiter', limiter):
            with patch.object(image_io, 'run_in_threadpool', delayed_dispatch):
                task = asyncio.create_task(image_io.process(lambda: called.append(True)))
                await asyncio.wait_for(queued.wait(), 5)
                task.cancel()
                with self.assertRaises(asyncio.CancelledError):
                    await task
            self.assertEqual(await image_io.process(lambda: 'next'), 'next')
        self.assertEqual(called, [])
