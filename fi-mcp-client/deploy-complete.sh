#!/bin/bash

# Money Lens Complete Deployment Script
set -e

echo "🚀 Starting complete Money Lens deployment..."

# Configuration
VM_NAME="money-lens-vm"
ZONE="us-central1-a"
DOMAIN="money-lens.gayake.com"
PROJECT_ID=$(gcloud config get-value project)

echo "Using project: $PROJECT_ID"

# Step 1: Create VM if it doesn't exist
echo "1️⃣ Creating Google Cloud VM..."
if ! gcloud compute instances describe $VM_NAME --zone=$ZONE > /dev/null 2>&1; then
    gcloud compute instances create $VM_NAME \
        --zone=$ZONE \
        --machine-type=e2-medium \
        --image-family=ubuntu-2004-lts \
        --image-project=ubuntu-os-cloud \
        --boot-disk-size=30GB \
        --boot-disk-type=pd-standard \
        --tags=http-server,https-server \
        --scopes=https://www.googleapis.com/auth/cloud-platform
    
    echo "✅ VM created successfully"
else
    echo "✅ VM already exists"
fi

# Step 2: Setup firewall rules
echo "2️⃣ Setting up firewall rules..."
gcloud compute firewall-rules create allow-money-lens-http \
    --allow tcp:80 \
    --source-ranges 0.0.0.0/0 \
    --target-tags http-server \
    --description "Allow HTTP for Money Lens" \
    2>/dev/null || echo "HTTP rule already exists"

gcloud compute firewall-rules create allow-money-lens-https \
    --allow tcp:443 \
    --source-ranges 0.0.0.0/0 \
    --target-tags https-server \
    --description "Allow HTTPS for Money Lens" \
    2>/dev/null || echo "HTTPS rule already exists"

gcloud compute firewall-rules create allow-money-lens-app \
    --allow tcp:8001 \
    --source-ranges 0.0.0.0/0 \
    --target-tags http-server \
    --description "Allow Money Lens application port" \
    2>/dev/null || echo "App port rule already exists"

# Step 3: Get VM external IP
echo "3️⃣ Getting VM external IP..."
EXTERNAL_IP=$(gcloud compute instances describe $VM_NAME \
    --zone=$ZONE \
    --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

echo "📍 VM External IP: $EXTERNAL_IP"

# Step 4: Copy files to VM
echo "4️⃣ Copying application files to VM..."

# Wait for VM to be ready
echo "⏳ Waiting for VM to be ready..."
gcloud compute ssh $VM_NAME --zone=$ZONE --command="echo 'VM is ready'" --ssh-flag="-o ConnectTimeout=60"

# Copy deployment files
gcloud compute scp deploy-setup.sh $VM_NAME:~/ --zone=$ZONE
gcloud compute scp ssl-setup.sh $VM_NAME:~/ --zone=$ZONE

# Step 5: Run initial setup
echo "5️⃣ Running initial setup on VM..."
gcloud compute ssh $VM_NAME --zone=$ZONE --command="
    chmod +x deploy-setup.sh ssl-setup.sh
    ./deploy-setup.sh
"

# Step 6: Copy application code
echo "6️⃣ Copying application code..."
gcloud compute ssh $VM_NAME --zone=$ZONE --command="sudo mkdir -p /opt/money-lens"

# Copy all application files
tar -czf money-lens-app.tar.gz \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='.git' \
    --exclude='venv' \
    --exclude='node_modules' \
    --exclude='deploy-*.sh' \
    --exclude='ssl-setup.sh' \
    .

gcloud compute scp money-lens-app.tar.gz $VM_NAME:/tmp/ --zone=$ZONE

gcloud compute ssh $VM_NAME --zone=$ZONE --command="
    cd /tmp
    sudo tar -xzf money-lens-app.tar.gz -C /opt/money-lens/
    sudo chown -R \$USER:\$USER /opt/money-lens/
    rm money-lens-app.tar.gz
"

# Clean up local tar file
rm money-lens-app.tar.gz

echo "✅ Deployment completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Set up your domain DNS:"
echo "   - Create an A record for $DOMAIN pointing to $EXTERNAL_IP"
echo "   - Create an A record for www.$DOMAIN pointing to $EXTERNAL_IP"
echo ""
echo "2. SSH into your VM and complete the setup:"
echo "   gcloud compute ssh $VM_NAME --zone=$ZONE"
echo ""
echo "3. On the VM, run these commands:"
echo "   cd /opt/money-lens"
echo "   # Edit .env file with your API keys"
echo "   vim .env"
echo "   # Setup SSL (after DNS is configured)"
echo "   ./ssl-setup.sh"
echo "   # Start the application"
echo "   sudo systemctl start money-lens"
echo ""
echo "4. Monitor your application:"
echo "   sudo systemctl status money-lens"
echo "   docker-compose logs -f"
echo ""
echo "🌐 Your Money Lens application will be available at:"
echo "   https://$DOMAIN"
