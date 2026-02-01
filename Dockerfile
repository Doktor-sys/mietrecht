FROM python:3.11-slim

ENV PYTHONIOENCODING=utf-8
ENV LANG=C.UTF-8
ENV FLASK_APP=mietrecht_app_fixed.py
ENV FLASK_ENV=production

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn

# Copy application files
COPY . .

# Create data directory
RUN mkdir -p /app/data

EXPOSE 5000

# Health check with curl (more reliable)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Start with Gunicorn for production
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--timeout", "120", "--workers", "2", "--access-logfile", "-", "--error-logfile", "-", "mietrecht_app_fixed:app"]
