# CraftMyself Quick Start Guide

## 🚀 Deploy to DigitalOcean Droplet

### 1. Setup Droplet
```bash
# Run on your droplet
wget -O setup.sh https://raw.githubusercontent.com/your-username/craftmyself/main/setup-droplet.sh
chmod +x setup.sh
./setup.sh
```

### 2. Deploy Application
```bash
# Clone repository
git clone <your-repo-url>
cd craftmyself

# Configure environment
cp .env.production .env
nano .env  # Fill in your credentials

# Update frontend API URL
nano web/src/environments/environment.prod.ts
# Change: apiUrl: 'http://YOUR_DROPLET_IP:3000'

# Deploy
./deploy.sh
```

### 3. Access Application
- **Frontend**: http://YOUR_DROPLET_IP
- **API**: http://YOUR_DROPLET_IP:3000
- **Health Check**: http://YOUR_DROPLET_IP:3000/health
- **pgAdmin**: http://YOUR_DROPLET_IP:8080

## 🔧 Local Development

### Start Development Environment
```bash
# Use development docker-compose
docker-compose up -d

# Access services
# Frontend: http://localhost:4200
# API: http://localhost:3000
# Database: localhost:5432
# pgAdmin: http://localhost:8080
```

### Stop Development Environment
```bash
docker-compose down
```

## 🔄 Key Differences

| Environment | Frontend | API | Database | File Watching |
|-------------|----------|-----|----------|---------------|
| **Development** | Angular Dev Server (4200) | ts-node + nodemon | Exposed (5432) | ✅ Hot reload |
| **Production** | Nginx (80) | Compiled JS | Internal only | ❌ Static build |

## 📋 Required Environment Variables

```env
POSTGRES_USER=craftmyself_admin
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=craftmyselfdb
PGADMIN_EMAIL=admin@craftmyself.com
PGADMIN_PASSWORD=your_pgadmin_password
GEMINI_API_KEY=your_gemini_api_key
NODE_ENV=production
```

## 🔗 Important Files

- `docker-compose.yml` - Development environment
- `docker-compose.prod.yml` - Production environment
- `.env.production` - Production environment template
- `deploy.sh` - Production deployment script
- `setup-droplet.sh` - Droplet initialization script

## 🐛 Troubleshooting

### Common Commands
```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Check status
docker-compose -f docker-compose.prod.yml ps

# Clean up
docker system prune -a
```

### Port Issues
```bash
# Check what's using ports
sudo lsof -i :80
sudo lsof -i :3000
```

### Database Connection
```bash
# Access database
docker exec -it postgres_db_prod psql -U craftmyself_admin -d craftmyselfdb
```