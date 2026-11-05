# Optiq

Interactive computer vision learning and experimentation platform for Labs 1–7.
Includes a homepage with a pixel character and introduction,
three illustrated **How learning works** cards, a selectable seven-lab map,
and seven laboratory workspaces. On this branch, Lab 5, Lab 6 and Lab 7's
semantic view display real recorded results. Labs 1–4 and Lab 7's classical
methods retain live backend processing. Dataset/training views retain the actual
completed custom bottle model's reviewed artifacts.

The full live application source is preserved in the
[full-local branch](https://github.com/fyodorrrrr/optiq/tree/full-local).
See the per-lab setup docs for recovery and recorded-run regeneration. Local
model/dataset caches remain separate ignored resources.

## Requirements

- Node.js 22.12+ (or another version supported by Vite) and npm
- Python 3.12

## Run Both Servers

After completing the backend and frontend dependency setup below, install the
root development runner once from the repository root:

```bash
npm ci
```

Then start both servers in one terminal:

```bash
npm run dev
```

Frontend logs are labeled `[frontend]` and backend logs `[backend]`. Open
http://127.0.0.1:5173. Press **Ctrl+C** to stop both; if either process exits,
the runner stops the other too. Stop any separately running copies first so
ports 5173 and 8000 are available.

The backend command uses its existing `.venv` directly, so activation is not
required for the root shortcut. Root npm dependencies only coordinate processes;
frontend dependencies and Python dependencies remain in their own folders.

To start just one service from the repository root, use `npm run dev:frontend`
or `npm run dev:backend`. The individual commands below also remain available.

## Backend

From the repository root:

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-lock.txt
fastapi dev main.py --host 127.0.0.1
```

For subsequent sessions, activate the existing environment and run the server.
The health endpoint is http://127.0.0.1:8000/api/health and API documentation is
http://127.0.0.1:8000/docs. Visiting the backend root returns 404 by design.

`requirements.txt` lists direct dependencies; `requirements-lock.txt` records the
installed versions. The OpenCV package does not enable SURF automatically.

## Frontend

In a second terminal, from the repository root:

```bash
cd frontend
npm ci
npm run dev
```

Visit http://127.0.0.1:5173 and select **Explore the labs** to view the map.
Selecting a node displays its learning goal and availability. Lab 1's **Open
lab** link opens `/labs/1`; use **Back to labs** to return. The previous
`/previews/lab-1.html` URL redirects to the working module.

Lab 1 uses FastAPI/OpenCV for loading, metadata, pixel inspection/editing,
grayscale conversion, cropping, resizing, and clockwise 90-degree rotation.
Choose a color/grayscale sample or upload an 8-bit PNG/JPEG. Every operation
starts from the original image; the result includes actual array metadata and
can be downloaded as a PNG. A Learning Canvas below the experiment shows an
annotated, illustrative example for the selected operation. Its **How it works**
action opens deeper explanations and Python examples in a side drawer.
**Image details** opens upload limits and image-handling notes; **Run details**
shows the settings behind the displayed result, with optional raw JSON.
The pixel-selection hint appears inside the original image and updates when
coordinates are selected by clicking or entered through the fields.

Rotation advances one clockwise quarter-turn per successful click:
90° → 180° → 270° → 0°. The current angle is shown, and the accumulated angle
is applied to the original pixels. Clearing the result or loading a new image
resets it. Other operations remain independent experiments.

Uploads are limited to 5 MiB, 4096 pixels per side, and 4 million pixels total.
Transparency is composited onto white; EXIF orientation is not applied. Images
are not retained after processing. Both the frontend and backend must be running.

Lab 2 at `/labs/2` compares a grayscale original, combined Sobel magnitude, and
Canny edges. Start with Gaussian 3×3, Sobel size 3, and Canny thresholds 100/200,
then adjust settings and run both detectors again. Intermediate blur/gradient
views and explanations are optional. Sobel previews are display-scaled to 0–255;
raw ranges and exact settings are included with each run. Download either edge
map as PNG. The shapes and seeded noisy samples are generated replacements for
the activity's missing `input.jpg`.

Lab 3 at `/labs/3` compares global histogram equalization, CLAHE, and linear
contrast adjustment/stretching, with 256-bin brightness histograms on one shared
count scale. Grayscale mode processes intensity; color mode modifies Y in YUV
before reconstructing BGR. Histograms measure the final displayed images.
Manual linear adjustment uses `clip(rint(alpha * intensity + beta), 0, 255)`;
full-range stretching maps the observed range to 0–255 and leaves a constant
channel unchanged. Use the low-contrast, uneven-lighting, or color sample; the
uneven-lighting sample uses noise seed 42. PNG results and histogram CSV are
downloadable. The shared shell, inputs, viewers, and histogram component live in
`frontend/src/components/lab/`; Lab 3 state and processing stay in its own module.

To check the API directly, open http://127.0.0.1:8000/api/health or run:

```bash
curl http://127.0.0.1:8000/api/health
```

A running backend returns `{"status":"ok","message":"Optiq backend is connected"}`.
The homepage does not include a connection-check control.

Vite forwards `/api` to port 8000 during development. Production uses a Vercel
static frontend and an Oracle Linux API behind Caddy. Set `VITE_API_BASE_URL` to
the API's HTTPS origin before building, and configure exact backend CORS origins.
`frontend/vercel.json` supplies SPA fallback for direct lab URLs. The API exposes
`/api/ready` (200/503) separately from lightweight `/api/health`.

See [the deployment runbook](docs/DEPLOYMENT.md) for Linux dependencies, reviewed
model transfer, service/HTTPS/monitoring templates, smoke checks and rollback.
These files prepare deployment; public hosting has not yet been verified.

## Checks

```bash
cd frontend
npm run lint
npm run build
```

From `backend/` with its environment installed:

```bash
.venv/bin/python -m unittest discover -s tests -v
```

The unittest suite checks real image values, shapes, channel order, independent
operations, grayscale/alpha/JPEG handling, and invalid inputs/resource limits.
Lab 2 tests additionally cover exact baseline preprocessing/Canny output,
directional derivatives, scaled magnitude, uniform images, seeded noise,
parameter effects, and invalid kernels/thresholds.
Lab 3 tests cover exact histogram counts, global equalization, CLAHE, negative
offset clipping, full-range stretching, constant images, final color-output
histograms, deterministic samples, and parameter validation.

The original activity documents in `activities/` are currently excluded from Git.

The homepage separates its catalogue (`frontend/src/data/labs.ts`), map selection
(`frontend/src/components/LabMap.tsx`), selected-lab previews
(`frontend/src/components/LabPreview.tsx`), and pixel character
(`frontend/src/components/HeroPixel.tsx`). `BackendStatus.tsx` remains in the
source tree but is not rendered by the current homepage. Visual conventions
are recorded in [DESIGN_FOUNDATION.md](docs/DESIGN_FOUNDATION.md).

For Lab 1, read `frontend/src/labs/lab1/Lab1.tsx`, `useLab1.ts`, and `api.ts`,
then `backend/routers/lab1.py`, `backend/schemas/lab1.py`, and
`backend/services/lab1.py`. Shared image validation/encoding is in
`backend/services/images.py`.

All seven labs use the common UI in `frontend/src/components/lab/`. Edit `LabPage.tsx`
for the shell/navigation, `ToolSidebar.tsx` for tools, `SourceActions.tsx` and
`SamplePicker.tsx` for inputs, `ImagePanel.tsx` for viewers, `Fields.tsx` for
controls, and `LabUI.css` for their appearance. Shared changes affect each lab
that consumes the component. Lab 1 additionally uses `LearningCanvas.tsx` and
`DetailsDrawer.tsx`; the other labs retain the optional `LabGuide.tsx` disclosure.
Lab 1's viewer/sample-picker files are compatibility adapters to this shared layer.

Lab-specific content, settings, result handling, and hooks stay under
`frontend/src/labs/lab1/` through `lab7/`; specialized result styles remain
local. Image-based labs reuse input controls where appropriate; Lab 5 uses a
prepared dataset, and Lab 6 includes a specialized browser-camera workflow.
Backend algorithms also remain per lab. Common image transport lives in
`frontend/src/api/images.ts`; Lab 1 retains its own API client. Common backend
upload helpers and image contracts live in `backend/routers/image_io.py` and
`backend/schemas/images.py`.

Lab 4 at `/labs/4` compares real SURF, SIFT, and ORB using two image inputs,
rich keypoint views, ratio-test matches, descriptor details, and measured timings.
Try rotated/scaled samples, adjust SURF's Hessian threshold, and explore upright
SURF. Each input is limited to one million pixels; the match canvas to two million.
SURF requires a custom OpenCV build: see [SURF setup](docs/SURF_SETUP.md).
Standard wheels leave SURF explicitly unavailable while SIFT and ORB remain usable.

Lab 5 at `/labs/5` runs training-only PCA, eigenface visualization, explained
variance analysis, and held-out RBF SVM recognition on LFW. Prepare the dataset
once with `backend/.venv/bin/python backend/scripts/prepare_lfw.py` from the repo
root. See [Lab 5 setup](docs/LAB5_SETUP.md) for defaults, provenance, and limits.

Lab 6 at `/labs/6` provides YOLO11n image/webcam detection and a local dataset/training/evaluation workflow. See [Lab 6 setup](docs/LAB6_SETUP.md) for the optional dependencies, model preparation, and training commands. Custom training is not complete until a real annotated dataset is provided and trained.

Lab 7 at `/labs/7` compares Otsu/adaptive thresholding, seed growing/watershed, edge-guided filled regions, and pretrained semantic pixel classes. Prepare the optional semantic weights with `backend/.venv/bin/python backend/scripts/prepare_segmentation.py`. See [Lab 7 setup](docs/LAB7_SETUP.md). It does not require the pending Lab 6 custom dataset.
