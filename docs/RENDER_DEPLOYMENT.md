# Vercel frontend + Render Free API

This branch supports a lightweight Render Free profile. It has been tested locally,
not deployed to a Render account. The Docker image's Linux SURF build must still
complete and the service must be exercised on actual free-tier hardware.

## What runs where

| Area | Execution |
| --- | --- |
| Labs 1–4 | Real, bounded OpenCV operations on Render |
| Lab 5 | Real recorded PCA/SVM outputs, served statically by Vercel |
| Lab 6 | Real recorded detections/training artifacts, served statically by Vercel |
| Lab 7 classical methods | Real OpenCV processing on Render |
| Lab 7 semantic | Real recorded DeepLab outputs, served statically by Vercel |

`OPTIQ_PROFILE=render-free` mounts only the classical APIs and blocks semantic
inference at the service boundary. It imports no scikit-learn, SciPy, Torch,
torchvision or Ultralytics. Readiness verifies actual SURF/SIFT/ORB and writable
temporary storage, with no model/dataset requirements or request-time downloads.
The natural-scene sample is a committed 480px PNG with attribution in
`backend/assets/SCENE_CREDIT.md`; no persistent disk is required.

`full` is the default profile for local development and retains the original
algorithms, endpoints and limits. GitHub branch `full-local` at 729d587 preserves
the complete original live UI. Local model/data caches are still separate from Git.

To try the same profile locally after dependencies are prepared:

```sh
OPTIQ_PROFILE=render-free VITE_API_PROFILE=render-free npm run dev
```

Keep `VITE_API_BASE_URL` empty for the local development proxy. Restart servers
after changing profiles; backend limits are frozen at process startup.

## 1. Put this branch on GitHub

Commit and push `feat/lab5-demo` before creating the service. This branch contains
both the recorded frontend and Render profile; `main` and `full-local` retain
the earlier full application. Do not deploy those branches with these instructions.
Never commit `.venv`, `.env`, `.cache`, original model checkpoints or credentials.

## 2. Create the free backend

Use `render.yaml` as a Blueprint, or create a **Web Service** manually:

- Repository: this repository; branch: **feat/lab5-demo**.
- Runtime: **Docker**. Dockerfile: **deploy/render/Dockerfile**.
- Build context: repository root (`.`). Keep the Root Directory empty.
- Compute plan: **Free**. One instance. No disk, database or paid service is needed.
- Health check: **/api/ready**.
- Docker command: leave empty; the image starts Uvicorn using Render's `$PORT`.
- Automatic deployment is off in the Blueprint; trigger deploys deliberately.

Set these environment values (the Blueprint supplies all but the exact origin):

```dotenv
OPTIQ_PROFILE=render-free
OPTIQ_ENV=production
OPTIQ_ALLOWED_ORIGINS=https://your-project.vercel.app
OPTIQ_MAX_CONCURRENT_JOBS=1
OPTIQ_RATE_LIMIT_PER_MINUTE=240
OPTIQ_RATE_LIMIT_BURST=24
OPTIQ_RATE_LIMIT_MAX_CLIENTS=4096
```

Origins have no trailing slash or path. Add another exact origin only if you
intend to allow that frontend; no wildcard CORS. CORS is browser policy, not
user authentication. Do not put tokens in frontend environment variables.

The multi-stage Docker build installs the minimal pinned Linux dependencies and
compiles a minimal SURF-enabled OpenCV wheel with one compilation job. It then
installs that wheel in a nonroot runtime without compilers or model libraries.
The build fails if real feature capabilities/readiness are unavailable; ORB is
never silently substituted for SURF. The expensive compiler layer is separate
from application source so it can be cached for later builds. First compilation
can take substantial time and consume free pipeline minutes. If it fails, inspect
the Render build log before retrying repeatedly. Linux compilation is unverified
locally because this workstation has no Docker daemon.

The application listens on 0.0.0.0:$PORT, one worker, eight admitted
connections/tasks, backlog 32 and one OpenCV thread. Render handles public TLS,
process lifecycle and health checks; do not install/run Oracle's Caddy/systemd
configuration on this service. Oversaturation may return503, including probes;
one protected image job runs at a time. No in-memory quotas are shared across
multiple instances; keep one instance.

## 3. Connect the frontend on Vercel

Use the same **feat/lab5-demo** branch as the Vercel Production Branch. Set:

- Root Directory: **frontend**.
- Framework: **Vite**; install `npm ci`; build `npm run build`; output `dist`.
- Node: a Vite-supported version, 22.12+.
- Environment variables before building:

```dotenv
VITE_API_BASE_URL=https://your-actual-service.onrender.com
VITE_API_PROFILE=render-free
```

Use the exact Render URL shown in its dashboard, not the placeholder above.
Redeploy Vercel after setting/changing these values. The frontend profile must
match the backend profile: it controls resize validation and input-limit help.
The API remains authoritative. No Vercel external API rewrite is needed;
`frontend/vercel.json` provides SPA fallback for direct lab URLs.

If you do not yet have a frontend URL, create the Vercel project to obtain its
stable production URL, configure that exact origin on Render, then set the Render
URL on Vercel and rebuild. No frontend secret is needed.

## Bounds and free-tier behavior

- Each live input and same-size output: **350,000 pixels total**, **1,024px per side**.
  Lab 4's combined match canvas permits **700,000 pixels** and can be up to
  **2,048px wide** because it displays two bounded inputs together.
  Generated samples fit. Uploaded images are rejected, never silently resized.
- PNG/JPEG file limit stays **5 MiB**. Whole requests stay **6 MiB** or **11 MiB**
  for Lab 4's image pair. Staging spills after 1 MiB and is cleaned up.
- Body receipt: 30s; lab HTTP deadline: 110s; browser POST wait: 120s.
- Render-profile metadata GET wait: 90s, accommodating cold-start waiting.
  No automatic retry or background keep-alive pings are added.
- Render Free currently provides 512 MB / 0.1 CPU and sleeps after 15 idle minutes.
  A first visit may take about a minute to wake. Monthly free instance hours,
  bandwidth and build quotas still apply. This is a free demo service, not a
  promise of classroom-scale availability.

The existing IP limiter uses the ASGI transport client. The start script defaults
to **no proxy-header trust**, preventing forged forwarding headers from changing
quotas. On Render this can group clients under a platform proxy IP. Before relying
on distinct per-user-IP quotas, verify the actual provider proxy chain and set
`OPTIQ_TRUSTED_PROXY_IPS` to provider-confirmed proxy CIDRs only. Never use `*`;
the script rejects unrestricted wildcard trust. Do not blindly trust a leftmost
X-Forwarded-For value or assume Oracle's loopback settings apply to Render.
The one-job/connection/image limits continue to protect resources regardless.

The filesystem is disposable. Only temporary uploads are written; no user files
or outputs are retained. The image includes the fixed scene sample, so sleeping
or restarting does not require restoring neural checkpoints or datasets. Logs go
to Render's normal service logs; request-body/access logging is disabled.

## Verification before sharing

Check the public endpoint after build/deploy:

```sh
curl --fail https://your-actual-service.onrender.com/api/health
curl --fail https://your-actual-service.onrender.com/api/ready
backend/.venv/bin/python backend/scripts/smoke_test.py \
  --base-url https://your-actual-service.onrender.com \
  --profile render-free --origin https://your-project.vercel.app --full
```

The smoke test performs real Labs 1–4 and classical Lab 7 computations, including
SURF. It never invokes neural/PCA execution in this profile. Offline local check:
`OPTIQ_PROFILE=render-free backend/.venv/bin/python backend/scripts/verify_deployment.py`.

Then verify desktop/mobile browser flows, direct `/labs/N` reloads, saved-run
selection, static downloads, upload rejection, resize limits, CORS errors,
classical segmentation, first visit after sleep, and repeated maximum-size
requests. Watch Render's memory/CPU/restart metrics; do not assume macOS results
represent 512 MB Linux behavior. Check a second client network and forged forwarding
headers before configuring trusted proxy CIDRs. Confirm readiness while idle and
under a job, and that disallowed neural routes cannot run.

The local maximum-size workload peaked around 223 MiB RSS on macOS for one API
process. All live methods succeeded and no heavy libraries were imported. Linux
wheel resolution was checked, but actual Docker compilation, Render startup,
public TLS/client-IP handling, cold starts and memory/CPU limits remain target
checks. A process over its memory limit or a request consistently exceeding the
wait deadline requires investigation or a different plan; do not call it verified.

## Update and rollback

Commit/push reviewed code and use Manual Deploy in Render; redeploy Vercel for
frontend changes or public environment changes. Keep a known-good Git SHA for
both services and roll back that pair if needed. Do not overwrite the `full-local`
branch to update the demo. No model training or user-data migration is involved.

Sources: [Render Free limits](https://render.com/docs/free),
[compute plans](https://render.com/docs/compute-plans),
[Docker](https://render.com/docs/docker),
[Blueprint specification](https://render.com/docs/blueprint-spec),
[health checks](https://render.com/docs/health-checks).
