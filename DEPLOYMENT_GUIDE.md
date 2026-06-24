# 🚀 RahiCabs Deployment Guide

## Prerequisites

### Software Requirements
- **Java 21+** (OpenJDK or Oracle JDK)
- **Maven 3.8+** (for building backend)
- **Node.js 18+** and **npm 9+** (for frontend)
- **PostgreSQL 14+** (for production database)
- **Git** (for version control)

### Service Accounts Needed
1. **Razorpay Account** - For payment processing
2. **SMS Provider Account** - MSG91 or Twilio (for OTP)
3. **Domain & Hosting** - For deployment
4. **SSL Certificate** - For HTTPS (Let's Encrypt recommended)

---

## 📋 Pre-Deployment Checklist

- [ ] Java 21+ installed
- [ ] PostgreSQL database created
- [ ] Razorpay account created and API keys obtained
- [ ] SMS provider account setup (optional for testing)
- [ ] Domain name configured
- [ ] SSL certificate ready
- [ ] Server/hosting environment ready

---

## 🗄️ Database Setup

### 1. Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

### 2. Create Database and User

```bash
# Login to PostgreSQL
sudo -u postgres psql

# Create database
CREATE DATABASE rahicabs;

# Create user
CREATE USER rahicabs_user WITH PASSWORD 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE rahicabs TO rahicabs_user;

# Exit
\q
```

### 3. Verify Connection

```bash
psql -U rahicabs_user -d rahicabs -h localhost
```

---

## ⚙️ Backend Configuration

### 1. Create Production Properties

Create `backend/src/main/resources/application-prod.properties`:

```properties
# ===================================
# RahiCabs – Production Configuration
# ===================================
spring.application.name=rahicabs-backend
server.port=8080

# ---------- Active Profile ----------
spring.profiles.active=prod

# ---------- Database (PostgreSQL) ----------
spring.datasource.url=jdbc:postgresql://localhost:5432/rahicabs
spring.datasource.username=rahicabs_user
spring.datasource.password=your_secure_password
spring.datasource.driver-class-name=org.postgresql.Driver

# ---------- JPA ----------
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.properties.hibernate.format_sql=false

# ---------- JWT ----------
# IMPORTANT: Generate a new secret for production!
app.jwt.secret=CHANGE_THIS_TO_A_SECURE_256_BIT_SECRET_KEY_FOR_PRODUCTION
app.jwt.expiration-ms=86400000

# ---------- OTP Configuration ----------
app.otp.expiry-minutes=5
app.otp.max-attempts=3
app.otp.rate-limit-minutes=1

# ---------- Fare Configuration ----------
app.fare.per-km=11.0
app.fare.advance-percentage=15.0

# ---------- Razorpay Configuration ----------
# IMPORTANT: Use LIVE credentials for production!
app.razorpay.key-id=rzp_live_YOUR_KEY_ID
app.razorpay.key-secret=YOUR_LIVE_KEY_SECRET

# ---------- CORS ----------
# Update with your actual frontend domain
app.cors.allowed-origins=https://yourdomain.com,https://www.yourdomain.com

# ---------- Logging ----------
logging.level.root=INFO
logging.level.com.rahicabs=INFO
logging.file.name=logs/rahicabs.log
```

### 2. Generate Secure JWT Secret

```bash
# Generate a 256-bit secret
openssl rand -base64 32
# Use the output as app.jwt.secret
```

### 3. Build Backend

```bash
cd backend

# Clean and build
mvn clean package -DskipTests

# The JAR file will be created at:
# target/rahicabs-backend-1.0.0.jar
```

---

## 🎨 Frontend Configuration

### 1. Create Production Environment

Create `frontend/.env.production`:

```
VITE_API_URL=https://api.yourdomain.com/api
```

### 2. Build Frontend

```bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# Output will be in frontend/dist/
```

---

## 🚢 Deployment Options

## Option 1: Traditional Server Deployment

### Backend Deployment

1. **Copy JAR to server:**
```bash
scp target/rahicabs-backend-1.0.0.jar user@your-server:/opt/rahicabs/
scp src/main/resources/application-prod.properties user@your-server:/opt/rahicabs/
```

2. **Create systemd service:**

Create `/etc/systemd/system/rahicabs-backend.service`:

```ini
[Unit]
Description=RahiCabs Backend Service
After=syslog.target network.target

[Service]
Type=simple
User=rahicabs
WorkingDirectory=/opt/rahicabs
ExecStart=/usr/bin/java -jar \
    -Dspring.profiles.active=prod \
    -Dspring.config.location=file:/opt/rahicabs/application-prod.properties \
    /opt/rahicabs/rahicabs-backend-1.0.0.jar

StandardOutput=journal
StandardError=journal
SyslogIdentifier=rahicabs-backend

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

3. **Start service:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable rahicabs-backend
sudo systemctl start rahicabs-backend
sudo systemctl status rahicabs-backend
```

4. **View logs:**
```bash
sudo journalctl -u rahicabs-backend -f
```

### Frontend Deployment

1. **Using Nginx:**

Install Nginx:
```bash
sudo apt install nginx
```

Create `/etc/nginx/sites-available/rahicabs`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/rahicabs;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8080/api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

2. **Deploy frontend:**
```bash
# Copy build files
sudo mkdir -p /var/www/rahicabs
sudo cp -r frontend/dist/* /var/www/rahicabs/

# Set permissions
sudo chown -R www-data:www-data /var/www/rahicabs

# Enable site
sudo ln -s /etc/nginx/sites-available/rahicabs /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

3. **Setup SSL with Let's Encrypt:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Option 2: Docker Deployment

### 1. Create Dockerfiles

**Backend Dockerfile** (`backend/Dockerfile`):

```dockerfile
FROM openjdk:21-jdk-slim
WORKDIR /app
COPY target/rahicabs-backend-1.0.0.jar app.jar
COPY src/main/resources/application-prod.properties application-prod.properties
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=prod", "app.jar"]
```

**Frontend Dockerfile** (`frontend/Dockerfile`):

```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**Frontend nginx.conf** (`frontend/nginx.conf`):

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:8080/api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 2. Create Docker Compose

**docker-compose.yml**:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    container_name: rahicabs-db
    environment:
      POSTGRES_DB: rahicabs
      POSTGRES_USER: rahicabs_user
      POSTGRES_PASSWORD: your_secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - rahicabs-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: rahicabs-backend
    depends_on:
      - postgres
    ports:
      - "8080:8080"
    environment:
      SPRING_PROFILES_ACTIVE: prod
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/rahicabs
      SPRING_DATASOURCE_USERNAME: rahicabs_user
      SPRING_DATASOURCE_PASSWORD: your_secure_password
    networks:
      - rahicabs-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: rahicabs-frontend
    depends_on:
      - backend
    ports:
      - "80:80"
    networks:
      - rahicabs-network

volumes:
  postgres_data:

networks:
  rahicabs-network:
    driver: bridge
```

### 3. Deploy with Docker

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up -d --build
```

---

## Option 3: Cloud Deployment

### AWS Elastic Beanstalk

1. **Install AWS CLI and EB CLI:**
```bash
pip install awscli awsebcli
```

2. **Initialize EB:**
```bash
cd backend
eb init -p "Corretto 21" rahicabs-backend --region us-east-1
```

3. **Create environment:**
```bash
eb create production --instance-type t3.medium --database.engine postgres
```

4. **Deploy:**
```bash
mvn clean package
eb deploy
```

### Heroku

1. **Install Heroku CLI:**
```bash
npm install -g heroku
```

2. **Login and create app:**
```bash
heroku login
heroku create rahicabs-backend
```

3. **Add PostgreSQL:**
```bash
heroku addons:create heroku-postgresql:mini
```

4. **Deploy:**
```bash
git push heroku main
```

### DigitalOcean App Platform

1. Connect GitHub repository
2. Select Node.js for frontend, Java for backend
3. Add PostgreSQL database
4. Configure environment variables
5. Deploy!

---

## 🔐 Security Checklist

- [ ] Change default JWT secret
- [ ] Use strong database passwords
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Use environment variables for secrets
- [ ] Enable database backups
- [ ] Setup firewall rules
- [ ] Implement rate limiting
- [ ] Enable security headers
- [ ] Regular security updates

---

## 📊 Monitoring & Logs

### Application Logs

**View backend logs:**
```bash
# Systemd
sudo journalctl -u rahicabs-backend -f

# Docker
docker logs -f rahicabs-backend

# File
tail -f /opt/rahicabs/logs/rahicabs.log
```

### Database Monitoring

```bash
# Check connections
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"

# Database size
sudo -u postgres psql -c "SELECT pg_database.datname, pg_size_pretty(pg_database_size(pg_database.datname)) FROM pg_database;"
```

### Health Checks

**Backend health endpoint:**
```bash
curl http://localhost:8080/actuator/health
```

---

## 🔄 Updates & Maintenance

### Backend Updates

```bash
# Pull latest code
git pull origin main

# Build
cd backend
mvn clean package -DskipTests

# Stop service
sudo systemctl stop rahicabs-backend

# Replace JAR
sudo cp target/rahicabs-backend-1.0.0.jar /opt/rahicabs/

# Start service
sudo systemctl start rahicabs-backend

# Verify
sudo systemctl status rahicabs-backend
```

### Frontend Updates

```bash
# Pull latest code
git pull origin main

# Build
cd frontend
npm install
npm run build

# Deploy
sudo cp -r dist/* /var/www/rahicabs/

# Restart nginx
sudo systemctl reload nginx
```

### Database Backups

```bash
# Backup
pg_dump -U rahicabs_user -d rahicabs > backup_$(date +%Y%m%d).sql

# Restore
psql -U rahicabs_user -d rahicabs < backup_20240624.sql
```

---

## 🧪 Production Testing

### 1. Backend API Tests

```bash
# Test OTP endpoint
curl -X POST https://api.yourdomain.com/api/customer/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"9876543210"}'

# Test fare calculation
curl -X POST https://api.yourdomain.com/api/customer/calculate-fare \
  -H "Content-Type: application/json" \
  -d '{
    "pickupLatitude": 22.5726,
    "pickupLongitude": 88.3639,
    "dropLatitude": 22.6568,
    "dropLongitude": 88.4285
  }'
```

### 2. Frontend Tests

1. Open https://yourdomain.com
2. Test booking flow
3. Test customer login
4. Test payment integration
5. Verify all pages load correctly

---

## 🚨 Troubleshooting

### Backend Issues

**Application won't start:**
```bash
# Check Java version
java -version

# Check port availability
sudo lsof -i :8080

# Check logs
sudo journalctl -u rahicabs-backend --no-pager
```

**Database connection issues:**
```bash
# Test database connection
psql -U rahicabs_user -d rahicabs -h localhost

# Check PostgreSQL status
sudo systemctl status postgresql
```

### Frontend Issues

**Build fails:**
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install
```

**API calls failing:**
- Check CORS configuration
- Verify API URL in .env
- Check network/firewall rules

---

## 📞 Support & Maintenance

### Regular Maintenance Tasks

**Daily:**
- Monitor logs for errors
- Check application health
- Review OTP delivery rate

**Weekly:**
- Database backup
- Review payment transactions
- Check disk space

**Monthly:**
- Security updates
- Performance optimization
- Review user feedback

---

## ✅ Post-Deployment Checklist

- [ ] Application accessible via domain
- [ ] HTTPS/SSL working
- [ ] Database connected successfully
- [ ] OTP sending working (if SMS configured)
- [ ] Payment flow working
- [ ] All API endpoints responding
- [ ] Frontend loading correctly
- [ ] Maps integration working
- [ ] Customer login working
- [ ] Booking creation working
- [ ] Email notifications working (if configured)
- [ ] Logs being generated
- [ ] Backups configured
- [ ] Monitoring setup

---

## 🎉 Go Live!

Once all checks pass:

1. ✅ Announce launch
2. ✅ Monitor initial traffic
3. ✅ Be ready for support
4. ✅ Collect user feedback
5. ✅ Plan iterative improvements

---

**Deployment Status:** Ready for Production 🚀

For support: review logs, check configuration, verify all services are running.
