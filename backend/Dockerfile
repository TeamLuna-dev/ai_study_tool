FROM python:3.10-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8080

WORKDIR /app

# System deps for pdfminer, etc.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Cloud Run sets $PORT; bind 0.0.0.0
# Timeout matches the Cloud Run deploy --timeout 300 (Deployment.md) —
# task-handler requests now run for minutes, so the platform timeout
# must be the binding constraint, not gunicorn's.
CMD exec gunicorn --bind :$PORT --workers 2 --threads 4 --timeout 300 app:app