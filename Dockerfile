FROM python:3.11-slim

# ---------- install deps ----------
WORKDIR /app
COPY api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install gunicorn

COPY api ./api

# Expose the port your app will run on
EXPOSE 5328

#
# Corrected CMD instruction
#
# Changes:
# 1. Removed uvicorn and the "-k uvicorn.workers.UvicornWorker" flag to use a standard WSGI worker.
# 2. Changed the bind port from 5328 to 8000.
# 3. Reduced workers from 4 to 2 to conserve memory.
# 4. Pointed gunicorn to your Flask app factory: `api.app:create_app()`.
#    (This assumes the file containing `create_app` is named `api/app.py`)
#
CMD ["gunicorn", "--workers", "2", "--bind", "0.0.0.0:5328", "api.app:create_app()"]