#!/bin/bash
# Google Cloud Run Deployment Script for JurisMind

PROJECT_ID="beaming-sunset-484720-e5"
SERVICE_NAME="jurismind-mietrecht"
REGION="europe-west1"

echo "=== Google Cloud Run Deployment ==="
echo "Project: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"
echo

# Authenticate with Google Cloud
echo "1. Authenticating with Google Cloud..."
gcloud auth login

# Set project
echo "2. Setting project..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "3. Enabling required APIs..."
gcloud services enable \
    run.googleapis.com \
    containerregistry.googleapis.com \
    cloudbuild.googleapis.com

# Build and push container
echo "4. Building and pushing container..."
gcloud builds submit \
    --tag gcr.io/$PROJECT_ID/$SERVICE_NAME \
    --file Dockerfile.cloudrun

# Deploy to Cloud Run
echo "5. Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 5000 \
    --memory 1Gi \
    --cpu 1 \
    --set-env-vars FLASK_ENV=production

# Get service URL
echo "6. Getting service information..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')
echo "Service deployed successfully!"
echo "URL: $SERVICE_URL"

echo "Deployment completed!"