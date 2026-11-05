from fastapi import FastAPI
from routers.lab1 import router as lab1_router
from routers.lab2 import router as lab2_router
from routers.lab3 import router as lab3_router
from routers.lab4 import router as lab4_router

from routers.lab5 import router as lab5_router

from routers.lab6 import router as lab6_router

from routers.lab7 import router as lab7_router

from middleware.rate_limits import RateLimitMiddleware
from services.rate_limits import RateLimiter


def create_app(rate_limiter=None):
    app = FastAPI(title="Optiq API")
    app.add_middleware(
        RateLimitMiddleware,
        limiter=rate_limiter if rate_limiter is not None else RateLimiter.from_environment(),
    )
    for router in (lab1_router, lab2_router, lab3_router, lab4_router,
                   lab5_router, lab6_router, lab7_router):
        app.include_router(router)

    @app.get("/api/health")
    def health():
        return {"status": "ok", "message": "Optiq backend is connected"}

    return app


app = create_app()
