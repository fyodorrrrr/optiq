"""Bound processing across labs within one backend worker process."""
import os
from threading import BoundedSemaphore, Lock


def configured_limit():
    try:
        value = int(os.environ.get('OPTIQ_MAX_CONCURRENT_JOBS', '1'))
        if value < 1:
            raise ValueError
        return value
    except ValueError:
        raise ValueError('OPTIQ_MAX_CONCURRENT_JOBS must be a positive integer.') from None


class ProcessingBusy(Exception):
    pass


class _ProcessingSlot:
    def __init__(self, semaphore):
        self._semaphore = semaphore
        self._lock = Lock()
        self._started = False
        self._released = False

    def run(self, function, *args):
        with self._lock:
            if self._released:
                return None  # Cancelled before a worker could begin.
            self._started = True
        try:
            return function(*args)
        finally:
            # Actual work owns the slot, even after its HTTP task is cancelled.
            with self._lock:
                self._released = True
                self._semaphore.release()

    def cancel_if_pending(self):
        with self._lock:
            if not self._started and not self._released:
                self._released = True
                self._semaphore.release()


class ProcessingLimiter:
    def __init__(self, limit):
        if not isinstance(limit, int) or isinstance(limit, bool) or limit < 1:
            raise ValueError('Processing limit must be a positive integer.')
        self._semaphore = BoundedSemaphore(limit)

    def reserve(self):
        if not self._semaphore.acquire(blocking=False):
            raise ProcessingBusy('The server is busy. Wait a moment and try again.')
        return _ProcessingSlot(self._semaphore)


processing_limiter = ProcessingLimiter(configured_limit())
