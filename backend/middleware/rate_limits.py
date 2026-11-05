"""Reject excessive lab traffic before request bodies are parsed."""
from starlette.responses import JSONResponse

from services.rate_limits import client_key


class RateLimitMiddleware:
    def __init__(self, app, limiter):
        self.app = app
        self.limiter = limiter

    async def __call__(self, scope, receive, send):
        if (scope['type'] == 'http' and scope['method'] != 'OPTIONS'
                and scope['path'].startswith('/api/labs/')):
            retry_after = self.limiter.check(client_key(scope))
            if retry_after:
                response = JSONResponse(
                    {'detail': 'Too many requests. Wait a moment and try again.'},
                    status_code=429,
                    headers={'Retry-After': str(retry_after), 'Cache-Control': 'no-store'},
                )
                await response(scope, receive, send)
                return
        await self.app(scope, receive, send)
