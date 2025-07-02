#!/bin/bash

# pgAdmin Security Management Script
# Use this script to manage pgAdmin access securely

set -e

ACTION=${1:-help}

case $ACTION in
    "start")
        echo "🔒 Starting pgAdmin in secure mode (localhost only)..."
        
        # Backup current production compose
        if [ -f "docker-compose.prod.yml" ]; then
            cp docker-compose.prod.yml docker-compose.prod.yml.backup
        fi
        
        # Modify pgAdmin to localhost only
        sed -i 's/- "8080:80"/- "127.0.0.1:8080:80"/' docker-compose.prod.yml
        
        # Restart pgAdmin container
        docker-compose -f docker-compose.prod.yml up -d pgadmin
        
        echo "✅ pgAdmin is now running in secure mode"
        echo "🔗 Access via SSH tunnel: ssh -L 8080:localhost:8080 user@YOUR_DROPLET_IP"
        echo "🌐 Then visit: http://localhost:8080"
        ;;
        
    "restore")
        echo "🔓 Restoring pgAdmin to public access..."
        
        if [ -f "docker-compose.prod.yml.backup" ]; then
            mv docker-compose.prod.yml.backup docker-compose.prod.yml
            docker-compose -f docker-compose.prod.yml up -d pgadmin
            echo "✅ pgAdmin restored to public access mode"
        else
            echo "❌ No backup found. Manually edit docker-compose.prod.yml"
        fi
        ;;
        
    "stop")
        echo "🛑 Stopping pgAdmin..."
        docker-compose -f docker-compose.prod.yml stop pgadmin
        echo "✅ pgAdmin stopped"
        ;;
        
    "temp")
        echo "⏰ Starting temporary pgAdmin (will stop after 1 hour)..."
        docker-compose -f docker-compose.pgadmin.yml up -d pgadmin-secure
        
        # Schedule automatic stop after 1 hour
        (sleep 3600 && docker-compose -f docker-compose.pgadmin.yml down) &
        
        echo "✅ Temporary pgAdmin started"
        echo "🔗 Access at: http://YOUR_DROPLET_IP:8080"
        echo "⏰ Will automatically stop in 1 hour"
        ;;
        
    "tunnel")
        echo "🚇 Creating SSH tunnel for secure access..."
        echo "Run this command on your local machine:"
        echo ""
        echo "ssh -L 8080:localhost:8080 user@YOUR_DROPLET_IP"
        echo ""
        echo "Then access pgAdmin at: http://localhost:8080"
        ;;
        
    "help"|*)
        echo "pgAdmin Security Management Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  start    - Start pgAdmin in secure mode (localhost only)"
        echo "  restore  - Restore pgAdmin to public access"
        echo "  stop     - Stop pgAdmin container"
        echo "  temp     - Start temporary pgAdmin (auto-stops after 1 hour)"
        echo "  tunnel   - Show SSH tunnel instructions"
        echo "  help     - Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 start     # Secure localhost-only access"
        echo "  $0 temp      # Temporary public access"
        echo "  $0 tunnel    # SSH tunnel instructions"
        ;;
esac