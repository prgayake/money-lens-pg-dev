#!/bin/bash

# Money Lens Deployment Script for Google Cloud VM
# This script sets up the complete environment for your financial application

set -e

echo "🚀 Starting Money Lens deployment on Google Cloud VM..."

# Update system
echo "📦 Updating system packages..."
sudo apt-get update -y
sudo apt-get upgrade -y

# Install required packages
echo "🔧 Installing required packages..."
sudo apt-get install -y \
    curl \
    wget \
    git \
    nginx \
    ufw \
    certbot \
    python3-certbot-nginx \
    htop \
    vim \
    unzip

# Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
echo "📦 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Setup application directory
echo "📁 Setting up application directory..."
sudo mkdir -p /opt/money-lens
sudo chown $USER:$USER /opt/money-lens
cd /opt/money-lens

# Create directory structure
mkdir -p {logs,ssl,nginx,backups}

# Setup firewall
echo "🔥 Configuring firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8001/tcp
sudo ufw --force enable

# Setup log rotation
echo "📝 Setting up log rotation..."
sudo tee /etc/logrotate.d/money-lens << EOF
/opt/money-lens/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
}
EOF

# Create systemd service for auto-startup
echo "⚙️ Creating systemd service..."
sudo tee /etc/systemd/system/money-lens.service << EOF
[Unit]
Description=Money Lens Financial Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/money-lens
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

# Enable the service
sudo systemctl daemon-reload
sudo systemctl enable money-lens.service

# Setup monitoring script
echo "📊 Setting up monitoring..."
tee /opt/money-lens/monitor.sh << 'EOF'
#!/bin/bash

# Money Lens Health Monitoring Script

LOG_FILE="/opt/money-lens/logs/monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Function to log messages
log_message() {
    echo "[$DATE] $1" >> $LOG_FILE
}

# Check if containers are running
check_containers() {
    if ! docker-compose ps | grep -q "Up"; then
        log_message "ERROR: Money Lens containers are not running"
        docker-compose up -d
        log_message "INFO: Attempted to restart containers"
    else
        log_message "INFO: Money Lens containers are healthy"
    fi
}

# Check application health
check_app_health() {
    if ! curl -f http://localhost:8001/health > /dev/null 2>&1; then
        log_message "ERROR: Money Lens application health check failed"
        docker-compose restart money-lens-app
        log_message "INFO: Restarted Money Lens application"
    else
        log_message "INFO: Money Lens application is healthy"
    fi
}

# Check disk space
check_disk_space() {
    DISK_USAGE=$(df /opt/money-lens | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ $DISK_USAGE -gt 85 ]; then
        log_message "WARNING: Disk usage is ${DISK_USAGE}%"
    fi
}

# Main monitoring
log_message "Starting health check"
check_containers
check_app_health
check_disk_space
log_message "Health check completed"
EOF

chmod +x /opt/money-lens/monitor.sh

# Setup cron job for monitoring
echo "⏰ Setting up monitoring cron job..."
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/money-lens/monitor.sh") | crontab -

# Setup SSL certificate renewal
echo "🔒 Setting up SSL certificate auto-renewal..."
(crontab -l 2>/dev/null; echo "0 2 * * 1 certbot renew --nginx --quiet && docker-compose restart nginx") | crontab -

echo "✅ Money Lens base setup completed!"
echo "Next steps:"
echo "1. Copy your application code to /opt/money-lens/"
echo "2. Configure your .env file with API keys"
echo "3. Setup your domain DNS to point to this VM"
echo "4. Run the SSL setup script"
echo "5. Start the application with: sudo systemctl start money-lens"
EOF
