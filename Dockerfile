# ───────── BASE IMAGE ─────────
FROM python:3.11-slim

# System packages you may need for wheels like nltk or ultralytics
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential git && \
    rm -rf /var/lib/apt/lists/*

# ───────── WORKDIR & DEPENDENCIES ─────────
WORKDIR /api
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ───────── COPY SOURCE CODE ─────────
COPY api ./api

# ───────── PORT & ENTRYPOINT ─────────
EXPOSE 5328
CMD ["uvicorn", "api.asgi:asgi_app", "--host", "0.0.0.0", "--port", "5328", "--workers", "2"]
