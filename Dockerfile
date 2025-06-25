FROM python:3.11-slim

ENV TORCH_CUDA_ARCH_LIST=CPU

WORKDIR /app

COPY api/requirements.txt .

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir gunicorn

COPY api ./api

EXPOSE 5328

CMD ["gunicorn", "--workers", "2", "--bind", "0.0.0.0:5328", "api.app:create_app()"]
