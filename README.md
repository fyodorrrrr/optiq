# Optiq

Interactive computer vision learning and experimentation platform for Labs 1–7.
Includes a homepage with a full-screen introduction, a selectable seven-lab map,
and a working Python/OpenCV Lab 1 workspace. Labs 2–7 are planned.

## Requirements

- Node.js 22.12+ (or another version supported by Vite) and npm
- Python 3.12

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
can be downloaded as a PNG. Explanations and Python examples are available in
the optional **Understand this experiment** section.

Uploads are limited to 5 MiB, 4096 pixels per side, and 4 million pixels total.
Transparency is composited onto white; EXIF orientation is not applied. Images
are not retained after processing. Both the frontend and backend must be running.

For the API check, expand **Development connection check** in the footer and
click **Check backend connection**.
With the backend running, the status reads **Optiq backend is connected**.
If it is unavailable, the page displays an error and allows another attempt.

Vite forwards `/api` requests to port 8000 during development. Production hosting
must also route `/api` to FastAPI; the development proxy is not included in the build.
Production hosting must serve `frontend/dist` and fall back to `index.html` for
application routes such as `/labs/1`, while forwarding `/api` to the backend.

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

The original activity documents in `activities/` are currently excluded from Git.

The homepage separates its catalogue (`frontend/src/data/labs.ts`), map selection
(`frontend/src/components/LabMap.tsx`), and backend connection utility
(`frontend/src/components/BackendStatus.tsx`). Visual conventions are recorded in
`docs/DESIGN_FOUNDATION.md`.

For Lab 1, read `frontend/src/labs/lab1/Lab1.tsx`, `useLab1.ts`, and `api.ts`,
then `backend/routers/lab1.py`, `backend/schemas/lab1.py`, and
`backend/services/lab1.py`. Shared image validation/encoding is in
`backend/services/images.py`.
