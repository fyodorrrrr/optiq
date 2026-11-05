# Build SURF once in a cached layer; runtime images contain no compiler or ML models.
FROM python:3.12-slim-bookworm AS surf
ENV PIP_NO_CACHE_DIR=1 PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
RUN apt-get update && apt-get install -y --no-install-recommends build-essential cmake ninja-build pkg-config \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /build
COPY backend/requirements-render-lock.txt ./requirements.txt
RUN python -m pip install -r requirements.txt
COPY backend/scripts/build_surf.py ./scripts/build_surf.py
RUN python scripts/build_surf.py --minimal --install --jobs 1

FROM python:3.12-slim-bookworm
ENV PIP_NO_CACHE_DIR=1 PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 \
    OPTIQ_PROFILE=render-free OPTIQ_ENV=production OMP_NUM_THREADS=1 \
    OPENBLAS_NUM_THREADS=1 MKL_NUM_THREADS=1
RUN apt-get update && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY backend/requirements-render-lock.txt ./requirements.txt
COPY --from=surf /build/.cache/surf-wheels/*.whl /wheels/
RUN python -m pip install -r requirements.txt \
    && python -m pip install --force-reinstall --no-deps /wheels/*.whl \
    && rm -rf /wheels
COPY backend/main.py ./main.py
COPY backend/routers ./routers
COPY backend/schemas ./schemas
COPY backend/services ./services
COPY backend/middleware ./middleware
COPY backend/assets ./assets
COPY deploy/render/start.sh ./start.sh
USER 10001:10001
# Fail the image build if SURF or the profile is unavailable; never substitute ORB.
RUN python -c "import sys; from services.readiness import Readiness; r=Readiness().report(); assert r['status']=='ready', r; assert not any(n.split('.')[0] in {'sklearn','torch','torchvision','ultralytics'} for n in sys.modules)"
EXPOSE 10000
CMD ["sh", "/app/start.sh"]
