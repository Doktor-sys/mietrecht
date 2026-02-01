FROM python:3.9-slim

ENV PYTHONIOENCODING=utf-8
ENV LANG=C.UTF-8

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the full application and assets
COPY mietrecht_full.py .
COPY .env .
COPY static/ ./static/
COPY templates/ ./templates/

# Install Gunicorn for production
RUN pip install gunicorn

EXPOSE 5000

# Use Gunicorn for production
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "mietrecht_full:app"]
