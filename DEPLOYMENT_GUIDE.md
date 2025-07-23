# 🚀 Production Deployment Guide - Phase 2

## 📋 **Overview**

This guide provides step-by-step instructions for deploying MallOS Enterprise Phase 2 (IoT & AI Features) to production environment.

## 🏗️ **Architecture Overview**

### **Production Stack**
- **Backend**: Node.js + TypeScript API Server
- **Frontend**: React + Vite Web Application
- **Database**: PostgreSQL 14+ with TimescaleDB extension
- **Cache**: Redis 7+ with persistence
- **Message Broker**: MQTT (Mosquitto) for IoT communication
- **Reverse Proxy**: NGINX with SSL termination
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Containerization**: Docker + Docker Compose
- **Orchestration**: Kubernetes (optional)

## 🔧 **Prerequisites**

### **Server Requirements**
```bash
# Minimum Server Specifications
- CPU: 8 cores (16 cores recommended)
- RAM: 16GB (32GB recommended)
- Storage: 500GB SSD (1TB recommended)
- Network: 1Gbps (10Gbps recommended)
- OS: Ubuntu 20.04 LTS or CentOS 8
```

### **Software Requirements**
```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo apt update
sudo apt install git -y
```

## 📦 **Deployment Steps**

### **1. Clone Repository**
```bash
# Clone the repository
git clone https://github.com/mallos-enterprise/mallos-platform.git
cd mallos-platform

# Checkout production branch
git checkout production
```

### **2. Environment Configuration**
```bash
# Copy environment template
cp env.example .env.production

# Configure production environment variables
nano .env.production
```

**Required Environment Variables:**
```bash
# Application
NODE_ENV=production
APP_PORT=3001
APP_URL=https://mallos.com
CORS_ORIGIN=https://mallos.com

# Database
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=mallos_enterprise
DATABASE_USER=mallos_user
DATABASE_PASSWORD=your_secure_password
DATABASE_SSL=true

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# MQTT
MQTT_BROKER_URL=mqtt://mqtt:1883
MQTT_USERNAME=mallos_mqtt
MQTT_PASSWORD=your_mqtt_password

# JWT Authentication
JWT_SECRET=your_super_secure_jwt_secret_key
JWT_EXPIRES_IN=24h

# AI/ML Configuration
TENSORFLOW_GPU_ENABLED=true
MODEL_STORAGE_PATH=/app/models
TRAINING_DATA_PATH=/app/data/training

# Computer Vision
OPENCV_CASCADE_PATH=/app/opencv/cascades
FACE_RECOGNITION_MODEL_PATH=/app/models/face-api
VIDEO_STREAM_BUFFER_SIZE=10

# Security
THREAT_DETECTION_SENSITIVITY=0.8
ALERT_COOLDOWN_PERIOD=300

# Monitoring
PROMETHEUS_ENABLED=true
GRAFANA_PASSWORD=your_grafana_password

# External Services
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password

# File Storage
UPLOAD_PATH=/app/uploads
MAX_FILE_SIZE=10485760
```

### **3. SSL Certificate Setup**
```bash
# Create SSL directory
mkdir -p nginx/ssl

# Generate SSL certificate (Let's Encrypt)
sudo apt install certbot -y
sudo certbot certonly --standalone -d mallos.com -d www.mallos.com

# Copy certificates to nginx directory
sudo cp /etc/letsencrypt/live/mallos.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/mallos.com/privkey.pem nginx/ssl/
sudo chown -R $USER:$USER nginx/ssl/
```

### **4. NGINX Configuration**
```bash
# Create NGINX configuration
mkdir -p nginx
nano nginx/nginx.conf
```

**nginx.conf:**
```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3001;
    }

    upstream frontend {
        server frontend:80;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    server {
        listen 80;
        server_name mallos.com www.mallos.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name mallos.com www.mallos.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

        # API endpoints
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }

        # WebSocket support
        location /socket.io/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Frontend application
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

### **5. Monitoring Configuration**
```bash
# Create monitoring directories
mkdir -p monitoring/prometheus
mkdir -p monitoring/grafana/dashboards
mkdir -p monitoring/grafana/datasources
mkdir -p monitoring/logstash/pipeline

# Prometheus configuration
nano monitoring/prometheus/prometheus.yml
```

**prometheus.yml:**
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'mallos-backend'
    static_configs:
      - targets: ['backend:3001']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'mallos-postgres'
    static_configs:
      - targets: ['postgres:5432']

  - job_name: 'mallos-redis'
    static_configs:
      - targets: ['redis:6379']

  - job_name: 'mallos-mqtt'
    static_configs:
      - targets: ['mqtt:1883']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

### **6. Database Migration**
```bash
# Run database migrations
docker-compose -f docker-compose.prod.yml up -d postgres
docker-compose -f docker-compose.prod.yml exec backend npm run migrate

# Seed initial data
docker-compose -f docker-compose.prod.yml exec backend npm run seed
```

### **7. Build and Deploy**
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

## 🔍 **Post-Deployment Verification**

### **1. Health Checks**
```bash
# Check application health
curl -f https://mallos.com/api/health

# Check database connection
docker-compose -f docker-compose.prod.yml exec backend npm run db:test

# Check Redis connection
docker-compose -f docker-compose.prod.yml exec redis redis-cli ping

# Check MQTT connection
docker-compose -f docker-compose.prod.yml exec mqtt mosquitto_pub -h localhost -t test -m "ping"
```

### **2. API Testing**
```bash
# Test authentication
curl -X POST https://mallos.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@mallos.com", "password": "password"}'

# Test IoT endpoints
curl -X GET https://mallos.com/api/iot/devices \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test AI endpoints
curl -X GET https://mallos.com/api/ai/models \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test Computer Vision endpoints
curl -X GET https://mallos.com/api/computer-vision/cameras \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **3. Frontend Testing**
```bash
# Test frontend accessibility
curl -I https://mallos.com

# Test dashboard loading
# Open browser and navigate to:
# - https://mallos.com/iot
# - https://mallos.com/ai
# - https://mallos.com/computer-vision
```

## 📊 **Monitoring Setup**

### **1. Grafana Dashboards**
```bash
# Access Grafana
# URL: https://mallos.com:3002
# Username: admin
# Password: (from environment variable)

# Import dashboards:
# - System Overview
# - IoT Device Monitoring
# - AI Model Performance
# - Computer Vision Analytics
# - Database Performance
# - Application Metrics
```

### **2. Alert Configuration**
```bash
# Set up email alerts for:
# - High CPU/Memory usage
# - Database connection issues
# - IoT device offline
# - AI model errors
# - Security alerts
# - Disk space low
```

## 🔒 **Security Hardening**

### **1. Firewall Configuration**
```bash
# Configure UFW firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3002/tcp  # Grafana
sudo ufw allow 9090/tcp  # Prometheus
sudo ufw deny 22/tcp     # Deny SSH if using key-based auth
```

### **2. SSL Certificate Renewal**
```bash
# Create renewal script
nano /etc/cron.daily/ssl-renewal

#!/bin/bash
certbot renew --quiet
cp /etc/letsencrypt/live/mallos.com/fullchain.pem /path/to/mallos-platform/nginx/ssl/
cp /etc/letsencrypt/live/mallos.com/privkey.pem /path/to/mallos-platform/nginx/ssl/
docker-compose -f /path/to/mallos-platform/docker-compose.prod.yml restart nginx

# Make executable
chmod +x /etc/cron.daily/ssl-renewal
```

### **3. Backup Configuration**
```bash
# Create backup script
nano /etc/cron.daily/mallos-backup

#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mallos"

# Database backup
docker-compose -f /path/to/mallos-platform/docker-compose.prod.yml exec -T postgres pg_dump -U mallos_user mallos_enterprise > $BACKUP_DIR/db_$DATE.sql

# File backup
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /path/to/mallos-platform/uploads/

# Clean old backups (keep 30 days)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

# Make executable
chmod +x /etc/cron.daily/mallos-backup
```

## 🔄 **Maintenance Procedures**

### **1. Application Updates**
```bash
# Pull latest code
git pull origin production

# Rebuild and restart services
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend npm run migrate
```

### **2. Database Maintenance**
```bash
# Database optimization
docker-compose -f docker-compose.prod.yml exec backend npm run db:optimize

# Clean old data
docker-compose -f docker-compose.prod.yml exec backend npm run db:cleanup
```

### **3. Log Rotation**
```bash
# Configure log rotation
sudo nano /etc/logrotate.d/mallos

/path/to/mallos-platform/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
}
```

## 🆘 **Troubleshooting**

### **Common Issues**

1. **Database Connection Issues**
```bash
# Check database status
docker-compose -f docker-compose.prod.yml logs postgres

# Test connection
docker-compose -f docker-compose.prod.yml exec backend npm run db:test
```

2. **Redis Connection Issues**
```bash
# Check Redis status
docker-compose -f docker-compose.prod.yml logs redis

# Test connection
docker-compose -f docker-compose.prod.yml exec redis redis-cli ping
```

3. **MQTT Connection Issues**
```bash
# Check MQTT status
docker-compose -f docker-compose.prod.yml logs mqtt

# Test connection
docker-compose -f docker-compose.prod.yml exec mqtt mosquitto_pub -h localhost -t test -m "test"
```

4. **Performance Issues**
```bash
# Check resource usage
docker stats

# Check application logs
docker-compose -f docker-compose.prod.yml logs backend

# Monitor database performance
docker-compose -f docker-compose.prod.yml exec postgres psql -U mallos_user -d mallos_enterprise -c "SELECT * FROM pg_stat_activity;"
```

## 📞 **Support**

For production support:
- **Email**: support@mallos.com
- **Phone**: +1-XXX-XXX-XXXX
- **Documentation**: https://docs.mallos.com
- **Status Page**: https://status.mallos.com

---

**MallOS Enterprise** - Production deployment guide for Phase 2 IoT & AI Features. 