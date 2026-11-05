# API rate limiting

Add a process-local token bucket before lab request parsing, without changing
algorithms, frontend controls, dependencies, or deployment architecture.

- [x] Specify regression tests for burst/refill, shared quota, concurrency,
  bounded client storage, pre-body rejection, camera cadence and exemptions.
- [x] Add middleware and configurable limiter; use server-provided client IP.
- [x] Introduce an app factory for isolated limiter tests; preserve `main:app`.
- [x] Run targeted and complete backend tests and review implementation.
- [x] Document deployment limits and proxy requirements.

Defaults: 240 requests/minute, burst 24, at most 4096 tracked clients.
Unknown clients share a bucket. Full storage rejects new clients until an idle
bucket can safely expire; active buckets are never evicted to reset allowances.
Health and OPTIONS are exempt. All attempted lab requests consume allowance,
including invalid requests and processing-busy responses. No automatic retry.

Verification: 8 targeted limiter tests and all 87 backend tests passed. All seven
labs loaded with successful initial API responses in a local headless browser.
`git diff --check` passed. Independent code review found no implementation
issues; its requested operational documentation is included in ARCHITECTURE.md.
Actual production proxy identity and capacity have not been validated.
