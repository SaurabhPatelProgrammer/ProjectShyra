# Production Deployment Guide

This guide covers deploying the SHYRA Nervous System to a production environment.

## 📋 Pre-Deployment Checklist

- [ ] Set strong `JWT_SECRET` in production `.env`
- [ ] Configure proper `CORS_ORIGIN` (not `*`)
- [ ] Set `NODE_ENV=production`
- [ ] Set up SSL/TLS certificates
- [ ] Configure reverse proxy (Nginx/Apache)
- [ ] Set up process manager (PM2)
- [ ] Configure logging and monitoring
- [ ] Set up database/Redis for sessions (optional)
- [ ] Configure firewall rules
- [ ] Set up automated backups

---

## 🚀 Deployment Steps

### 1. Server Preparation

**Update system:**
```bash
sudo apt update && sudo apt upgrade -y
```

**Install Node.js (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

**Install PM2 globally:**
```bash
sudo npm install -g pm2
```

---

### 2. Application Setup

**Clone/Upload your code:**
```bash
cd /var/www
git clone <your-repo-url> shyra-server
cd shyra-server/server
```

**Install dependencies:**
```bash
npm install --production
```

**Create production environment file:**
```bash
cp .env.example .env
nano .env
```

**Production `.env` configuration:**
```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# IMPORTANT: Use strong random secret
JWT_SECRET=<generate-with-openssl-rand-base64-32>
JWT_EXPIRES_IN=24h

# Python Brain URL (could be local or remote)
BRAIN_API_URL=http://localhost:8000
BRAIN_API_TIMEOUT=30000

# CORS - Set to your frontend domain
CORS_ORIGIN=https://yourdomain.com

LOG_LEVEL=info
```

**Generate strong JWT secret:**
```bash
openssl rand -base64 32
```

---

### 3. PM2 Process Manager

**Create PM2 ecosystem file:**
```bash
nano ecosystem.config.js
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'shyra-nervous-system',
    script: './index.js',
    instances: 2, // Run 2 instances for load balancing
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '500M',
    autorestart: true,
    watch: false,
    merge_logs: true
  }]
};
```

**Start with PM2:**
```bash
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**PM2 Commands:**
```bash
pm2 status              # Check status
pm2 logs               # View logs
pm2 restart shyra-nervous-system
pm2 stop shyra-nervous-system
pm2 delete shyra-nervous-system
pm2 monit              # Monitor resources
```

---

### 4. Nginx Reverse Proxy

**Install Nginx:**
```bash
sudo apt install nginx -y
```

**Create Nginx configuration:**
```bash
sudo nano /etc/nginx/sites-available/shyra
```

**Nginx config:**
```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Logging
    access_log /var/log/nginx/shyra-access.log;
    error_log /var/log/nginx/shyra-error.log;

    # Proxy settings
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # WebSocket support for Socket.IO
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Headers
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Rate limiting (optional)
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;
}
```

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/shyra /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### 5. SSL/TLS with Let's Encrypt

**Install Certbot:**
```bash
sudo apt install certbot python3-certbot-nginx -y
```

**Obtain SSL certificate:**
```bash
sudo certbot --nginx -d api.yourdomain.com
```

**Auto-renewal:**
```bash
sudo certbot renew --dry-run
```

Certbot automatically sets up renewal cron job.

---

### 6. Firewall Configuration

**Configure UFW:**
```bash
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable
sudo ufw status
```

---

### 7. Monitoring and Logging

**PM2 Monitoring:**
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

**Custom log rotation:**
```bash
sudo nano /etc/logrotate.d/shyra
```

```
/var/www/shyra-server/server/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

### 8. Redis for Session Storage (Optional)

**Install Redis:**
```bash
sudo apt install redis-server -y
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

**Update code to use Redis:**

Install Redis client:
```bash
npm install redis
```

Modify `services/session.service.js` to use Redis instead of in-memory Map.

---

### 9. Security Hardening

**1. Use environment variables (never commit `.env`):**
```bash
chmod 600 .env
```

**2. Disable root login:**
```bash
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart sshd
```

**3. Install Fail2Ban:**
```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
```

**4. Keep system updated:**
```bash
sudo apt update && sudo apt upgrade -y
```

**5. Use dedicated user:**
```bash
sudo useradd -m -s /bin/bash shyra
sudo chown -R shyra:shyra /var/www/shyra-server
```

---

### 10. Health Checks and Uptime Monitoring

**Set up health check endpoint monitoring:**
- Use services like UptimeRobot, Pingdom, or StatusCake
- Monitor: `https://api.yourdomain.com/health`
- Alert on downtime

**PM2 Plus (optional):**
```bash
pm2 plus
```
Provides real-time monitoring dashboard.

---

## 🔧 Maintenance

**Update application:**
```bash
cd /var/www/shyra-server/server
git pull
npm install --production
pm2 restart shyra-nervous-system
```

**View logs:**
```bash
pm2 logs shyra-nervous-system
tail -f logs/out.log
tail -f logs/err.log
```

**Backup configuration:**
```bash
tar -czf shyra-backup-$(date +%Y%m%d).tar.gz .env ecosystem.config.js
```

---

## 📊 Performance Optimization

**1. Enable Node.js clustering (already in ecosystem.config.js)**
```javascript
instances: 2,
exec_mode: 'cluster'
```

**2. Use Redis for session storage** (for multi-instance deployments)

**3. Enable Nginx caching** for static responses

**4. Use CDN** for static assets

**5. Enable gzip compression** in Nginx:
```nginx
gzip on;
gzip_vary on;
gzip_types text/plain application/json;
```

---

## 🚨 Troubleshooting

**Server not starting:**
```bash
pm2 logs
# Check for errors in logs
```

**Socket.IO not connecting:**
- Check Nginx WebSocket configuration
- Verify CORS settings
- Check firewall rules

**High memory usage:**
```bash
pm2 monit
# Adjust max_memory_restart in ecosystem.config.js
```

**Brain API not reachable:**
- Check `BRAIN_API_URL` in `.env`
- Ensure Python Brain is running
- Check network/firewall between services

---

## 📞 Support

For production issues:
1. Check logs: `pm2 logs`
2. Check system resources: `pm2 monit`
3. Check Nginx logs: `/var/log/nginx/`
4. Verify environment variables: `pm2 env 0`

---

**Production deployment complete! 🎉**
