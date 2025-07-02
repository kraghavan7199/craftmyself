#!/bin/bash

# DigitalOcean Droplet Setup Script for CraftMyself
# Run this script on your fresh Ubuntu droplet

set -e

echo "🔧 Setting up DigitalOcean Droplet for CraftMyself..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
echo "📦 Installing required packages..."
sudo apt install -y curl wget git ufw

# Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
echo "🐳 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 8080/tcp

# Create app directory
echo "📁 Creating application directory..."
mkdir -p ~/craftmyself
cd ~/craftmyself

# Display next steps
echo ""
echo "✅ Droplet setup completed!"
echo ""
echo "🚀 Next steps:"
echo "1. Clone your repository: git clone <your-repo-url> ."
echo "2. Copy and configure environment: cp .env.production .env && nano .env"
echo "3. Update frontend config: nano web/src/environments/environment.prod.ts"
echo "4. Deploy application: ./deploy.sh"
echo ""
echo "🌐 Your droplet IP: $(curl -s https://ipinfo.io/ip)"
echo ""
echo "💡 Note: You may need to log out and back in for Docker permissions to take effect"