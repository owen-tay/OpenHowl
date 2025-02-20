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
    sudo certbot certonly --nginx --non-interactive --agree-tos --email "$CERTBOT_EMAIL" -d "$PUBLIC_DOMAIN" -d "www.$PUBLIC_DOMAIN"
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

# Automatically create custom nginx.conf if missing
if [ ! -f nginx/nginx.conf ]; then
  echo "Creating custom nginx.conf..."
  mkdir -p nginx
  cat << 'EOF' > nginx/nginx.conf
user  nginx;
worker_processes  auto;

error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;

events {
    worker_connections  1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile        on;
    keepalive_timeout  65;

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

# Create Python virtual environment and install dependencies (if desired)
read -p "Create a Python virtual environment and install dependencies from requirements.txt? (y/n): " CREATE_VENV
if [[ $CREATE_VENV =~ ^[Yy]$ ]]; then
  if ! python3 -m venv --help > /dev/null 2>&1; then
    echo "Error: python3-venv is not installed."
    exit 1
  fi
  if [ -d venv ] && [ -f venv/bin/activate ]; then
    echo "Virtual environment already exists."
  else
    echo "Creating virtual environment..."
    rm -rf venv
    python3 -m venv venv
  fi
  echo "Activating virtual environment..."
  source venv/bin/activate
  if [ -f requirements.txt ]; then
    echo "Installing Python dependencies from requirements.txt..."
    pip3 install -r requirements.txt
    echo "Python dependencies installed successfully."
  else
    echo "Warning: requirements.txt not found. Skipping Python dependencies installation."
  fi
else
  echo "Skipping virtual environment."
fi

# Install Node.js dependencies and build the frontend (if desired)
read -p "Install Node.js dependencies and build frontend? (y/n): " INSTALL_NODE
if [[ $INSTALL_NODE =~ ^[Yy]$ ]]; then
  if [ -f package.json ]; then
    echo "Installing Node.js dependencies..."
    npm install
    echo "Building frontend..."
    npm run build
  else
    echo "No package.json found. Skipping frontend setup."
  fi
fi

echo "====================================="
echo -e "${GREEN}Installation complete!${RESET}"
echo -e "${GREEN}Your OpenHowl application should be running at: https://$PUBLIC_DOMAIN${RESET}"
echo "====================================="
