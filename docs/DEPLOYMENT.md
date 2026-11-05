# Oracle VM deployment reference

The current demo branch targets [Render Free](RENDER_DEPLOYMENT.md). This guide
is retained for the full backend/Oracle option; the Oracle account setup was
blocked and no VM was provisioned.

This is a prepared deployment path, not an existing live deployment. The Linux
VM, domain/DNS, Vercel project and external uptime alert still need to be created
and verified with the owner's accounts. Local macOS verification does not prove
Linux wheel compatibility, VM capacity, public TLS, firewall or browser camera
permissions. No cloud resources are provisioned by these files.

## Architecture and why

Vercel serves `frontend/` as a static Vite SPA. The browser calls a separate
HTTPS API origin directly, using `VITE_API_BASE_URL`. The VM runs Caddy on 80/443
and one Uvicorn worker bound to 127.0.0.1:8000 under systemd. This avoids Vercel's
120-second external-rewrite proxy and preserves a simple client-IP trust boundary.
No account system, database, training service or GPU server is added.

The API is public. CORS permits configured browser origins; it is not
authentication and does not prevent command-line clients. Rate and resource
limits remain necessary. People on the same public IP share an allowance.

## 1. Prepare the VM and trusted artifacts

Use a supported Linux distribution with Python 3.12 and systemd (Ubuntu 24.04 is
a suitable target). Start with enough RAM for the service's 4 GiB memory ceiling
plus the OS and native compilation; the actual allocation is your VM choice.
MemoryMax is a safety ceiling, not a measurement of the app's needs. Load-test
the target. If the VM cannot sustain the laboratory jobs, reduce input limits or
choose a larger supported allocation before launch; do not add workers blindly.

Install Python 3.12/venv, Git, a C/C++ toolchain, CMake, Ninja and development
headers. Install Caddy using its official distribution instructions. For Ubuntu:

```sh
sudo apt update
sudo apt install git python3.12 python3.12-venv python3.12-dev build-essential cmake ninja-build pkg-config
sudo useradd --system --user-group --home-dir /opt/optiq --shell /usr/sbin/nologin optiq
sudo mkdir -p /opt/optiq /etc/optiq
# Put this trusted repository checkout at /opt/optiq, with readable source files.
sudo mkdir -p /opt/optiq/backend/.cache/lab6/settings /opt/optiq/backend/.cache/matplotlib
sudo chown -R optiq:optiq /opt/optiq
```

Do not copy the macOS `.venv`, native SURF wheel or node_modules. Native packages
must be installed/built on the target architecture. The preparation script uses
pinned CPU PyTorch/torchvision wheels. If those exact versions lack a Linux/ARM
wheel, stop and resolve/verify the target lock explicitly; do not silently replace
libraries or install a CUDA stack. Main and optional locks were recorded on macOS.
SURF requires the custom OpenCV build, not merely an equal version number.

The approved custom checkpoint is ignored by Git. Transfer these files securely
from the current trusted working copy, preserving the relative names:

```text
backend/.cache/lab6/custom/best.pt
backend/.cache/lab6/dataset.json
backend/.cache/lab6/training.json
backend/.cache/lab6/evaluation.json
backend/.cache/lab6/training.log
```

Record and compare SHA-256 before/after transfer (`shasum -a 256` locally,
`sha256sum` on Linux). The deployment must retain the existing reviewed artifact
and checkpoint relationship; do not retrain just to deploy. Never accept
checkpoints from public uploads. Keep an independent trusted backup of these
files; Git alone cannot restore the trained model. Keep training/review datasets
locally for reproducibility; raw training photos/runs need not be served.

Then run on the VM, as the service user:

```sh
sudo -u optiq sh /opt/optiq/deploy/prepare-backend.sh
```

This installs locks, builds SURF with two compilation jobs, explicitly prepares
LFW/pretrained YOLO/samples/semantic weights, records installed packages and runs
offline checks plus real inference. It can take time and needs network access.
It never starts custom training. If a download is unavailable, use the documented
per-lab preparation/verified cache-transfer workflow rather than request-time
downloads. Preparation fails until the reviewed custom artifacts are present.

## 2. Set backend configuration and service

Copy `deploy/backend.env.example` to `/etc/optiq/backend.env`, replace the exact
frontend origin, and keep permissions root-owned 0640 (group optiq). No trailing
slash, paths or wildcard origins. Multiple exact origins are comma-separated;
allow a Vercel preview domain only deliberately, then remove it when finished.
The Vite API origin is public configuration; never put secrets in `VITE_*`.

Install and start:

```sh
sudo cp /opt/optiq/deploy/systemd/optiq-api.service /etc/systemd/system/
sudo mkdir -p /etc/systemd/journald@optiq.conf.d
sudo cp /opt/optiq/deploy/journald/limits.conf /etc/systemd/journald@optiq.conf.d/
sudo systemd-analyze verify /etc/systemd/system/optiq-api.service
sudo systemctl daemon-reload
sudo systemctl enable --now optiq-api
curl --fail http://127.0.0.1:8000/api/health
curl --fail http://127.0.0.1:8000/api/ready
```

One worker preserves the shared processing/rate budgets and avoids duplicate
model caches. Uvicorn admits at most 16 concurrent connections/tasks (backlog 64);
excess traffic receives 503. This also bounds simultaneous upload staging.
This admission cap includes health checks under saturation; it is an initial
setting to verify on the VM, not a promise of classroom concurrency. systemd restarts crashes, enables reboot startup, and permits cache
writes while protecting the source/system/home directories. It grants 150 seconds
for Uvicorn shutdown and kills a stuck service after 160 seconds. HTTP cancellation
cannot terminate a numerical worker; a truly stuck native job may require a
service restart. A 4 GiB ceiling can kill an oversized process: inspect journal
and tune only after measuring actual Linux workloads. Installations/builds run
outside this restricted service. Production disables OpenAPI/docs routes.

## 3. Configure HTTPS and the network

Point an API hostname to the VM. Open TCP 80/443 in both Oracle network rules and
the host firewall. Restrict SSH to your administration IP. Never expose port 8000.
If publishing IPv6, configure its DNS/firewall too. Do not add a CDN/proxy in front
of Caddy without revisiting trusted-client-IP handling.

Copy `deploy/caddy.env.example` to `/etc/optiq/caddy.env` and set the actual API
hostname (without scheme), ACME email and one primary frontend HTTPS origin.
Copy the Caddyfile and environment drop-in:

```sh
sudo cp /opt/optiq/deploy/Caddyfile /etc/caddy/Caddyfile
sudo mkdir -p /etc/systemd/system/caddy.service.d
sudo cp /opt/optiq/deploy/systemd/caddy-optiq.conf /etc/systemd/system/caddy.service.d/
sudo systemctl daemon-reload
# Validate with the same values that the environment file supplies:
sudo env API_DOMAIN=api.your-domain.example ACME_EMAIL=you@your-domain.example FRONTEND_ORIGIN=https://your-project.vercel.app caddy validate --config /etc/caddy/Caddyfile
sudo systemctl enable --now caddy
sudo systemctl reload caddy
```

Caddy obtains/renews TLS certificates. Its API handler overwrites forwarded client
IP with the direct remote IP and removes alternative forwarding headers; Uvicorn
trusts only loopback Caddy. Client-supplied X-Forwarded-For must not change the
rate-limit bucket. A benign Caddy adapter warning calls the explicit override
unnecessary; it is retained to make the trust boundary visible and testable.
Proxy errors have JSON detail/CORS for the primary frontend origin. Extra allowed
frontend origins receive backend CORS, but proxy-generated errors use the primary
origin. Keep this limitation in mind when testing previews.

## 4. Deploy the frontend to Vercel

Import the repository, set **Root Directory = frontend**, Node.js 22.12+ supported
by Vite, install `npm ci`, build `npm run build`, output `dist`.
Set `VITE_API_BASE_URL=https://api.your-domain.example` before building. Redeploy
when changing it; Vite embeds public env values at build time. Do not set it to
the Vercel frontend itself. `frontend/vercel.json` supplies SPA fallback and
basic security headers; built assets retain normal file serving. Verify direct
links to `/labs/1` through `/labs/7` after deployment.

No Vercel external API rewrite is required. The local Vite proxy still works
when the API origin is empty. Browser camera permission needs the frontend's
HTTPS origin and a user gesture. The camera captures locally and sends frames
to your configured API; no backend webcam hardware is required.

## 5. Timeouts, resource limits and monitoring

| Layer | Limit | Purpose |
| --- | --- | --- |
| API per-file validation | 5 MiB/image | Preserve current input policy |
| API/Caddy whole request | 6 MiB; Lab 4 pair 11 MiB | Bound form overhead plus images |
| API body receipt | 30 seconds | Stop stalled/slow uploads |
| Caddy body receipt | 35 seconds | Network-layer backup |
| API lab HTTP deadline | 110 seconds | Return JSON 504 while retaining active CPU guard |
| Browser metadata / POST wait | 30 / 120 seconds | Bounded wait including response-body reading |
| Caddy upstream response headers | 115 seconds | Allow API timeout response first |
| Caddy response write | 130 seconds | Bound delivery |
| Shared processing | 1 job/process | Avoid overlapping model/CPU work |
| IP allowance | 240/minute; burst 24 | Limit repeated API use |

Timeouts bound waiting, not the lifetime of native CPU work. A timed-out job
retains its processing slot until its worker returns. Do not automatically retry
504/503 or rerun expensive jobs blindly. A job consistently exceeding the limit
on the target needs performance/resource investigation, not a fictitious success.
Per-request bounds and rate limits do not cap every incoming connection; OS/cloud
firewall rules and a monitored VM still matter. Temporary files and model runtime
settings need writable storage. The probe warns when cache or temp space falls
below 1 GiB.

Install the local timer:

```sh
sudo cp /opt/optiq/deploy/systemd/optiq-monitor.service /etc/systemd/system/
sudo cp /opt/optiq/deploy/systemd/optiq-monitor.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now optiq-monitor.timer
sudo systemctl start optiq-monitor.service
sudo journalctl --namespace=optiq -u optiq-api -u optiq-monitor --since '1 hour ago'
```

The five-minute timer checks health/readiness/storage and records failure; it does
not notify your phone or repair missing assets. Configure an independent external
HTTPS monitor against `/api/ready` with an alert destination in your account.
Also monitor the frontend URL and VM disk/RAM. Readiness is cached for 60 seconds,
checks actual dataset/capabilities/checkpoint-artifact hashes and storage, and
returns only fixed check names and booleans. It does not run inference on probes.
Use `/api/health` for liveness; missing a model should not cause a restart loop.
The namespaced journal is bounded to 100 MiB disk / 50 MiB runtime and seven days;
request bodies/uploads are not logged. The template disables access logging.

## 6. Verify and roll back

On the VM and then through the public HTTPS address:

```sh
cd /opt/optiq
backend/.venv/bin/python backend/scripts/verify_deployment.py --inference
backend/.venv/bin/python backend/scripts/smoke_test.py --base-url http://127.0.0.1:8000 --full
backend/.venv/bin/python backend/scripts/smoke_test.py --base-url https://api.your-domain.example --origin https://your-project.vercel.app --full
```

Run during a quiet period: these are real sequential experiments, including a
fresh PCA/SVM fit, all feature algorithms and both detection models/semantic
inference. They do not train YOLO or alter the reviewed checkpoint. Check browser
flows on desktop/mobile: all lab starts, upload/clear/download, cross-origin API
errors, camera start/stop/denied permission, keyboard focus and direct page reload.
Confirm independent client-IP buckets through Caddy, rejection of spoofed
forwarding headers, readable 413/429 errors, and health access while a job runs.

Record the deployed Git SHA, Linux/architecture, prepared resource hashes and
`backend/.cache/deployment-packages.txt`. Keep the prior checkout/release and
matching resource bundle. To roll back, restore that pair, restart the API, rerun
readiness/full smoke tests and use Vercel's previous deployment for the frontend.
Do not replace live model files mid-request; stop the service, update a coherent
bundle, verify offline, then start. `/api/ready` is cached, so allow up to a minute
or restart after intentional resource updates.

## Verification boundary

Implemented locally: application protections, readiness, configuration examples,
service/monitor definitions, offline checks and API smoke tools. Actual Linux
package installation/SURF compilation, systemd restart/reboot, public certificates,
Oracle firewall, Vercel SPA deployment, external alert delivery and physical-camera
permission remain target/account checks. Do not describe the site as live or
fully production-verified until those checks pass.

Primary references: [Vercel Vite deployment](https://vercel.com/docs/frameworks/frontend/vite),
[Vercel external-proxy limits](https://vercel.com/docs/limits),
[Caddy proxy headers](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy),
[Caddy server timeouts](https://caddyserver.com/docs/caddyfile/options),
[Uvicorn settings](https://www.uvicorn.org/settings/).
