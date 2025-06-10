# Simple Dockerfile for Chat Message Analyzer
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies for parsing
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements from api directory and install Python dependencies
COPY api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code from api directory
COPY api/ .

# Create uploads directory for file processing
RUN mkdir -p uploads

# Expose port
EXPOSE 5328

# Run the ASGI application
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "asgi:asgi_app", "-k", "uvicorn.workers.UvicornWorker"]