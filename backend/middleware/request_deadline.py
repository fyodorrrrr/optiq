"""Bound HTTP waiting; running CPU work retains its processing reservation."""
import asyncio
from starlette.responses import JSONResponse


class RequestDeadlineMiddleware:
    def __init__(self, app, seconds=110):
        self.app = app
        self.seconds = seconds

    async def __call__(self, scope, receive, send):
        if (scope['type'] != 'http' or scope['method'] == 'OPTIONS'
                or not scope['path'].startswith('/api/labs/')):
            await self.app(scope, receive, send)
            return
        started = False
        async def tracked_send(message):
            nonlocal started
            if message['type'] == 'http.response.start':
                started = True
            await send(message)
        deadline = asyncio.timeout(self.seconds)
        try:
            async with deadline:
                await self.app(scope, receive, tracked_send)
        except TimeoutError:
            if not deadline.expired() or started:
                raise  # Never replace a partial response or unrelated downstream error.
            await JSONResponse(
                {'detail': 'The request took too long. Processing may still be running; wait before retrying.'},
                status_code=504, headers={'Cache-Control': 'no-store'},
            )(scope, receive, send)
