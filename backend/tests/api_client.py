"""Isolated API clients for algorithm tests; rate limits have dedicated tests."""
from fastapi.testclient import TestClient

from main import create_app
from services.rate_limits import RateLimiter


def api_client():
    return TestClient(create_app(RateLimiter(per_minute=60000, burst=1000)))
