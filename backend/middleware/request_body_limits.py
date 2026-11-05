"""Bound laboratory request bodies before multipart parsing."""
import asyncio
from tempfile import SpooledTemporaryFile

from starlette.concurrency import run_in_threadpool
from starlette.responses import JSONResponse

MIB = 1024 * 1024


async def _file_io(function, *args):
    # A cancelled HTTP task cannot stop an OS file operation. Finish that
    # operation before propagating cancellation and closing its file.
    task = asyncio.create_task(run_in_threadpool(function, *args))
    cancelled = None
    while True:
        try:
            result = await asyncio.shield(task)
            break
        except asyncio.CancelledError as error:
            if task.cancelled():
                raise
            cancelled = error
        except Exception:
            if cancelled is not None:
                raise cancelled from None
            raise
    if cancelled is not None:
        raise cancelled
    return result


class RequestBodyLimitMiddleware:
    def __init__(self, app, max_bytes=6 * MIB, pair_max_bytes=11 * MIB, read_seconds=30):
        self.app = app
        self.read_seconds = read_seconds
        self.max_bytes = max_bytes
        self.pair_max_bytes = pair_max_bytes

    async def __call__(self, scope, receive, send):
        if (scope['type'] != 'http' or scope['method'] == 'OPTIONS'
                or not scope['path'].startswith('/api/labs/')):
            await self.app(scope, receive, send)
            return

        limit = self.pair_max_bytes if scope['path'] == '/api/labs/4/experiment' else self.max_bytes
        lengths = [value for name, value in scope['headers'] if name == b'content-length']
        if lengths:
            # Reject ambiguous lengths rather than interpreting duplicate/comma values.
            value = lengths[0]
            if len(lengths) != 1 or not value.isdigit() or len(value) > 20:
                await self.reject(scope, receive, send, 400, 'Invalid request size header.')
                return
            if int(value) > limit:
                await self.too_large(scope, receive, send, limit)
                return

        # Stage before parsing: the multipart parser never sees an oversized body.
        # File IO and cleanup are offloaded on all exit paths.
        body = SpooledTemporaryFile(max_size=MIB, mode='w+b')
        try:
            total = 0
            receive_deadline = asyncio.get_running_loop().time() + self.read_seconds
            while True:
                try:
                    async with asyncio.timeout_at(receive_deadline):
                        message = await receive()
                except TimeoutError:
                    await self.reject(scope, receive, send, 408, 'The upload took too long. Try again.')
                    return
                if message['type'] == 'http.disconnect':
                    return
                chunk = message.get('body', b'')
                total += len(chunk)
                if total > limit:
                    await self.too_large(scope, receive, send, limit)
                    return
                if chunk:
                    await _file_io(body.write, chunk)
                if not message.get('more_body', False):
                    break
            await _file_io(body.seek, 0)
            remaining = total

            async def replay():
                nonlocal remaining
                if remaining is None:
                    return await receive()  # Preserve later disconnect notifications.
                chunk = await _file_io(body.read, 64 * 1024)
                remaining -= len(chunk)
                more = remaining > 0
                if not more:
                    remaining = None
                return {'type': 'http.request', 'body': chunk, 'more_body': more}

            await self.app(scope, replay, send)
        finally:
            await _file_io(body.close)

    async def too_large(self, scope, receive, send, limit):
        await self.reject(scope, receive, send, 413,
                          f'Upload request is too large. Maximum total size is {limit // MIB} MiB.')

    @staticmethod
    async def reject(scope, receive, send, status, detail):
        await JSONResponse({'detail': detail}, status_code=status,
                           headers={'Cache-Control': 'no-store'})(scope, receive, send)
