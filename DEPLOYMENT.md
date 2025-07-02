# CraftMyself Deployment Guide

## Overview
This guide explains how to deploy CraftMyself application to your DigitalOcean droplet with separate configurations for development and production environments.

## Architecture
- **Frontend**: Angular application served by Nginx (Production) / Angular Dev Server (Development)
- **Backend**: Node.js/Express API with TypeScript
- **Database**: PostgreSQL
- **Containerization**: Docker with Docker Compose

## Environment Differentiation

### Development (Local)
- Uses `docker-compose.yml`
- Hot reloading enabled
- Development dependencies included
- Volume mounts for live editing
- Exposed ports: Frontend (4200), API (3000), DB (5432), pgAdmin (8080)

### Production (DigitalOcean)
- Uses `docker-compose.prod.yml`
- Optimized builds with multi-stage Docker
- Production-only dependencies
- Nginx for frontend serving
- Security hardening (non-root users)
- Exposed ports: Frontend (80), API (3000)

## Prerequisites

1. **DigitalOcean Droplet** with:
   - Ubuntu 20.04 or later
   - At least 2GB RAM
   - Docker and Docker Compose installed

2. **Domain/IP**: Your droplet's IP address or domain name

## Deployment Steps

### 1. Prepare Your Droplet

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
```

### 2. Clone Repository

```bash
git clone <your-repo-url>
cd craftmyself
```

### 3. Configure Environment

```bash
# Copy production environment template
cp .env.production .env

# Edit environment variables
nano .env
```

**Update these values in `.env`:**
```env
POSTGRES_USER=craftmyself_admin
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=craftmyselfdb
PGADMIN_EMAIL=admin@craftmyself.com
PGADMIN_PASSWORD=your_secure_pgadmin_password_here
GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=production
```

### 4. Update Frontend Configuration

Edit `web/src/environments/environment.prod.ts`:
```typescript
apiUrl: 'http://YOUR_DROPLET_IP:3000'
// or
apiUrl: 'http://yourdomain.com:3000'
```

### 5. Deploy Application

```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

### 6. Verify Deployment

- **Frontend**: http://YOUR_DROPLET_IP
- **API**: http://YOUR_DROPLET_IP:3000
- **Health Check**: http://YOUR_DROPLET_IP:3000/health
- **pgAdmin**: http://YOUR_DROPLET_IP:8080 (login with PGADMIN_EMAIL/PGADMIN_PASSWORD)

## Manual Deployment Commands

If you prefer manual deployment:

```bash
# Stop existing containers
docker-compose -f docker-compose.prod.yml down

# Build and start production containers
docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Check status
docker-compose -f docker-compose.prod.yml ps
```

## Local Development

For local development, use the standard docker-compose file:

```bash
# Start development environment
docker-compose up -d

# View logs
docker-compose logs -f

# Stop development environment
docker-compose down
```

## Differences Between Environments

| Feature | Development | Production |
|---------|-------------|------------|
| Frontend Server | Angular Dev Server | Nginx |
| Hot Reload | ✅ Enabled | ❌ Disabled |
| Build Optimization | ❌ None | ✅ Minified/Optimized |
| Volume Mounts | ✅ Source code | ❌ Built assets only |
| Security | Basic | Hardened (non-root users) |
| Database Admin | pgAdmin accessible | Not exposed |
| SSL/TLS | None | Ready for reverse proxy |

## Security Considerations

1. **Environment Variables**: Never commit `.env` files with real credentials
2. **Database**: PostgreSQL is not exposed externally in production
3. **User Permissions**: Containers run as non-root users in production
4. **Firewall**: Configure UFW to only allow necessary ports:

```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 3000
sudo ufw allow 8080  # pgAdmin
```

## pgAdmin Security Options

### Option 1: Standard Access (Current Setup)
- pgAdmin accessible at `http://YOUR_DROPLET_IP:8080`
- Protected by login credentials only
- Suitable for trusted networks

### Option 2: Localhost Only (More Secure)
```yaml
# In docker-compose.prod.yml, change pgAdmin ports to:
ports:
  - "127.0.0.1:8080:80"  # Only accessible from localhost
```

Then use SSH tunnel to access:
```bash
ssh -L 8080:localhost:8080 user@YOUR_DROPLET_IP
# Access pgAdmin at http://localhost:8080 on your local machine
```

### Option 3: Temporary pgAdmin
```bash
# Start pgAdmin only when needed
docker-compose -f docker-compose.pgadmin.yml up -d pgadmin-secure

# Stop when done
docker-compose -f docker-compose.pgadmin.yml down
```

### pgAdmin First-Time Setup
1. Login with your PGADMIN_EMAIL and PGADMIN_PASSWORD
2. Add server connection:
   - **Name**: CraftMyself Production
   - **Host**: postgres (container name)
   - **Port**: 5432
   - **Username**: your POSTGRES_USER
   - **Password**: your POSTGRES_PASSWORD

## SSL/HTTPS Setup (Optional)

For production with SSL, consider using a reverse proxy like Nginx or Traefik with Let's Encrypt certificates.

## Monitoring and Logs

```bash
# View application logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend

# Monitor resource usage
docker stats

# Check container health
docker-compose -f docker-compose.prod.yml ps
```

## Troubleshooting

### Common Issues

1. **Port already in use**:
   ```bash
   sudo lsof -i :80
   sudo lsof -i :3000
   ```

2. **Database connection issues**:
   - Check if PostgreSQL container is running
   - Verify environment variables
   - Check Docker network connectivity

3. **Frontend not loading**:
   - Verify Nginx configuration
   - Check if build completed successfully
   - Inspect browser network tab for errors

### Useful Commands

```bash
# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend

# Rebuild specific service
docker-compose -f docker-compose.prod.yml up -d --build frontend

# Access container shell
docker exec -it craftmyself_api_prod /bin/sh

# View database
docker exec -it postgres_db_prod psql -U craftmyself_admin -d craftmyselfdb
```

## Backup and Recovery

### Database Backup
```bash
docker exec postgres_db_prod pg_dump -U craftmyself_admin craftmyselfdb > backup.sql
```

### Database Restore
```bash
docker exec -i postgres_db_prod psql -U craftmyself_admin craftmyselfdb < backup.sql
```

## Updates and Maintenance

1. **Application Updates**:
   ```bash
   git pull origin main
   ./deploy.sh
   ```

2. **System Updates**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

3. **Docker Cleanup**:
   ```bash
   docker system prune -a
   ```

## Support

If you encounter issues:
1. Check the logs: `docker-compose -f docker-compose.prod.yml logs`
2. Verify environment variables
3. Ensure all required ports are available
4. Check Docker and Docker Compose versions