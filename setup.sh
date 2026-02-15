#!/bin/bash

set -e

echo "🚀 WhatsApp Store Bot - Complete Setup"
echo "======================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}This script should not be run as root${NC}"
   exit 1
fi

# Update system
echo -e "${YELLOW}📦 Updating system...${NC}"
sudo apt update && sudo apt upgrade -y

# Install Docker & Docker Compose
echo -e "${YELLOW}🐳 Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
    sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
    sudo apt update
    sudo apt install -y docker-ce docker-compose
    sudo usermod -aG docker $USER
    echo -e "${GREEN}✅ Docker installed${NC}"
else
    echo -e "${GREEN}✅ Docker already installed${NC}"
fi

# Create project directory
PROJECT_DIR="$HOME/whatsapp-store-bot"
echo -e "${YELLOW}📁 Creating project directory: $PROJECT_DIR${NC}"

mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# Create folder structure
echo -e "${YELLOW}📂 Creating folder structure...${NC}"

# Backend structure
mkdir -p backend/src/{config,models,controllers,services,routes,middleware,utils,jobs}
mkdir -p backend/sessions
mkdir -p backend/logs

# Web panel structure  
mkdir -p web-panel/src/{app/{bots,products,orders,users,pricing,settings},components,lib,styles}
mkdir -p web-panel/src/app/bots/\[id\]
mkdir -p web-panel/src/app/products/\[id\]
mkdir -p web-panel/src/app/orders/\[id\]
mkdir -p web-panel/src/app/users/\[id\]

# Database
mkdir -p database

# Nginx
mkdir -p nginx

echo -e "${GREEN}✅ Folder structure created${NC}"

# Create .env file
echo -e "${YELLOW}📝 Creating environment file...${NC}"

if [ ! -f backend/.env ]; then
    cat > backend/.env << 'EOF'
# Server Configuration
PORT=3000
NODE_ENV=production
FRONTEND_URL=http://localhost:3001

# Database PostgreSQL
DB_HOST=postgres
DB_PORT=5432
DB_NAME=whatsapp_store
DB_USER=postgres
DB_PASSWORD=your_secure_password_here

# Redis
REDIS_URL=redis://redis:6379

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# VIP Reseller API Configuration
VIP_RESELLER_API_ID=V5jToQ6L
VIP_RESELLER_API_KEY=2tnwHhRMOi0aIG2QP0KBtaH3QWDbJrFcOPFqcIVa19Rbp2NWZpq4Dr68viILEFt8
VIP_RESELLER_SIGN=a75444fea5bed61bf11868317d6a8c01
VIP_RESELLER_BASE_URL=https://vip-reseller.co.id/api

# Medan Pedia API Configuration
MEDAN_PEDIA_API_ID=14295
MEDAN_PEDIA_API_KEY=abqc1l-13rer4-koj79o-zg1xlj-lmctrk
MEDAN_PEDIA_BASE_URL=https://medanpedia.co.id/api

# Webhook Configuration
WEBHOOK_SECRET=webhook_secret_key_change_this
BASE_URL=https://your-domain.com

# Default Admin
ADMIN_PHONE=6281234567890
ADMIN_PASSWORD=admin123
EOF
    echo -e "${GREEN}✅ .env file created${NC}"
    echo -e "${YELLOW}⚠️  IMPORTANT: Edit backend/.env with your actual values!${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Copy all source files to their respective folders"
echo "2. Edit backend/.env with your actual database password and API keys"
echo "3. Run: docker-compose up -d"
echo "4. Check logs: docker-compose logs -f"
echo ""
echo "Access points:"
echo "- Web Panel: http://your-server-ip:3001"
echo "- API: http://your-server-ip:3000"
echo ""
echo "WhatsApp Bot Setup:"
echo "1. Add bot via web panel"
echo "2. Check terminal logs for QR code: docker-compose logs -f backend"
echo "3. Scan QR code with WhatsApp Business"
echo ""
