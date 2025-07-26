#!/bin/bash

# SSL Certificate Setup for money-lens.gayake.com
set -e

DOMAIN="money-lens.gayake.com"
EMAIL="your-email@domain.com"  # Replace with your email

echo "🔒 Setting up SSL certificate for $DOMAIN..."

# Ensure nginx is stopped
sudo systemctl stop nginx 2>/dev/null || true

# Create webroot directory for Let's Encrypt
sudo mkdir -p /var/www/certbot

# Obtain SSL certificate
echo "📜 Obtaining SSL certificate from Let's Encrypt..."
sudo certbot certonly \
    --webroot \
    -w /var/www/certbot \
    -d $DOMAIN \
    -d www.$DOMAIN \
    --email $EMAIL \
    --agree-tos \
    --non-interactive

# Create SSL directory for nginx
sudo mkdir -p /opt/money-lens/ssl

# Copy certificates to nginx ssl directory
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /opt/money-lens/ssl/$DOMAIN.crt
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /opt/money-lens/ssl/$DOMAIN.key

# Set proper permissions
sudo chown root:root /opt/money-lens/ssl/*
sudo chmod 600 /opt/money-lens/ssl/*

echo "✅ SSL certificate setup completed for $DOMAIN"
echo "Certificate files:"
echo "  - Certificate: /opt/money-lens/ssl/$DOMAIN.crt"
echo "  - Private Key: /opt/money-lens/ssl/$DOMAIN.key"

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
sudo nginx -t

echo "🚀 You can now start your Money Lens application!"
echo "Run: cd /opt/money-lens && sudo systemctl start money-lens"
