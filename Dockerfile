########################################
# ----------  Build stage  ------------#
########################################
FROM python:3.11-slim AS builder

# 1. System deps (compiler, headers) – build layer ONLY
RUN apt-get update \
 && apt-get install -y --no-install-recommends build-essential git \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# 2. Copy dependency manifests first for better layer caching
COPY api/requirements.txt .
COPY api/wheels/strhub-1.2.0-py3-none-any.whl ./wheels/

# 3. Isolated venv keeps site-packages compact
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH" \
    PIP_NO_CACHE_DIR=1            \
    PYTHONDONTWRITEBYTECODE=1     \
    PYTHONUNBUFFERED=1            \
    PYTHONOPTIMIZE=2

# 4. Install deps – CPU-only torch & no peers
RUN pip install --upgrade pip \
 && pip install --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt \
 && pip install --no-deps ./wheels/strhub-*.whl \
      && pip install gunicorn uvicorn[standard] \
 # strip caches & pyc
 && find /opt/venv -name '__pycache__' -exec rm -rf {} + \
 && rm -rf /root/.cache/pip

########################################
# ---------- Runtime stage ----------- #
########################################
FROM python:3.11-slim

# 5. Minimal system libs for OpenCV headless
RUN apt-get update \
 && apt-get install -y --no-install-recommends libgl1 libglib2.0-0 libsm6 libxext6 \
 && apt-get clean && rm -rf /var/lib/apt/lists/*

# 6. Copy venv from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH" \
    YOLO_CONFIG_DIR=/app/.config/Ultralytics \
    OMP_NUM_THREADS=1 MKL_NUM_THREADS=1 \
    PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PYTHONOPTIMIZE=2 \
    PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:64

# 7. App source
WORKDIR /app
COPY api/ ./api/
COPY api/models ./models/

# 8. Prepare writable config dir for Ultralytics
RUN mkdir -p /app/.config/Ultralytics && chmod -R 777 /app/.config \
 # Remove residual __pycache__ & *.pyc
 && find /app -name '__pycache__' -exec rm -rf {} + \
 && find /app -name '*.pyc' -delete

# 9. Non-root safety
RUN useradd -m appuser
USER appuser

EXPOSE 5328

########################################
# ---------- Entrypoint -------------- #
########################################
# Gunicorn manages workers; Uvicorn runs ASGI app
CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "api.asgi:asgi_app", \
     "--bind", "0.0.0.0:5328", \
     "--workers=1", \
     "--timeout=120", \
     "--max-requests", "1000", \
     "--max-requests-jitter", "50", \
     "--preload", \
     "--worker-tmp-dir", "/dev/shm", \
     "--log-level", "info"]
