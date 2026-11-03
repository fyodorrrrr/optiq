# Optiq Architecture

## Current Boundaries

React/TypeScript renders the homepage and Labs 1–5 at `/labs/1`, `/labs/2`, `/labs/3`, `/labs/4`, and `/labs/5`; React Router handles navigation. Lab 6 is at `/labs/6` with pretrained detection and pending custom training. FastAPI provides `/api/health` and per-lab endpoints. Vite proxies `/api` to port 8000 in development. Production hosting is undecided and must support API forwarding and SPA route fallback.

## Lab 1 Request Flow

1. `frontend/src/labs/lab1/useLab1.ts` requests a generated sample or submits an uploaded file. It retains the original file and decoded metadata in page memory.
2. `api.ts` sends multipart uploads and JSON operation settings. Each experiment resends the original, keeping API processing stateless without an upload store or session lifecycle.
3. `backend/routers/lab1.py` reads bounded file content, parses typed settings, and dispatches CPU processing to a thread pool.
4. `backend/schemas/lab1.py` defines a discriminated settings union, numeric bounds, and response schemas. Unexpected operation fields are rejected.
5. `backend/services/images.py` inspects format/dimensions with Pillow before OpenCV decoding. It normalizes supported inputs, encodes lossless PNGs, and reports actual array metadata.
6. `backend/services/lab1.py` runs the selected operation on a copy and returns the image, parameters, OpenCV version, and pixel comparisons where applicable.
7. React displays the returned PNG and metadata. Abort controllers prevent responses from superseded inputs or operations from replacing current state. Downloads use the returned PNG directly.

Stateless requests trade repeated upload/decoding work for a simpler lifecycle. This is suitable for bounded Lab 1 images; expensive model workflows will need their own design.

## Lab 2 Separation and Processing

Lab-specific state, API clients, settings, algorithms, and learning content stay under their own modules. Both labs consume the common UI below. `frontend/src/api/images.ts` provides common image transport/types for Lab 2 and future modules; Lab 1 retains its existing API client and per-tool state behavior.

Both backend routers share the image schema in `schemas/images.py`, upload/thread-pool helpers in `routers/image_io.py`, and validation/encoding in `services/images.py`. `schemas/lab1.py` re-exports the common Frame contract for compatibility. Shared helpers preserve existing Lab 1 behavior.

Lab 2 has `/api/labs/2/sample`, `/load`, and `/experiment` endpoints. Its service converts to grayscale, applies one Gaussian blur, then feeds that same array to Sobel x/y, combined magnitude, and Canny. Responses include all comparison and intermediate frames, raw ranges, edge-pixel count, display-scaling description, settings, and OpenCV version.

Defaults match the activity: Gaussian 3×3, Sobel size 3, Canny 100/200. Canny retains aperture 3 and `L2gradient=False`. Gaussian sizes are odd 1–9; Sobel sizes are 3/5/7; thresholds are whole numbers with `0 ≤ lower < upper ≤ 2048`. Limits are engineering choices for exploration. Sobel magnitude/absolute derivatives are display-scaled independently to 0–255 with zero-safe normalization; signed gradient extrema remain available numerically. Edge-pixel percentage describes output density, not accuracy.

Generated shapes and noisy shapes replace the absent source image, with noise seed 42 and standard deviation 18. Each run resends the original input; changed settings abort pending requests while retaining completed output. The status message identifies previous results when draft settings differ; the run-settings disclosure records the parameters that produced the displayed output. Successful runs replace the output; changing the source clears it. Sidebar sections focus controls without hiding the required three-way comparison.

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
- OpenCV color arrays are BGR; encoded PNGs display correctly as RGB in the browser. Grayscale arrays retain a two-dimensional shape and one channel.
- Transparency is composited onto white. EXIF orientation is not applied; coordinates follow decoded array orientation. No automatic downscaling.
- Coordinates are zero-based `(x, y)`; array indexing is `[y, x]`. Crop uses exclusive end bounds derived from left/top/width/height. Rotation accepts `quarter_turns` 0–3 (default 1); the client advances one clockwise step per successful run and applies the total angle to the original. Failed or superseded runs do not advance it. Clearing results or accepting a new image resets the angle.
- Color edits accept RGB values and reverse them for BGR assignment; grayscale edits accept one intensity. Pixel zoom uses nearest-neighbor display and edge replication, leaving the real image unchanged.
- Images are not retained after requests. Framework-managed temporary upload spooling may occur; no application upload store or persistent filesystem is used.

## Interface and Learning

`frontend/src/components/lab/` is the canonical lab UI layer:

- `LabPage.tsx`: page shell, navigation, introduction/actions, and footer.
- `LabWorkspace.tsx` and `ToolSidebar.tsx`: shared workspace, responsive ordering, and tools.
- `LabButton.tsx`, `Fields.tsx`, and `LabFeedback.tsx`: controls and feedback states.
- `SourceActions.tsx` and `SamplePicker.tsx`: upload control and configurable dropdown with dismissal and focus restoration.
- `ImagePanel.tsx`: fit-to-panel viewer, optional pixel/crop overlays, metadata, and metadata help. Lab 1 retains a compatibility re-export; Lab 2's EdgeFigure adapter supplies edge-specific captions.
- `LabGuide.tsx`: optional learning disclosure. `LabUI.css` owns common visual rules.
- `Histogram.tsx` and `Histogram.css`: 256-bin brightness charts with an explicitly shared count scale.

Changes to these components affect both labs. Local styles cover only specialized results such as pixel zoom or edge information. Hooks and settings remain independent: sharing UI does not share experiment state or algorithms.

On wider screens, tools occupy the left sidebar, image comparisons the center, and settings the right. Smaller layouts place settings before image comparisons; mobile tools wrap into two columns. Numerical controls provide keyboard alternatives to clicking pixels. Original-image overlays preview the selected pixel or valid crop region, using the same contained image coordinates as pointer selection.

Lab 1 retains separate settings for each operation. Editing settings or switching tools cancels superseded processing while retaining the last completed result, labeled as previous output with its original operation and parameters. A new source clears results and initializes settings. Result summaries describe the actual returned changes; previews explicitly fit images to their panels and do not imply a shared display scale.

Keep brief prediction prompts near controls. Put deeper theory, Python examples, reflection prompts, and preprocessing explanations in optional collapsed learning content. No account, progress gate, or scoring is required.

## Verification and Remaining Scope

`backend/tests/test_lab1.py`, `test_lab2.py`, and `test_lab3.py` use standard-library unittest and FastAPI TestClient against real PNG/JPEG inputs and actual OpenCV outputs. Browser checks have exercised all tools and responsive behavior locally; no permanent frontend browser-test runner is configured.

Labs 1–5 are implemented; production hosting and deployment resource limits have not been validated. Lab 6 custom data/training and Lab 7 remain pending; the approved local training workflow and pretrained Lab 6 inference are implemented. See `LAB_REQUIREMENTS.md` for their obligations.

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
drafts change or a rerun fails. See `LAB5_SETUP.md` for setup and limitations.

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


## Lab 6 inference and offline training

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
setup and known limits. The actual custom dataset/training remains pending.
