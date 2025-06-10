FROM python:3.11-slim

# ---------- install deps ----------
WORKDIR /app
COPY api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install uvicorn gunicorn

COPY api ./api

EXPOSE 5001

CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:5001", "--workers", "4", \
     "api.asgi:asgi_app"]
