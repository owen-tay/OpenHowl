#!/bin/bash
set -e 

GREEN="\e[32m"
RESET="\e[0m"

echo " OpenHowl Installation Script"
echo "========================="

# Prompt for required configuration values
read -p "Enter your public domain or IP (e.g., example.com or 111.111.1.1): " PUBLIC_DOMAIN
read -p "Enter your Discord Bot Token: " DISCORD_BOT_TOKEN
read -p "Enter the Admin Password for OpenHowl: " ADMIN_PASSWORD
read -p "Enter the User Password for OpenHowl: " USER_PASSWORD
read -p "Enter your email for Certbot notifications (leave blank if using an IP): " CERTBOT_EMAIL

# Ask if the user wants to use Docker
read -p "Use Docker for deployment? (y/n, default: n): " USE_DOCKER
USE_DOCKER=${USE_DOCKER:-n}

if [[ $USE_DOCKER =~ ^[Yy]$ ]]; then
  # Check if Docker is installed
  if ! command -v docker &> /dev/null || ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker and Docker Compose..."
    sudo apt update
    sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
    sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
    sudo apt update
    sudo apt install -y docker-ce docker-compose
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker $USER
    echo "Docker installed. You may need to log out and back in for group changes to take effect."
  fi
else
  # Check if Nginx is installed
  if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    sudo apt update
    sudo apt install -y nginx
  fi
  # Disable default site
  sudo rm -f /etc/nginx/sites-enabled/default
  # Ensure config directories exist
  sudo mkdir -p /etc/nginx/conf.d
fi

# Ask if the user wants to perform SSL setup
echo -e "${GREEN}SSL Setup: This step will attempt to create SSL certificates for your site.${RESET}"
echo -e "${GREEN}If you already have your own SSL certificates, you can choose to skip this step.${RESET}"
read -p "Proceed with SSL setup? (y to run, n to skip): " RUN_SSL_SETUP

if [[ $RUN_SSL_SETUP =~ ^[Yy]$ ]]; then
  echo -e "${GREEN}For an HTTPS connection, this script will attempt to create SSL certificates.${RESET}"
  echo -e "${GREEN}If using a domain (e.g., www.example.com), Certbot will be used.${RESET}"
  echo -e "${GREEN}If using an IP, a self-signed certificate will be created.${RESET}"
  read -p "Use Certbot for SSL? (y if you have a domain, n if using an IP): " USE_CERTBOT

  if [[ $USE_CERTBOT =~ ^[Yy]$ ]]; then
    echo "Setting up Let's Encrypt SSL..."
    sudo apt update && sudo apt install -y certbot python3-certbot-nginx
    sudo certbot certonly --standalone --non-interactive --agree-tos --email "$CERTBOT_EMAIL" -d "$PUBLIC_DOMAIN" -d "www.$PUBLIC_DOMAIN"
    SSL_CERT_PATH="/etc/letsencrypt/live/$PUBLIC_DOMAIN/fullchain.pem"
    SSL_KEY_PATH="/etc/letsencrypt/live/$PUBLIC_DOMAIN/privkey.pem"
    echo "SSL certificate issued."
  else
    echo "Generating a self-signed SSL certificate..."
    sudo mkdir -p /etc/letsencrypt/live/selfsigned/
    sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout /etc/letsencrypt/live/selfsigned/privkey.pem \
      -out /etc/letsencrypt/live/selfsigned/fullchain.pem \
      -subj "/CN=$PUBLIC_DOMAIN"
    SSL_CERT_PATH="/etc/letsencrypt/live/selfsigned/fullchain.pem"
    SSL_KEY_PATH="/etc/letsencrypt/live/selfsigned/privkey.pem"
    echo -e "${GREEN}Self-signed certificate created. Browsers will show a warning when visiting the site.${RESET}"
  fi
else
  echo "Skipping SSL certificate generation. Please provide paths to your existing SSL certificate and key."
  read -p "Enter the path to your SSL certificate (fullchain.pem): " SSL_CERT_PATH
  read -p "Enter the path to your SSL key (privkey.pem): " SSL_KEY_PATH
fi

# Generate the .env.local file for the application configuration
cat <<EOF > .env.local
NEXT_PUBLIC_OPENHOWL_API_URL=https://$PUBLIC_DOMAIN
OPENHOWL_ADMIN_PASSWORD=$ADMIN_PASSWORD
OPENHOWL_USER_PASSWORD=$USER_PASSWORD
OPENHOWL_MAX_FILE_SIZE_MB=500
OPENHOWL_FRONTEND_URL=https://$PUBLIC_DOMAIN
DISCORD_BOT_TOKEN=$DISCORD_BOT_TOKEN
EOF
echo ".env.local created."

if [[ $USE_DOCKER =~ ^[Yy]$ ]]; then
  # Create docker-compose.yml if not exists
  if [ ! -f docker-compose.yml ]; then
    echo "Creating docker-compose.yml..."
    cat << EOF > docker-compose.yml
version: '3'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    restart: always
    ports:
      - "3000:3000"
    env_file:
      - .env.local
    depends_on:
      - api

  api:
    build:
      context: .
      dockerfile: Dockerfile.api
    restart: always
    ports:
      - "8000:8000"
    env_file:
      - .env.local

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ${SSL_CERT_PATH}:${SSL_CERT_PATH}
      - ${SSL_KEY_PATH}:${SSL_KEY_PATH}
      - /var/www/certbot:/var/www/certbot
    depends_on:
      - frontend
      - api
EOF
    echo "docker-compose.yml created."
  fi

  # Create Dockerfile.frontend if not exists
  if [ ! -f Dockerfile.frontend ]; then
    echo "Creating Dockerfile.frontend..."
    cat << 'EOF' > Dockerfile.frontend
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
EOF
    echo "Dockerfile.frontend created."
  fi

  # Create Dockerfile.api if not exists
  if [ ! -f Dockerfile.api ]; then
    echo "Creating Dockerfile.api..."
    cat << 'EOF' > Dockerfile.api
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
EOF
    echo "Dockerfile.api created."
  fi
fi

# Detect the correct Nginx user for the system (default to www-data)
if [ -f /etc/nginx/nginx.conf ]; then
  NGINX_USER=$(grep -E "^user" /etc/nginx/nginx.conf | awk '{print $2}' | tr -d ';')
  if [ -z "$NGINX_USER" ]; then
    NGINX_USER="www-data"
  fi
else
  NGINX_USER="www-data"
fi

# Automatically create custom nginx.conf if missing and set the correct user
if [ ! -f nginx/nginx.conf ]; then
  echo "Creating custom nginx.conf..."
  mkdir -p nginx
  cat << EOF > nginx/nginx.conf
user $NGINX_USER;
worker_processes auto;

error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                      '\$status \$body_bytes_sent "\$http_referer" '
                      '"\$http_user_agent" "\$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile        on;
    keepalive_timeout 65;

    # Prevent nginx from adding port to redirects
    port_in_redirect off;
    
    # Support larger uploads
    client_max_body_size 500M;

    # Include all custom server block configurations
    include /etc/nginx/conf.d/*.conf;
}
EOF
  echo "Custom nginx.conf created."
fi


# Set up Nginx configuration: process the template and output to nginx/conf.d/app.conf
if [ -f deploy/nginx.conf.template ]; then
  echo "Configuring Nginx..."
  mkdir -p nginx/conf.d
  sed "s|{{DOMAIN}}|$PUBLIC_DOMAIN|g; s|{{SSL_CERT}}|$SSL_CERT_PATH|g; s|{{SSL_KEY}}|$SSL_KEY_PATH|g" deploy/nginx.conf.template > nginx/conf.d/app.conf
else
  echo "Error: Nginx config template not found."
  exit 1
fi

if [[ ! $USE_DOCKER =~ ^[Yy]$ ]]; then
  # Create Python virtual environment and install dependencies
  echo "Setting up Python environment..."
  sudo apt update && sudo apt install -y python3-pip python3-venv
  
  if [ -d venv ] && [ -f venv/bin/activate ]; then
    echo "Virtual environment already exists."
  else
    echo "Creating virtual environment..."
    python3 -m venv venv
  fi
  
  echo "Activating virtual environment..."
  source venv/bin/activate
  
  if [ -f requirements.txt ]; then
    echo "Installing Python dependencies from requirements.txt..."
    pip3 install -r requirements.txt
    echo "Python dependencies installed successfully."
  else
    echo "Warning: requirements.txt not found. Installing basic dependencies..."
    pip3 install fastapi uvicorn
  fi

  # Install Node.js and dependencies
  echo "Setting up Node.js environment..."
  if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
    sudo apt install -y nodejs
  fi
  
  if [ -f package.json ]; then
    echo "Installing Node.js dependencies..."
    npm install
    echo "Building frontend..."
    npm run build
  else
    echo "Warning: No package.json found. Cannot set up frontend."
  fi

  # Create systemd service for the Next.js frontend
  echo "Creating systemd service for frontend..."
  cat > /tmp/openhowl-frontend.service << EOF
[Unit]
Description=OpenHowl Next.js Frontend
After=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/npm start
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

  # Create systemd service for the API
  echo "Creating systemd service for API..."
  cat > /tmp/openhowl-api.service << EOF
[Unit]
Description=OpenHowl API Service
After=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$(pwd)
ExecStart=$(pwd)/venv/bin/uvicorn app:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
EOF

  # Install and start services
  sudo mv /tmp/openhowl-frontend.service /etc/systemd/system/
  sudo mv /tmp/openhowl-api.service /etc/systemd/system/
  sudo systemctl daemon-reload
  sudo systemctl enable openhowl-frontend.service openhowl-api.service
  
  # Copy Nginx configuration to system location
  sudo cp -r nginx/conf.d/app.conf /etc/nginx/conf.d/
  sudo cp nginx/nginx.conf /etc/nginx/
  
  # Create Nginx webroot for certbot challenges
  sudo mkdir -p /var/www/certbot

  # Detect the correct Nginx user for the system
if [ -f /etc/nginx/nginx.conf ]; then
  NGINX_USER=$(grep -E "^user" /etc/nginx/nginx.conf | awk '{print $2}' | tr -d ';')
  if [ -z "$NGINX_USER" ]; then
    # Default to www-data if not found
    NGINX_USER="www-data"
  fi
else
  # Most Debian/Ubuntu systems use www-data
  NGINX_USER="www-data"
fi

# Then update your nginx.conf creation to use this variable
cat << EOF > nginx/nginx.conf
user  $NGINX_USER;
worker_processes  auto;
...
EOF
  
  # Verify Nginx configuration
  if sudo nginx -t; then
    echo "Nginx configuration is valid."
    sudo systemctl restart nginx
  else
    echo "Error in Nginx configuration. Please check syntax."
    exit 1
  fi
  
  # Start services
  echo "Starting services..."
  sudo systemctl start openhowl-frontend.service openhowl-api.service
else
  # Start Docker services
  echo "Starting Docker services..."
  docker-compose up -d
fi

echo "====================================="
echo -e "${GREEN}Installation complete!${RESET}"
echo -e "${GREEN}Your OpenHowl application should be running at: https://$PUBLIC_DOMAIN${RESET}"

# Verify services are running
echo "Verifying services..."
if [[ ! $USE_DOCKER =~ ^[Yy]$ ]]; then
  if systemctl is-active --quiet openhowl-frontend.service; then
    echo "✅ Frontend service is running"
  else
    echo "❌ Frontend service failed to start. Check logs with: journalctl -u openhowl-frontend.service"
  fi

  if systemctl is-active --quiet openhowl-api.service; then
    echo "✅ API service is running"
  else
    echo "❌ API service failed to start. Check logs with: journalctl -u openhowl-api.service"
  fi

  if systemctl is-active --quiet nginx; then
    echo "✅ Nginx service is running"
  else
    echo "❌ Nginx service failed to start. Check logs with: journalctl -u nginx"
  fi
  
  echo -e "${GREEN}To view frontend logs: journalctl -u openhowl-frontend.service${RESET}"
  echo -e "${GREEN}To view API logs: journalctl -u openhowl-api.service${RESET}"
  echo -e "${GREEN}To restart services: sudo systemctl restart openhowl-frontend.service openhowl-api.service${RESET}"
else
  # Check Docker containers
  if docker ps | grep -q openhowl_frontend; then
    echo "✅ Frontend container is running"
  else
    echo "❌ Frontend container failed to start. Check logs with: docker-compose logs frontend"
  fi
  
  if docker ps | grep -q openhowl_api; then
    echo "✅ API container is running"
  else
    echo "❌ API container failed to start. Check logs with: docker-compose logs api"
  fi
  
  if docker ps | grep -q openhowl_nginx; then
    echo "✅ Nginx container is running"
  else
    echo "❌ Nginx container failed to start. Check logs with: docker-compose logs nginx"
  fi
  
  echo -e "${GREEN}To view logs: docker-compose logs -f${RESET}"
  echo -e "${GREEN}To restart services: docker-compose restart${RESET}"
fi

echo "====================================="