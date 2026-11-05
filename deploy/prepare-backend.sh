#!/bin/sh
# Run on the Linux backend as its service user, from a trusted checkout.
set -eu
cd "$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
[ "$(uname -s)" = Linux ] || { echo 'Run this on the Linux deployment target.' >&2; exit 1; }
command -v python3.12 >/dev/null || { echo 'Install Python 3.12, venv and native build tools first.' >&2; exit 1; }
python3.12 -m venv backend/.venv
backend/.venv/bin/python -m pip install -r backend/requirements-lock.txt
# Explicit CPU wheels avoid pulling a CUDA stack onto the free CPU VM.
backend/.venv/bin/python -m pip install --no-deps --index-url https://download.pytorch.org/whl/cpu torch==2.15.0 torchvision==0.29.2
backend/.venv/bin/python -m pip install --no-deps -r backend/requirements-lab6-lock.txt
backend/.venv/bin/python backend/scripts/build_surf.py --install --jobs 2
mkdir -p backend/.cache/lab6/settings backend/.cache/matplotlib
export YOLO_CONFIG_DIR="$PWD/backend/.cache/lab6/settings"
export MPLCONFIGDIR="$PWD/backend/.cache/matplotlib"
export YOLO_AUTOINSTALL=false
backend/.venv/bin/python backend/scripts/prepare_lfw.py
backend/.venv/bin/python backend/scripts/prepare_yolo.py
backend/.venv/bin/python backend/scripts/prepare_segmentation.py
backend/.venv/bin/python -m pip freeze > backend/.cache/deployment-packages.txt
# The reviewed custom checkpoint and artifacts must be securely copied first.
backend/.venv/bin/python backend/scripts/verify_deployment.py --inference
