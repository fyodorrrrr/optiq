import os

from fastapi import FastAPI
from starlette.concurrency import run_in_threadpool
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse
from routers.lab1 import router as lab1_router
from routers.lab2 import router as lab2_router
from routers.lab3 import router as lab3_router
from routers.lab4 import router as lab4_router

from routers.lab5 import router as lab5_router

from routers.lab6 import router as lab6_router

from routers.lab7 import router as lab7_router

from middleware.rate_limits import RateLimitMiddleware
from middleware.request_body_limits import RequestBodyLimitMiddleware
from services.rate_limits import RateLimiter
from services.configuration import allowed_origins
from services.readiness import Readiness
from middleware.request_deadline import RequestDeadlineMiddleware


def create_app(rate_limiter=None):
    production = os.environ.get('OPTIQ_ENV') == 'production'
    app = FastAPI(title="Optiq API", docs_url=None if production else '/docs',
                  redoc_url=None if production else '/redoc',
                  openapi_url=None if production else '/openapi.json')
    readiness = Readiness()
    # Last added runs first: rate admission precedes request-body staging.
    app.add_middleware(RequestBodyLimitMiddleware)
    app.add_middleware(RequestDeadlineMiddleware)
    app.add_middleware(
        RateLimitMiddleware,
        limiter=rate_limiter if rate_limiter is not None else RateLimiter.from_environment(),
    )
    app.add_middleware(CORSMiddleware, allow_origins=allowed_origins(),
                       allow_methods=['GET', 'POST', 'OPTIONS'],
                       allow_headers=['Content-Type'], expose_headers=['Retry-After'],
                       allow_credentials=False)
    for router in (lab1_router, lab2_router, lab3_router, lab4_router,
                   lab5_router, lab6_router, lab7_router):
        app.include_router(router)

    @app.get("/api/health")
    def health():
        return {"status": "ok", "message": "Optiq backend is connected"}

    @app.get('/api/ready')
    async def ready():
        report = await run_in_threadpool(readiness.report)
        return JSONResponse(report, status_code=200 if report['status'] == 'ready' else 503,
                            headers={'Cache-Control': 'no-store'})

    return app


app = create_app()
