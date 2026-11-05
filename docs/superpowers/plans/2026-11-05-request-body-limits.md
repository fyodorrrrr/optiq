# Request body limits

Protect laboratory API ingress before multipart parsing, preserving existing
5 MiB per-file and decoded-image validation. This is the next sequential
production-preparation step after shared processing and IP rate limits.

Approach: pure ASGI middleware counts actual request bytes before forwarding to
FastAPI. Content-Length permits immediate rejection, but is never the only check.
Spool accepted bodies with a 1 MiB memory threshold and replay in bounded chunks;
use the thread pool for temporary-file IO and close files on every exit path.
This trades a small staging/IO cost for predictable pre-parser rejection and
avoids raising into a multipart parser that may own partially written files.
A reverse-proxy-only limit cannot protect the locally exposed application by
itself and will be configured separately when deployment is set up.

Policy: 6 MiB total per lab request, 11 MiB for Lab 4's two-image experiment.
Limits include headers within multipart parts and form settings, not HTTP headers.
Over-limit responses use JSON detail / HTTP 413 and no-store. Invalid/ambiguous
Content-Length yields 400. Rate limiting remains outermost. Health and preflight
are unaffected. No new UI copy, algorithm changes or dependencies.

- [x] Write failing tests for header and streamed limits, boundary acceptance,
  multipart overhead, two-image allowance, disconnects and resource cleanup.
- [x] Implement middleware and connect it inside the rate limiter.
- [x] Run complete backend suite, browser initial flows and independent review.
- [x] Document limits and remaining proxy/slow-upload/aggregate protections.

Verification: all 13 body-limit tests and all 100 backend tests pass. Initial API
loads for all seven labs succeeded in a local browser. Review found a cancellation
race in the initial staging implementation; a deterministic write/rollover and
read cancellation regression reproduced it, and protected IO fixed it. Follow-up
review found no remaining actionable issues. No frontend source changed.
Production proxy limits and slow/aggregate-upload protection remain open.
