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
  echo -e "${GREEN}If using an IP (e.g., self-hosting or VPS), a self-signed certificate will be created.${RESET}"
  read -p "Use Certbot for SSL? (Yes if you have a domain, No if your server is using an IP) (y/n): " USE_CERTBOT

  if [[ $USE_CERTBOT =~ ^[Yy]$ ]]; then
    echo "Setting up Let's Encrypt SSL..."
    sudo apt update && sudo apt install -y certbot python3-certbot-nginx
    sudo certbot certonly --nginx --non-interactive --agree-tos --email $CERTBOT_EMAIL -d $PUBLIC_DOMAIN -d www.$PUBLIC_DOMAIN

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

# Generate the .env.local file used by both the frontend and backend
cat <<EOF > .env.local
NEXT_PUBLIC_OPENHOWL_API_URL=https://$PUBLIC_DOMAIN
OPENHOWL_ADMIN_PASSWORD=$ADMIN_PASSWORD
OPENHOWL_USER_PASSWORD=$USER_PASSWORD
OPENHOWL_MAX_FILE_SIZE_MB=500
OPENHOWL_FRONTEND_URL=https://$PUBLIC_DOMAIN
DISCORD_BOT_TOKEN=$DISCORD_BOT_TOKEN
EOF

echo ".env.local created."

# Set up Nginx configuration
if [ -f deploy/nginx.conf.template ]; then
  echo "Configuring Nginx..."
  mkdir -p nginx/conf.d
  sed "s|{{DOMAIN}}|$PUBLIC_DOMAIN|g; s|{{SSL_CERT}}|$SSL_CERT_PATH|g; s|{{SSL_KEY}}|$SSL_KEY_PATH|g" deploy/nginx.conf.template > nginx/conf.d/app.conf
else
  echo "Error: Nginx config template not found."
  exit 1
fi

# Restart Nginx
echo "Restarting Nginx..."
sudo nginx -t && sudo systemctl restart nginx

# Create Python virtual environment
read -p "Create a Python virtual environment? (y/n): " CREATE_VENV
if [[ $CREATE_VENV =~ ^[Yy]$ ]]; then
  if ! python3 -m venv --help > /dev/null 2>&1; then
    echo "Error: python3-venv is not installed."
    exit 1
  fi

  if [ ! -d venv ] || [ ! -f venv/bin/activate ]; then
    echo "Creating virtual environment..."
    rm -rf venv
    python3 -m venv venv
  else
    echo "Virtual environment already exists."
  fi

  echo "Activating virtual environment..."
  source venv/bin/activate
else
  echo "Skipping virtual environment."
fi

# Install Node.js dependencies and build the frontend
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

# Build and run Docker containers
read -p "Build and run Docker containers? (y/n): " INSTALL_DOCKER
if [[ $INSTALL_DOCKER =~ ^[Yy]$ ]]; then
  DOCKER_AVAILABLE=1
  for cmd in docker docker-compose; do
    if ! command -v $cmd &> /dev/null; then
      echo "Warning: $cmd is not installed. Skipping Docker setup."
      DOCKER_AVAILABLE=0
      break
    fi
  done

  if [[ $DOCKER_AVAILABLE -eq 1 ]]; then
    echo "Building Docker images..."
    docker-compose build

    read -p "Configure UFW to allow HTTP/HTTPS traffic? (y/n): " CONFIG_UFW
    if [[ $CONFIG_UFW =~ ^[Yy]$ ]]; then
      if command -v ufw &> /dev/null; then
        echo "Configuring UFW..."
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        sudo ufw reload
      else
        echo "Warning: ufw is not installed. Skipping UFW configuration."
      fi
    fi

    if [[ $USE_CERTBOT =~ ^[Yy]$ ]]; then
      echo "Obtaining SSL certificates with Certbot..."
      docker run -it --rm \
        -v "$(pwd)/nginx/certbot/conf:/etc/letsencrypt" \
        -v "$(pwd)/nginx/certbot/www:/var/www/certbot" \
        certbot/certbot certonly --webroot \
        --webroot-path=/var/www/certbot \
        --email $CERTBOT_EMAIL \
        --agree-tos \
        --no-eff-email \
        -d $PUBLIC_DOMAIN -d www.$PUBLIC_DOMAIN
    fi

    echo "Starting Docker containers..."
    docker-compose up -d
  fi
else
  echo "Skipping Docker setup."
fi

# Start Next.js frontend
read -p "Start Next.js frontend now? (npm run start) (y/n): " START_FRONTEND
if [[ $START_FRONTEND =~ ^[Yy]$ ]]; then
  if [ -f package.json ]; then
    echo "Starting Next.js..."
    npm run start &
    echo "Frontend running. Check your domain or IP."
  else
    echo "No package.json found. Skipping frontend start."
  fi
else
  echo "Skipping frontend start."
fi

echo "====================================="
echo -e "${GREEN} Installation complete! ${RESET}"
echo -e "${GREEN}Your OpenHowl application is running at: https://$PUBLIC_DOMAIN ${RESET}"
if [[ $RUN_SSL_SETUP =~ ^[Yy] && $USE_CERTBOT =~ ^[Nn] ]]; then
  echo -e "${GREEN}Self-signed cert used. Expect a browser warning when visiting the site.${RESET}"
fi
echo "Use 'docker-compose down' to stop services."
echo "====================================="
