# Deployment Guide for mietrecht-webinterface

## Overview

This guide provides instructions for deploying the Mietrecht Webinterface to different environments.

## Prerequisites

- Node.js 18 or higher
- npm package manager
- Git (for Heroku deployment)
- Docker (for Docker deployment)

## Heroku Deployment

Deploy to Heroku platform

### Steps:

1. Ensure Heroku CLI is installed
2. Log in to Heroku: heroku login
3. Create Heroku app: heroku create
4. Set environment variables
5. Deploy: git push heroku main

## Docker Deployment

Deploy using Docker container

### Steps:

1. Build Docker image: docker build -t mietrecht-webinterface .
2. Run container: docker run -p 3002:3002 mietrecht-webinterface

## Traditional Server Deployment

Deploy to traditional server

### Steps:

1. Upload application files to server
2. Install Node.js dependencies: npm install
3. Configure environment variables
4. Start application: npm start

