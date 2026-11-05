# Production preparation implementation plan

**Goal:** prepare the existing Vercel frontend / single Oracle Linux backend
for deployment, with honest local versus target verification.
**Architecture:** keep FastAPI and trusted local model preparation. Use a
build-time frontend API origin for direct browser-to-backend HTTPS, exact CORS
origins, Caddy TLS/ingress protection and one systemd-managed Uvicorn worker.
**Stack:** existing React/Vite, Python 3.12/FastAPI; Caddy/systemd deployment files.
**Scope:** the user's seven-item predeployment list. No cloud provisioning,
paid services, arbitrary training or persistent user uploads.

## Review focus

- Readiness must not download, fit models or disclose internal paths.
- HTTP cancellation/timeouts must retain the processing slot until real CPU work ends.
- CORS errors must remain readable; unknown origins must not receive permission.
- Trust only loopback Caddy, overwrite client-supplied forwarding headers.
- Linux dependencies/artifacts are target-specific; do not claim local macOS proves Linux readiness.

## Tasks

- [x] Commit verified upload protection separately (`8ab13a3`).
- [x] Readiness: add cached resource inspection and `/api/ready` 200/503 with
  fixed public boolean keys. Validate LFW, SURF, detector runtime/weights,
  matching custom training/test artifacts, semantic manifest, samples, writable
  temp/cache paths. Add failure/privacy/cache tests first.
- [x] Timeouts: bound body receipt to 30 seconds and total lab HTTP wait to
  110 seconds, preserve 503 processing reservations for late workers; add
  deadline, partial-response and upload-timeout regression tests first.
- [x] Frontend transport: central API URL and consistent timeout-aware fetch
  helper, 120-second experiment waits / 30-second metadata waits. Validate
  production HTTPS origin. Preserve cancellation replay prevention and errors.
- [x] Hosting config: exact CORS, Vercel SPA fallback, environment examples,
  Caddy TLS/size/timeout/header config and single-worker systemd unit with restart
  and bounded journal logging. Validate Caddy config using local executable.
- [x] Preparation/operations: offline resource verification CLI, explicit Linux
  preparation script using existing asset/SURF scripts, safe asset-transfer
  checklist, smoke test CLI, readiness monitor systemd timer and runbook.
- [x] Verify: full backend suite, frontend lint/build with production API origin,
  local seven-lab browser checks, real experiment API smoke run, proxy/CORS/header
  tests and independent final code review. Report missing actual Linux/cloud checks.

User approval covers implementing these tasks. Keep final work reviewable;
only the already-requested upload commit is automatic. Templates contain
placeholders; no account access or domains were supplied for live deployment.

## Local verification and remaining target work

- 109 backend tests pass, including 9 new deployment tests.
- Frontend lint and production build with an HTTPS API origin pass.
- Offline readiness and actual pretrained/custom/semantic inference pass.
- Full API smoke checks pass for all seven labs, including PCA/SVM and SURF.
- Direct cross-origin seven-lab browser startup and CORS full smoke checks pass.
  An initial browser pass overlapped the full experiment smoke and received the
  expected busy 503; the isolated repeat passed without automatic retries.
- Caddy adapt/validate pass; real temporary Caddy routing/CORS/413 checks pass.
  A real Caddy -> Uvicorn diagnostic confirms spoofed forwarding headers cannot
  change client identity or reset the allowance.
- Transport checks exercise origin, GET/POST deadlines, API errors, cancellation,
  offline behavior and response-body timeout. Shell syntax and diff checks pass.
- Independent review found one raw Lab 6 training-log URL; it now uses apiUrl.

No cloud credentials/VM URLs were supplied. Actual Linux install/SURF build,
systemd/reboot, public TLS/firewall/Vercel routing and external alert delivery
remain user-account/target steps, not claims of completed deployment. The runbook
makes these steps concrete and provides verification/rollback commands.
