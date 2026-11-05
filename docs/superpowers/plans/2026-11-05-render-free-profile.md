# Render Free implementation plan

Goal: configure Vercel static demos + a bounded Render Free classical backend.
User approved this hosting architecture; preserve GitHub full-local729d587.

Runtime: OPTIQ_PROFILE=render-free, default full. Render mounts Labs1–4 and7 only;
semantic execution is rejected at the service boundary, Lab5/6 routes are absent.
Readiness checks actual SURF/SIFT/ORB and temp storage only; no ML imports/models.
Live bounds: 350000 pixels,1024px/side,5MiB/image,one processing slot,one OpenCV
thread and8 admitted connections. Full profile retains existing limits/behavior.
Frontend VITE_API_PROFILE=render-free matches validation/help; VITE_API_BASE_URL
continues direct HTTPS API access with exact CORS. Never resize uploads silently.

- [x] Write failing isolated subprocess tests for profile validation, fresh imports
  (reject sklearn/torch/ultralytics), ready health, liveAPI, bounds, omitted routes,
  semantic denial and prepared scene sample. Assert default full compatibility.
- [x] Add immutable startup profile; lazy-load full routers/readiness. Apply limits
  before decoding/allocating resize arrays, block semantic requests and package
  the attributed natural-scene sample without downloads.
- [x] Add frontend profile constants to resize limits and visible input guidance.
  Bound all live uploads consistently; retain full local default behavior.
- [x] Add minimal pinned runtime lock, multi-stage Docker SURF build, nonroot
  start script with PORT, limited concurrency/threads and safe proxy handling,
  Render plan:free blueprint and strict build context exclusions.
- [x] Add Render smoke/preflight mode, operational/deployment instructions including
  free sleep/cold-start behavior, HTTPS/CORS/real-IP checks, no disk/models needed,
  rollback and actual Linux/free-tier verification boundaries.
- [x] Run all tests, frontend checks, profile API/browser smoke and local memory
  measurements. Validate config and independently review. Report Docker/cloud
  checks that cannot run, without claiming a live deployment.

Constraints: no cloud account access, Docker daemon or production URL supplied.
Render handles TLS/restarts; do not run Oracle's Caddy/systemd inside Render.
A Render runtime memory limit still needs a real deployment workload check.


Verification: 117 backend tests pass, including isolated fresh-process import
blocking for sklearn/scipy/torch/torchvision/ultralytics and profile/full bounds.
Frontend lint and Render-profile HTTPS-origin build pass. Real API smoke runs
for Labs1–4 and7 pass, including SURF. All7 browser routes load against the
Render-profile API; Labs5/6 make zero API requests. Browser resize guard, valid
resize, matching input help and static semantic selection pass. Maximum350000px
live workload peaked at223.2MiB RSS on macOS (not Render emulation).

Linux/Python3.12 wheel dependency resolution succeeds, including pinned
opentelemetry-api discovered by the resolver. Blueprint parsed/structural fields
and shell syntax pass. Independent review found Lab4's full-profile help needed
its1M input/2M canvas exception; corrected along with Lab7's1M full input cap.
Documented the700000px/2048px match canvas exception in Render mode.

No Docker daemon or Render account/API access is configured here. The actual
Linux SURF image build, deployment, TLS, provider proxy identity, sleep/wakeup,
512MB/0.1CPU behavior remain explicit target checks, not completed claims.
All configuration is ready for review; changes remain uncommitted.
