# Optiq

Interactive computer vision learning and experimentation platform for Labs 1–7.
Currently includes the React/TypeScript frontend foundation and a FastAPI health endpoint.
The laboratory modules are not implemented yet.

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

Visit http://127.0.0.1:5173 and click **Check backend connection**.
With the backend running, the status reads **Optiq backend is connected**.
If it is unavailable, the page displays an error and allows another attempt.

Vite forwards `/api` requests to port 8000 during development. Production hosting
must also route `/api` to FastAPI; the development proxy is not included in the build.

## Checks

```bash
cd frontend
npm run lint
npm run build
```

The original activity documents in `activities/` are currently excluded from Git.
