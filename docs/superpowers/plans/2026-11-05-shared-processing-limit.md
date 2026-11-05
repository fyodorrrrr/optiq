# Shared Processing Limit

Goal: add one shared, configurable processing budget to the current backend worker, covering all labs through the existing `routers.image_io.process` boundary. This is the first production-preparation item only; request-rate limits, upload ingress limits, readiness and timeout changes remain separate.

Design: a non-blocking bounded semaphore admits a processing job before thread-pool dispatch. A reservation records whether a worker has started. The worker releases its slot in `finally`; cancellation releases a reservation only if work has not started. This prevents both leaked queued reservations and premature admission after browser/server-task cancellation. Existing lab-specific locks remain unchanged.

Default: one job per process, configured with positive integer `OPTIQ_MAX_CONCURRENT_JOBS`. Saturated requests receive HTTP 503 and Retry-After: 2, with no automatic retry/hidden queue. All existing image/sample/load/experiment work and heavier status checks participate. Small Lab 4 capability and Lab 7 model-availability probes explicitly opt out, preserving their parallel sample-loading flow; `/api/health` does not use this helper and remains available. Request/form validation still precedes admission. JSON serialization and multipart parsing are outside this first-step budget.

Implementation and verification:

- [x] Write failing tests for cross-lab rejection, health availability, failure recovery, cancellation before/after worker dispatch, bounded configuration and limits greater than one.
- [x] Add `backend/services/processing_limits.py`, integrate only `backend/routers/image_io.py`; preserve algorithms and frontend behavior.
- [x] Run targeted tests and the complete backend suite; document the single-worker deployment assumption and explain the request lifecycle to the user.

Tradeoffs: one long experiment can temporarily block other processing/status/sample requests. Prefer immediate busy feedback over an unbounded queue on the initial small server. The budget is per worker; deploying multiple processes multiplies capacity and model memory. Start with one worker and increase capacity only after measuring real load. This is not rate limiting or a hard memory/CPU quota.


Verification: seven new regression tests cover cross-lab saturation/recovery,
health and cheap-probe availability, error recovery, configuration, reservations
above one, cancelled queued work, and a cancelled HTTP task whose worker remains
active. All 79 backend tests pass. No new dependency or algorithm change.


Browser verification found that React StrictMode's cancelled first initialization
request could occupy the sole slot while the replacement request arrived. The
three existing frontend request helpers now yield one microtask and check the
caller signal before fetch. This avoids sending already superseded work; it is
not a retry. Frontend lint/build pass, and all seven lab initial API flows return
200 in fresh browser contexts. Independent code review found no actionable issue.
