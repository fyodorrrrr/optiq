# Optiq Architecture

## Current Boundaries

React/TypeScript renders the homepage and Lab 1 at `/labs/1`; React Router handles navigation. FastAPI provides `/api/health` and Lab 1 endpoints. Vite proxies `/api` to port 8000 in development. Production hosting is undecided and must support API forwarding and SPA route fallback.

## Lab 1 Request Flow

1. `frontend/src/labs/lab1/useLab1.ts` requests a generated sample or submits an uploaded file. It retains the original file and decoded metadata in page memory.
2. `api.ts` sends multipart uploads and JSON operation settings. Each experiment resends the original, keeping API processing stateless without an upload store or session lifecycle.
3. `backend/routers/lab1.py` reads bounded file content, parses typed settings, and dispatches CPU processing to a thread pool.
4. `backend/schemas/lab1.py` defines a discriminated settings union, numeric bounds, and response schemas. Unexpected operation fields are rejected.
5. `backend/services/images.py` inspects format/dimensions with Pillow before OpenCV decoding. It normalizes supported inputs, encodes lossless PNGs, and reports actual array metadata.
6. `backend/services/lab1.py` runs the selected operation on a copy and returns the image, parameters, OpenCV version, and pixel comparisons where applicable.
7. React displays the returned PNG and metadata. Abort controllers prevent responses from superseded inputs or operations from replacing current state. Downloads use the returned PNG directly.

Stateless requests trade repeated upload/decoding work for a simpler lifecycle. This is suitable for bounded Lab 1 images; expensive model workflows will need their own design.

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
- Coordinates are zero-based `(x, y)`; array indexing is `[y, x]`. Crop uses exclusive end bounds derived from left/top/width/height. Rotation is 90 degrees clockwise.
- Color edits accept RGB values and reverse them for BGR assignment; grayscale edits accept one intensity. Pixel zoom uses nearest-neighbor display and edge replication, leaving the real image unchanged.
- Images are not retained after requests. Framework-managed temporary upload spooling may occur; no application upload store or persistent filesystem is used.

## Interface and Learning

On wider screens, tools occupy the left sidebar, image comparisons the center, and settings the right. Smaller layouts stack content and use a horizontal tool row. Numerical controls provide keyboard alternatives to clicking pixels.

Keep brief prediction prompts near controls. Put deeper theory, Python examples, reflection prompts, and preprocessing explanations in optional collapsed learning content. No account, progress gate, or scoring is required.

## Verification and Remaining Scope

`backend/tests/test_lab1.py` uses standard-library unittest and FastAPI TestClient against real PNG/JPEG inputs and actual OpenCV outputs. Browser checks have exercised all tools and responsive behavior locally; no permanent frontend browser-test runner is configured.

Lab 1 processing is implemented; production hosting and deployment resource limits have not been validated. Labs 2–7, datasets, SURF capability, model training, and inference infrastructure remain separate pending work. See `LAB_REQUIREMENTS.md` for their obligations.
