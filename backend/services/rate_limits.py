"""Bounded, process-local token buckets shared across laboratory endpoints."""
import ipaddress
import math
import os
from collections import OrderedDict
from threading import Lock
from time import monotonic


def _positive_integer(value, name):
    if not isinstance(value, int) or isinstance(value, bool) or value < 1:
        raise ValueError(f'{name} must be a positive integer.')
    return value


def client_key(scope):
    # Uvicorn handles trusted proxies. Never trust raw forwarding headers here.
    client = scope.get('client')
    try:
        address = ipaddress.ip_address(client[0]) if client else None
    except ValueError:
        address = None
    if isinstance(address, ipaddress.IPv6Address) and address.ipv4_mapped:
        address = address.ipv4_mapped
    return str(address) if address else 'unknown'


class RateLimiter:
    def __init__(self, per_minute=240, burst=24, *, max_clients=4096, clock=monotonic):
        self._rate = _positive_integer(per_minute, 'Rate per minute') / 60
        self._burst = _positive_integer(burst, 'Burst')
        self._max_clients = _positive_integer(max_clients, 'Maximum clients')
        self._clock = clock
        self._buckets = OrderedDict()
        self._lock = Lock()

    @classmethod
    def from_environment(cls):
        values = {}
        for argument, name, default in (
            ('per_minute', 'OPTIQ_RATE_LIMIT_PER_MINUTE', 240),
            ('burst', 'OPTIQ_RATE_LIMIT_BURST', 24),
            ('max_clients', 'OPTIQ_RATE_LIMIT_MAX_CLIENTS', 4096),
        ):
            try:
                values[argument] = _positive_integer(int(os.environ.get(name, default)), name)
            except ValueError:
                raise ValueError(f'{name} must be a positive integer.') from None
        return cls(**values)

    def check(self, key):
        """Consume one token; return zero on success or seconds until retry."""
        with self._lock:
            now = self._clock()
            lifetime = self._burst / self._rate
            # Only discard fully replenished idle buckets, never active quotas.
            while self._buckets:
                oldest = next(iter(self._buckets))
                if now - self._buckets[oldest][1] < lifetime:
                    break
                self._buckets.popitem(last=False)
            if key not in self._buckets and len(self._buckets) >= self._max_clients:
                oldest_time = next(iter(self._buckets.values()))[1]
                return max(1, math.ceil(lifetime - (now - oldest_time)))
            tokens, updated = self._buckets.pop(key, (self._burst, now))
            tokens = min(self._burst, tokens + max(0, now - updated) * self._rate)
            allowed = tokens >= 1
            self._buckets[key] = (tokens - 1 if allowed else tokens, now)
            return 0 if allowed else max(1, math.ceil((1 - tokens) / self._rate))
