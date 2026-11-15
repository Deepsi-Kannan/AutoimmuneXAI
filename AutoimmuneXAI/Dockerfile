# Match the measured Python major/minor. Linux build is not yet verified.
FROM python:3.11-slim-bookworm
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt requirements-hosting.txt ./
RUN pip install --no-cache-dir -r requirements-hosting.txt && pip check
COPY backend/ ./backend/
COPY models/ ./models/
EXPOSE 8000
CMD ["sh", "-c", "exec uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"]
