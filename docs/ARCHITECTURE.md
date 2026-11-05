# Optiq Architecture

## Current Boundaries

React/TypeScript renders the homepage and all seven lab routes, `/labs/1`
through `/labs/7`; React Router handles navigation. Lab route components are
lazy-loaded behind a shared Suspense loading state; the homepage loads independently
of lab experiment code. Homepage lab links use client-side navigation. Labs 1–5 and 7 are
implemented. Lab 6 provides pretrained detection and local training/artifact
review, with a completed 100-epoch custom bottle run and validation evaluation. FastAPI provides
`/api/health` and per-lab endpoints. Vite proxies `/api` to port 8000 in
development. Production targets a Vercel static frontend and one Oracle Linux VM running
Caddy plus a single Uvicorn worker. `VITE_API_BASE_URL` selects direct browser-to-API
HTTPS; exact CORS origins authorize browser access. Templates and the runbook live
in [DEPLOYMENT.md](DEPLOYMENT.md); cloud deployment is not yet verified.

## Shared processing budget

All labs submit blocking work through `routers/image_io.process`. Before dispatch,
`services/processing_limits.py` reserves one shared processing slot. The default
`OPTIQ_MAX_CONCURRENT_JOBS=1` allows one protected job per backend process; set a
positive integer before starting the server to change this after load testing.
Invalid values fail startup explicitly. Start the initial production deployment
with one worker: multiple workers each have their own budget and model caches.

When all slots are occupied, the API returns HTTP 503 with a short busy message
and `Retry-After: 2`; it does not enqueue processing requests or automatically
retry them. Image loading/decoding, generated samples, experiment execution, and
heavier dataset/status operations share this budget. The small Lab 4 capability
and Lab 7 model-availability probes opt out, preserving parallel initial page
loads. `/api/health` stays independent. Existing per-lab locks remain in place.

A reservation is acquired before thread-pool dispatch. The worker releases it in
`finally`, including failures. Cancellation before dispatch releases an unused
reservation; cancellation after work begins leaves it occupied until the worker
actually finishes. Cancelling an HTTP request does not terminate CPU algorithms.
This prevents both leaked reservations and premature replacement jobs.

The budget bounds protected work inside a process, not total RAM/CPU, request
rate, multipart parsing, or response serialization. Request/form validation still
precedes processing admission. Frontend request helpers yield one microtask and
check cancellation before fetch, preventing superseded initialization requests
from consuming a slot during development effect replay. This does not retry busy
requests. Request-body admission is a separate middleware layer below; readiness
and timeout checks are described below.

## API rate limiting

`middleware/rate_limits.py` checks every HTTP request under `/api/labs/` before
FastAPI parses the request body. All lab endpoints share one allowance per
server-provided client IP, including sample/status/download requests, invalid
requests, and attempts that subsequently receive a processing-busy response.
OPTIONS requests and `/api/health` are exempt. Excess traffic returns HTTP 429,
a JSON `detail`, `Retry-After` in seconds, and `Cache-Control: no-store`. Existing
frontend error handling displays the message; no automatic retry is added.

`services/rate_limits.RateLimiter` uses a token bucket: each request consumes one
token, tokens refill gradually, and unused tokens accumulate only up to the burst
capacity. Positive-integer environment settings are read at app creation:

| Setting | Default | Purpose |
| --- | --- | --- |
| `OPTIQ_RATE_LIMIT_PER_MINUTE` | 240 | Refill rate, equivalent to four requests per second |
| `OPTIQ_RATE_LIMIT_BURST` | 24 | Maximum immediate allowance |
| `OPTIQ_RATE_LIMIT_MAX_CLIENTS` | 4096 | Maximum tracked client buckets |

These are initial defaults, not measured server capacity. The camera's maximum
two requests per second fits this allowance. Users behind a shared public IP
share the same quota. Buckets live only in memory, reset on restart, and are
independent in each worker; keep the initial deployment to one worker. No Redis
or persistent IP log is introduced. IPv4-mapped IPv6 addresses are normalized;
missing/invalid client addresses share an `unknown` bucket. Idle buckets expire
only after enough time to refill completely. At capacity, new clients receive
429 until a bucket expires instead of evicting an active client's quota.

**Deployment requirement:** the limiter uses ASGI `scope['client']`, never raw
`X-Forwarded-For` or similar headers. Uvicorn may populate this address from
trusted proxies. Configure the actual reverse-proxy chain to sanitize forwarded
headers and trust only known proxy addresses; do not use unrestricted
`--forwarded-allow-ips '*'`. Verify distinct client identities through the real
Vercel/backend proxy path before launch. Incorrect configuration can pool users
under a proxy IP or permit forged identities. That deployment check remains open.
This application limiter complements the request-body size/time limits below;
it does not replace edge/network abuse protection.

`main.create_app` creates the normal global `app` and allows tests to inject an
isolated limiter. Algorithm/API tests use a fresh, generous finite allowance;
dedicated limiter tests cover the production policy with a controlled clock.

## Request-body admission

Request order is rate admission → whole-body size check/staging → FastAPI
multipart/schema validation → processing-slot admission → image algorithms.
`middleware/request_body_limits.py` bounds the entire received body of lab API
requests before multipart parsing:

| Request | Whole-body limit |
| --- | --- |
| `/api/labs/4/experiment` (two images) | 11 MiB |
| Other `/api/labs/` requests | 6 MiB |

These totals include multipart boundaries, part headers and settings. Existing
5 MiB **per image**, image-format, decoded-dimension and camera-specific checks
remain authoritative and unchanged. A body within the total limit can still be
rejected by those checks. The limits are defined in the middleware, with the
Lab 4 allowance selected by its two-upload endpoint.

An oversized Content-Length returns JSON HTTP 413 without reading the body.
Actual bytes are always counted as well, so absent or falsely small length
headers cannot bypass the limit. Ambiguous/invalid length headers receive 400.
Error responses use the existing JSON `detail` format and `Cache-Control:
no-store`. Health/non-lab requests and OPTIONS pass through untouched. The rate
limiter runs first, so a rate-rejected upload is never staged.

Accepted-size bodies are staged in `SpooledTemporaryFile`, keeping at most a
1 MiB spool threshold in memory before spilling to the OS temporary directory.
Temporary-file reads/writes use the thread pool; replay to FastAPI uses 64 KiB
chunks. The temporary file closes on success, rejection, disconnection,
cancellation or downstream exceptions. Cancellation waits for active file IO to
finish before cleanup; cleanup is also offloaded. Staging before parsing prevents the
multipart parser from creating temporary upload files for an oversized body.
It adds IO and temporary storage for accepted uploads; the spool threshold does
not bound server-received chunk buffers or total process memory.

Body receipt is bounded to 30 seconds; stalled uploads return JSON 408 and the
spool is cleaned up. This is a per-request size/time bound, not an aggregate
connection limit. The deployment template uses Caddy ingress limits and Uvicorn
connection admission. Provide a writable temporary directory with adequate disk
space; actual production capacity still requires target verification.

## Readiness, timeouts and production transport

`/api/health` remains lightweight liveness. `/api/ready` runs cached, thread-pool
resource inspection in `services/readiness.py` (60-second TTL), independently of
the experiment slot. It checks actual feature capabilities, offline LFW loading,
optional runtime imports, detector checkpoint/training/evaluation relationships,
semantic manifest/hash, prepared samples and writable temp/settings storage.
It returns only named boolean checks with HTTP 200 or 503 and no-store. It never
fits models, downloads data or runs inference. The separate trusted CLI
`backend/scripts/verify_deployment.py --inference` verifies real model loading.

Middleware order: CORS → rate allowance → 110-second lab HTTP deadline →
30-second body receipt and size staging → FastAPI validation → processing slot.
`RequestDeadlineMiddleware` returns JSON 504 before a response starts and does
not replace partial responses. Thread work cannot be forcibly cancelled; it
retains its processing slot until completion. Health/ready/preflight are exempt
from experiment deadlines. Exact origins come from `OPTIQ_ALLOWED_ORIGINS`;
production disables docs/OpenAPI. CORS is browser policy, not authentication.

`frontend/src/api/transport.ts` centralizes URL construction, cancellation and
JSON/error handling for all lab requests. `VITE_API_BASE_URL` is an HTTPS origin
in production, empty for the local Vite proxy. Metadata waits 30 seconds; POSTs
wait 120 seconds including response-body reading. Superseded effect cancellation
still settles before fetch; no retries are introduced. Training-log downloads
and the development health check use the same API origin.

The deployment templates provide Caddy TLS/size/deadline/trusted-IP handling,
one Uvicorn process (16 admitted connections/tasks), a restartable/hardened
systemd service and a five-minute readiness/storage timer with bounded journal
retention. The timer logs failures; external alert delivery still needs account
configuration. See the deployment runbook for Linux dependency/asset preparation,
Vercel SPA fallback, rollback, actual verification and remaining cloud checks.

## Lab 1 Request Flow

1. `frontend/src/labs/lab1/useLab1.ts` requests a generated sample or submits an uploaded file. It retains the original file and decoded metadata in page memory.
2. `api.ts` sends multipart uploads and JSON operation settings. Each experiment resends the original, keeping API processing stateless without an upload store or session lifecycle.
3. `backend/routers/lab1.py` reads bounded file content, parses typed settings, and dispatches CPU processing to a thread pool.
4. `backend/schemas/lab1.py` defines a discriminated settings union, numeric bounds, and response schemas. Unexpected operation fields are rejected.
5. `backend/services/images.py` inspects format/dimensions with Pillow before OpenCV decoding. It normalizes supported inputs, encodes lossless PNGs, and reports actual array metadata.
6. `backend/services/lab1.py` runs the selected operation on a copy and returns the image, parameters, OpenCV version, and pixel comparisons where applicable.
7. React displays the returned PNG and metadata. Abort controllers prevent responses from superseded inputs or operations from replacing current state. Downloads use the returned PNG directly.

Stateless requests trade repeated upload/decoding work for a simpler lifecycle.
This suits bounded image experiments. The implemented PCA fitting, detection,
segmentation, and local YOLO training workflows have their own processing and
concurrency rules, described below.

## Lab 2 Separation and Processing

Lab-specific state, API clients, settings, algorithms, and learning content
stay under their own modules. Labs 1 and 2 established the common UI now used
across all seven labs. `frontend/src/api/images.ts` provides common image
transport/types used by later image-based modules; Lab 1 retains its own API
client and per-tool state behavior.

Both backend routers share the image schema in `schemas/images.py`, upload/thread-pool helpers in `routers/image_io.py`, and validation/encoding in `services/images.py`. `schemas/lab1.py` re-exports the common Frame contract for compatibility. Shared helpers preserve existing Lab 1 behavior.

Lab 2 has `/api/labs/2/sample`, `/load`, and `/experiment` endpoints. Its service converts to grayscale, applies one Gaussian blur, then feeds that same array to Sobel x/y, combined magnitude, and Canny. Responses include all comparison and intermediate frames, raw ranges, edge-pixel count, display-scaling description, settings, and OpenCV version.

Defaults match the activity: Gaussian 3×3, Sobel size 3, Canny 100/200. Canny retains aperture 3 and `L2gradient=False`. Gaussian sizes are odd 1–9; Sobel sizes are 3/5/7; thresholds are whole numbers with `0 ≤ lower < upper ≤ 2048`. Limits are engineering choices for exploration. Sobel magnitude/absolute derivatives are display-scaled independently to 0–255 with zero-safe normalization; signed gradient extrema remain available numerically. Edge-pixel percentage describes output density, not accuracy.

Generated shapes and noisy shapes replace the absent source image, with noise seed 42 and standard deviation 18. Each run resends the original input; changed settings abort pending requests while retaining completed output. The status message identifies previous results when draft settings differ; the Run details overlay records the parameters that produced the displayed output. Successful runs replace the output; changing the source clears it. Sidebar sections focus controls without hiding the required three-way comparison.

## Lab 3 Histograms and Contrast

Lab 3 keeps its state, controls, content, and API client in `frontend/src/labs/lab3/`; processing lives in `services/lab3.py` with dedicated schemas/router. It consumes the same shell, tool sidebar, input picker, fields, feedback, viewers, and learning disclosure as the earlier labs.

`/api/labs/3/sample`, `/load`, and `/experiment` follow the same bounded, stateless image transport. One comparison computes the working original, global equalization, CLAHE, and linear adjustment from the same input. Grayscale mode converts color first; color mode transforms Y in YUV and retains U/V before reconstructing BGR. Color mode requires color input.

Every view includes its actual frame, 256-bin histogram, range, mean, standard deviation, and occupied-bin count. Histograms are measured from the final grayscale/Y channel, so color reconstruction clipping and rounding are reflected. Charts share one maximum count across all views and are rendered by the reusable `components/lab/Histogram.tsx` SVG component, with accessible descriptions and real-bin hover values. This adds no chart dependency.

CLAHE defaults to clip limit 2 and 8×8 tiles; validated limits are `(0, 40]` and 1–16 tiles per axis. Manual linear adjustment is `clip(rint(alpha * channel + beta), 0, 255)` with scale 0–10 and integer offset −255 to 255. Full-range stretching computes scale/offset from observed extrema; a constant channel remains unchanged. Effective coefficients and notes are returned for reproducibility.

Color inputs select color mode when loaded; grayscale inputs disable the unavailable color option. Reset restores grayscale/2/8×8/manual-1.2/0 defaults. New inputs clear results. Settings changes and failed reruns retain completed output and measurements, with previous-result feedback when draft settings differ. Generated samples include low contrast, color, and uneven lighting with noise seed 42. Downloads use actual PNG results and the returned histogram counts as CSV.

## API

| Endpoint | Input | Output |
| --- | --- | --- |
| `GET /api/labs/1/sample` | `kind=color` or `grayscale` | Frame |
| `POST /api/labs/1/load` | Multipart `file` | Frame |
| `POST /api/labs/1/experiment` | Multipart `file` and JSON string `settings` | Result, optional pixel comparison, parameters, engine |

A Frame contains a PNG data URL, width, height, channels, shape, dtype, color space, and preprocessing notes. Operation names are `inspect`, `edit`, `grayscale`, `crop`, `resize`, and `rotate`. API documentation at `/docs` describes the multipart transport and response models; the discriminated operation definitions live in `schemas/lab1.py`.

## Image Conventions and Limits

- Inputs: 8-bit grayscale/color PNG or JPEG, including supported palette/transparency normalization. Unsupported depth/layout is rejected.
- File limit: 5 MiB; dimensions: at most 4096 per side and four million pixels. Resize outputs obey the same dimension/pixel bounds.
- Labs 4 and 7 additionally cap each input at one million pixels. Lab 4 caps
  its match canvas at two million pixels. Lab 5 uses a prepared dataset rather
  than image uploads; Lab 6 camera frames have the separate limits below.
- OpenCV color arrays are BGR; encoded PNGs display correctly as RGB in the browser. Grayscale arrays retain a two-dimensional shape and one channel.
- Transparency is composited onto white. EXIF orientation is not applied; coordinates follow decoded array orientation. No automatic downscaling.
- Coordinates are zero-based `(x, y)`; array indexing is `[y, x]`. Crop uses exclusive end bounds derived from left/top/width/height. Rotation accepts `quarter_turns` 0–3 (default 1); the client advances one clockwise step per successful run and applies the total angle to the original. Failed or superseded runs do not advance it. Clearing results or accepting a new image resets the angle.
- Color edits accept RGB values and reverse them for BGR assignment; grayscale edits accept one intensity. Pixel zoom uses nearest-neighbor display and edge replication, leaving the real image unchanged.
- Images are not retained after requests. Framework-managed temporary upload spooling may occur; no application upload store or persistent filesystem is used.

## Interface and Learning

`frontend/src/components/lab/` is the canonical lab UI layer:

- `LabPage.tsx`: page shell, navigation, introduction/actions, and footer.
  Footer navigation links to the previous and next labs; Lab 1 has no previous
  link, and Lab 7 returns to the catalogue instead of a next lab.
- `LabWorkspace.tsx` and `ToolSidebar.tsx`: shared workspace, responsive ordering, and tools.
  Labs pass optional image/dataset and completed-run detail entries into the workspace;
  their actions sit below the controls and open fixed right-side overlays without
  changing workspace height or unmounting controls. `InfoDetails.tsx` reuses
  `DetailsDrawer.tsx` for these actions and contextual explanations. Escape, outside click, and close actions dismiss the popover and return
  focus to its trigger. Small screens use the same overlay at full width.
  `RunMetadata.tsx` renders settings and measurements in full-width label/value
  tables, formats visible timings with units, and collapses provenance/notes and
  raw JSON. The raw view retains every original response field. Labs 5–7 pass
  previous-result state; Lab 7 filters only the compact parameter view by the
  completed method. Specialized Lab 1 and Lab 3 summaries remain separate.
- `LabButton.tsx`, `Fields.tsx`, and `LabFeedback.tsx`: controls and feedback states.
- `SourceActions.tsx` and `SamplePicker.tsx`: upload control and configurable dropdown with dismissal and focus restoration.
- `ImagePanel.tsx`: fit-to-panel viewer, optional pixel/crop overlays, metadata, and metadata help. `ImageMetadata.tsx` renders semantic property tables with columns for available source/result images, one shared explanation, and optional changed-value highlighting. On narrow screens, each property stacks its image values within the row. Lab 4 and Lab 7 group input/output tables; Lab 3 retains uploaded-source and working-original metadata separately. Lab 1 collapses upload/handling notes and identifies retained previous results. Lab 1 retains a compatibility re-export; Lab 2's EdgeFigure adapter supplies edge-specific captions.
- `LabGuide.tsx`: Learning Canvas adapter for Labs 2–7, retaining settings help,
  Python examples, and reproducibility notes in the shared reading drawer. `LabUI.css` owns common visual rules.
- `LearningCanvas.tsx`: annotated figure/caption with an optional nonmodal
  “How it works” reading panel below each lab experiment. Static diagrams and
  concise captions live in each lab’s `LearningFigure.tsx` and
  `learningContent.ts`; Labs 2–7 reuse small SVG primitives from
  `ConceptDiagram.tsx`. Examples are explicitly illustrative, independent of
  uploaded images and API results. Selecting another tool/method updates the
  canvas and closes its previous reading panel. Settings help opens the same
  reading drawer; header navigation focuses the visible canvas.
  The reading action sits with the caption. `DetailsDrawer.tsx` supplies the
  shared nonmodal popover for learning content, image details/upload limits,
  and run details. Only one drawer opens at a time; none changes workspace
  height. Run details use readable labels with optional raw JSON. Lab 1's
  pixel-selection hint sits below the image, updates after pointer or
  coordinate-field selection, and resets when a new source is accepted. Crop
  rectangles support pointer/touch dragging and arrow keys (Shift for ten-pixel
  steps), using the contained-image scale and clamped original-image coordinates.
  Moving the rectangle updates X/Y together through the existing selection state;
  processing still requires Apply crop.
- `Histogram.tsx` and `Histogram.css`: 256-bin brightness charts with an explicitly shared count scale.

Changes to shared components affect every lab that consumes them. Local styles
cover specialized results such as pixel zoom, edge information, PCA galleries,
and detection/segmentation outputs. Hooks and settings remain independent:
sharing UI does not share experiment state or algorithms.

On wider screens, tools occupy the left sidebar, image comparisons the center, and settings the right. Smaller layouts place settings before image comparisons; mobile tools wrap into two columns. Numerical controls provide keyboard alternatives to clicking pixels. Original-image overlays preview the selected pixel or valid crop region, using the same contained image coordinates as pointer selection.

Lab 1 retains separate settings for each operation. Editing settings cancels superseded processing while retaining the last completed result, labeled as previous output with its original operation and parameters. Switching tools aborts pending processing and clears results, errors, and accumulated rotation while preserving the source image and each tool’s saved settings. A new source clears results and initializes settings. Resize controls display the requested pixel count and validate the 4096px-per-side/four-million-pixel output limits before an API request; backend validation remains authoritative. Result summaries describe the actual returned changes; previews explicitly fit images to their panels and do not imply a shared display scale.

Keep brief prediction prompts near controls. Put deeper theory, Python examples, reflection prompts, and preprocessing explanations in optional learning content (Lab 1's reading panel or the other labs' collapsed guides). No account, progress gate, or scoring is required.

## Verification and Remaining Scope

`backend/tests/test_lab1.py` through `test_lab7.py` use standard-library unittest
and FastAPI TestClient to exercise the lab APIs and processing. Tests cover
real image values and outputs where applicable, PCA fitting, model readiness,
and processing/validation failures. Optional models, datasets, and SURF require
their documented setup for corresponding execution checks. Recorded browser
checks have exercised the implemented workflows and responsive behavior
locally; no permanent frontend browser-test runner is configured.

Labs 1–5 and 7 are implemented; production hosting and deployment resource
limits have not been validated. Lab 6 custom bottle training and validation completed locally;
the approved local training workflow and pretrained Lab 6 inference are
implemented. See `LAB_REQUIREMENTS.md` for their obligations. Dated files under
`docs/superpowers/` and `docs/audits/` record plans/reviews at that time; current
architecture and completion status are maintained here and in the requirements.

## Lab 4 feature comparison

`/api/labs/4/capabilities`, `/sample`, `/load`, and `/experiment` expose runtime
availability, deterministic image pairs, bounded upload validation, and feature
comparison. `services/lab4.py` converts both inputs to grayscale and applies
SURF, SIFT, and ORB with a shared feature budget. Strongest-response keypoints
are retained before describing; matching uses L2 for SURF/SIFT and Hamming for
ORB, with two-neighbor ratio filtering. No geometric accuracy is implied.

Per-method failures remain explicit and do not fabricate results. Measured
detection/description and matching times exclude transport and rendering.
`labs/lab4/useFeatureExperiment.ts` owns pair state, cancellation, settings, and
results, reusing shared image transport and lab UI. Two upload buttons reuse
`ImageUploadButton`; all earlier labs continue through `SourceActions`.
See [SURF setup](SURF_SETUP.md) for the platform-specific custom build.

## Activity-aligned information density

Lab 1 keeps dimensions, array shape, and channels visible for each image, with
one shared representation explanation. Data type and engine information remain
available in explanations/run details. Labs 2–3 put generic image properties in
collapsed details; Lab 3 uses the completed working original for shared metadata
so grayscale/color mode is represented correctly. Histograms remain visible,
with one explanation of axes, shared scale, and measured brightness channel.
Numerical edge/contrast statistics remain in run measurements and downloads.
Lab 4 keeps keypoint counts, matches, timings, and size/orientation guidance
visible, while generic image and descriptor properties are optional details.
These presentation choices preserve the original activity outputs and
measurements without repeating generic metadata beneath every comparison.

## Lab 5 dataset-driven PCA

This describes the retained local fitting implementation; the current demo UI
uses recorded outputs as documented below.

`GET /api/labs/5/dataset` reads the local LFW subset; it never downloads from a
request. `scripts/prepare_lfw.py` explicitly prepares ignored `.cache/lfw` data.
`POST /api/labs/5/experiment` validates typed component settings and dispatches
fresh training-only PCA and balanced RBF SVC fitting through the existing
threadpool. A process-local nonblocking lock returns 409 for overlapping fits;
threadpoolctl bounds numerical computation to two threads. This adds no queue,
model persistence, or long-running training service.

The fixed source split is unstratified, test_size=.2, seed42. Randomized whitened
PCA (seed42) supplies recognition coordinates and eigenfaces; a separate full
training-only PCA supplies the cumulative spectrum and exact 90% threshold.
Results include all held-out labels/predictions and indices, classification
metrics, first12/final3 components, bounded face galleries, fresh-run provenance,
and timings. `labs/lab5/` owns state, JSON API transport, content, variance SVG,
and galleries; shell/controls/viewers remain shared. The API client allows up to
120 seconds and preserves previous completed results with their settings when
drafts change or a rerun fails. Empty, busy, and error presentations are mutually
exclusive before a first result. The variance chart reserves space for all axis
labels without an incidental scroll region. See `LAB5_SETUP.md` for setup and limitations.

## Experiment recovery conventions

Labs 2–4 validate the full draft before sending processing settings. Field-specific
errors reveal the comparison controls, focus the invalid numeric field, and
associate the message using aria-invalid/aria-describedby. Server validation
remains authoritative. Hidden manual linear values are ignored during stretching.
Labs 3–4 retain completed results through edits, baseline reset, and failed
reruns; new source requests clear them. Lab 4 disables settings/reset during
processing to avoid silent cancellation. Lab 1 reports explicit cancellation.
Lab 5 distinguishes dataset/network failures from its two-minute client timeout,
explains that a server fit may continue after disconnection, preserves prior
results, and retains the server's concurrent-fit message.

## Responsive lab presentation and guidance

The shared workspace moves its tool navigation above settings/results below
1360px, preserving comparison width instead of a narrow tablet sidebar. Image
figures use proportional stages and equal heading space; results include a
return-to-settings link on stacked layouts. Shared fields support concise hints,
linked errors, and 16px input text. Lab-specific navigation headings distinguish
experiments, settings, methods, and result exploration.

Lab 3 groups CLAHE/linear settings in expandable controls, automatically opening
the relevant group on selection or validation failure. All methods and four
histograms remain available, with completion feedback after the full result set.
Lab 5 uses compact galleries (two columns on phones), meaningful image
descriptions, a responsive variance plot with HTML axis labels, an expandable
dataset summary after a run, and local classification-metric definitions. These
changes do not alter computation, activity requirements, or returned measurements.


## Lab 5 precomputed demonstration

On `feat/lab5-demo`, `/labs/5` uses `usePcaDemo` and static recorded runs. The old
`/labs/5/demo` preview route redirects to the canonical page. There is no live-fit
button or backend call from this Lab 5 UI. The full live application source is
preserved in the GitHub `full-local` branch at `729d587`; local model/dataset
caches are still separate ignored resources, not part of that Git backup.

The page fetches only same-origin assets under `/demos/lab5/`, checks manifest/run
SHA-256 and provenance, and caches validated runs. Superseded loads are aborted.
Recorded 25/75/150-component results come from the actual existing service through
`export_lab5_demo.py`; metrics, galleries, split information and recorded compute
timings remain real outputs. All four views and the existing Learning Canvas are
retained. Backend fitting/export code remains for local regeneration. This UI
change does not yet create a lightweight deployment backend or alter other labs.
See [LAB5_SETUP.md](LAB5_SETUP.md) for branch recovery and regeneration.

## Recorded detection and semantic views

On `feat/lab5-demo`, Lab 6 uses `useRecordedRuns` with the existing workspace,
image metadata, dataset/training views and downloads. It provides 12 real saved
YOLO runs (two samples × two models × three thresholds); uploads/camera are
available in the preserved `full-local` source instead. Training/dataset/test
information and the sanitized log are static snapshots. No Lab 6 API is called.

Lab 7's `SemanticDemo` provides six recorded DeepLab runs (two samples × three
overlay opacities). The classical hook remains mounted to preserve input state;
it clears/aborts pending work on method switches and never executes semantic
inference. Classical threshold/region/edge methods still use the API. Semantic
source/results are separate from the classical upload, preventing saved results
from being presented as predictions for arbitrary input.

Shared `api/recorded.ts` and `hooks/useRecordedRuns.ts` verify manifest/result
hashes and input/parameter/source identity. Loaded inputs/results update together;
superseded loads are aborted, prior pairs remain correctly labeled, and missing
or corrupt files expose reload. Lab 5 reuses the same static JSON reader.
`export_heavy_demos.py` executes actual existing services on 480px samples,
retains credits/provenance and never trains or fabricates results. Static bundles
are frontend assets; backend deployment slimming/resource testing is separate.

## Lab 6 inference and offline training

The live camera/upload UI described in this section belongs to `full-local`.
The current branch retains the services/export tools but uses recorded UI above.

`/labs/6` uses the shared lab shell, controls, feedback, uploads and image viewers.
Dedicated state and camera lifecycle live in `labs/lab6/`; the camera sends
sequential bounded JPEG frames and releases tracks on stop, hidden document,
unmount or permission failure. Image and camera requests share the same typed
inference endpoint; no server camera capture or stream queue is introduced.

`GET /api/labs/6/status` exposes model readiness and validated local dataset/run
artifacts. `/sample`, `/load`, and `/experiment` reuse common image transport.
Processing lazily loads a trusted local YOLO11n/custom model, uses CPU and bounded
inference settings, and returns annotated images, boxes, confidence, timings and
weight hashes. A process-local lock prevents simultaneous use of the predictor;
separate workers have separate models/locks. No uploads or results are persisted.

The approved training model is an explicit local CLI outside FastAPI requests.
Setup prepares official weights/sample. Dataset validation records classes,
split counts, exact duplicate checks, and content hashes. Training retains the
actual run outputs/logs, parameters, seed and dataset/weight provenance, validates
on the named split, then publishes custom weights and completed metadata. The UI
never enables custom inference solely from a pending/failed/incomplete artifact.
An allowlisted log route serves only the local training log. No web training,
checkpoint upload, or arbitrary server-path request is supported.

Ultralytics has an optional pinned dependency closure installed with --no-deps
so its opencv-python requirement does not overwrite the existing cv2 provider.
The SURF build now includes highgui/videoio symbols required for import, while
native GUI/FFmpeg capture remain disabled. See `LAB6_SETUP.md` for reproducible
setup and known limits. The user approved all 38 Open Images bottle images on 2026-11-05. The local CPU
100-epoch run completed with 30 training and 8 validation images; custom weight
hashes and API inference were verified. See `LAB6_DATASET_REVIEW.md`.

`prepare_bottle_test.py` prepares 18 separate test photos with attribution,
photographer/content separation checks and review HTML. `evaluate_yolo.py`
verifies original train/val and checkpoint hashes, calls only held-out validation,
and atomically publishes `evaluation.json` without replacing `training.json` or
weights. Test metrics and annotation-review state are exposed only when their
training/checkpoint hashes match the current model. Pydantic filters evaluation
settings to known scalar fields. The original validation results remain intact.
See `LAB6_TEST_EVALUATION.md`; all 18 test labels were reviewed and approved by the user.



The Lab 6 detection view has keyboard-accessible Image/Camera tabs in the middle
experiment column. Image uploads/sample selection sit beside the tabs. Camera
mode shows a live feed and detected-frame output. In the right settings rail,
Start/Stop camera replaces Detect objects; Cancel is available during permission.
`CameraCapture` owns the stream and exposes typed start/stop methods to its parent,
while reporting idle/pending/running state for the sidebar action.
Model/confidence settings remain in that rail and are locked while permission
is pending or capture is active. Switching input modes clears stale results while
preserving the selected image. Camera unmount, hiding the document, cancellation,
and late permission responses release tracks and invalidate the frame session.
A late frame response cannot stop a newer image request. Dataset/training
instructions use a bounded reading width.

Lab 6 Dataset and Training views omit the settings rail through the shared
workspace’s optional-controls layout; Detect keeps its existing controls.
Section-specific actions open the shared metadata drawers. Completed runs lead
with the model summary and a validation/test metric comparison; the full epoch history is
retained in the Training JSON download, with readable provenance in Training
details. The loss chart uses numeric axes, responsive plotting, and solid/dashed/
dotted series with a text legend and screen-reader summary. Dataset validation
verifies optional review decisions against exact image/label byte hashes before
publishing a reviewed-photo count. Internal image-hash split records identify
whether the prepared bottle sample belongs to the displayed training dataset;
these records are omitted from the status response. Status loading/failure is
separate from inference failure; refresh failures retain previous artifacts.

Public metadata is filtered separately from local training artifacts.
`services/public_metadata.py` allowlists reproducible training settings, removes
run/dataset directory fields, and replaces internal failure diagnostics with
public guidance. Lab 6 log downloads omit lines containing absolute filesystem
paths or credential assignments (after stripping terminal colors); the original
log remains local. Shared image-processing errors and Lab 5 dataset errors use
the same message guard. Numeric metrics, history, model/dataset hashes, and
intentional public dataset labels remain available.

## Lab 7 segmentation

Classical methods remain live. Semantic execution below describes the retained
local service; the current semantic UI uses recorded results as documented above.

`labs/lab7/` reuses the shared shell, prediction prompts, fields, sample/upload
controls and image viewers. Its own state/transport controls four method families.
The input viewer supports original-coordinate seed selection plus keyboard x/y
fields. The input and first output share a comparison row; secondary outputs
remain below it. Previous outputs remain labeled with their generating settings
when fields change. Switching method families or accepting a new source clears
outputs; aborted responses cannot overwrite current state.

`/api/labs/7/status`, `/sample`, `/load`, and `/experiment` use a typed settings
schema and common bounded upload/threadpool helpers. `services/lab7.py` owns
Otsu/adaptive masks, fixed-range4-connected flood growing, marker watershed, and
edge-to-enclosed-region masks. Region filtering uses a label lookup rather than
one full-image scan per component. Classical intermediate/result images remain
explicitly distinct from learned classes.

`lab7_semantic.py` lazily loads trusted official DeepLabV3 MobileNetV3 weights
prepared through an explicit script, using the existing optional Torchvision
runtime. A process-local lock bounds semantic concurrency. RGB normalization,
longest-side520 working resize, nearest label restoration, class IDs, runtime
versions and checkpoint hash are recorded. Outputs include aligned class map,
overlay, legend and raw ID PNG. No trained-model persistence or new job system
is added. No IoU is reported without compatible annotated ground truth. See
`LAB7_SETUP.md` for the intentional resize adaptation and source details.
