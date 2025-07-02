#!/bin/bash

# CraftMyself Production Deployment Script
# This script deploys the application to production environment

set -e

echo "🚀 Starting CraftMyself Production Deployment..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found!"
    echo "Please copy .env.production to .env and fill in your values"
    exit 1
fi

# Source environment variables
source .env

# Pull latest changes (if running from git)
if [ -d ".git" ]; then
    echo "📥 Pulling latest changes..."
    git pull origin main
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Remove old images to free up space
echo "🧹 Cleaning up old images..."
docker system prune -f

# Build and start production containers
echo "🏗️ Building and starting production containers..."
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check if services are running
echo "✅ Checking service status..."
docker-compose -f docker-compose.prod.yml ps

# Test API endpoint
echo "🔍 Testing API endpoint..."
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ API is responding"
else
    echo "⚠️ API health check failed"
fi

# Test Frontend
echo "🔍 Testing Frontend..."
if curl -f http://localhost:80 > /dev/null 2>&1; then
    echo "✅ Frontend is responding"
else
    echo "⚠️ Frontend health check failed"
fi

# Test pgAdmin
echo "🔍 Testing pgAdmin..."
if curl -f http://localhost:8080 > /dev/null 2>&1; then
    echo "✅ pgAdmin is responding"
else
    echo "⚠️ pgAdmin health check failed"
fi

echo "🎉 Deployment completed!"