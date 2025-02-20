#!/bin/bash
set -e

echo "====================================="
echo "   OpenHowl Installation Script"
echo "====================================="

# Prompt for required configuration values
read -p "Enter your public domain (e.g. example.com): " PUBLIC_DOMAIN
read -p "Enter your Discord Bot Token: " DISCORD_BOT_TOKEN
read -p "Enter the Admin Password for OpenHowl: " ADMIN_PASSWORD
read -p "Enter the User Password for OpenHowl: " USER_PASSWORD
read -p "Enter your email for Certbot notifications: " CERTBOT_EMAIL

# Generate the .env.local file used by both the frontend and backend
cat <<EOF > .env.local
NEXT_PUBLIC_OPENHOWL_API_URL=https://$PUBLIC_DOMAIN
OPENHOWL_ADMIN_PASSWORD=$ADMIN_PASSWORD
OPENHOWL_USER_PASSWORD=$USER_PASSWORD
OPENHOWL_MAX_FILE_SIZE_MB=500
OPENHOWL_FRONTEND_URL=https://$PUBLIC_DOMAIN
DISCORD_BOT_TOKEN=$DISCORD_BOT_TOKEN
EOF

echo ".env.local file created successfully."

# Set up Nginx configuration by replacing the placeholder in the template
if [ -f deploy/nginx.conf.template ]; then
  echo "Setting up Nginx configuration..."
  mkdir -p nginx/conf.d
  sed "s/{{DOMAIN}}/${PUBLIC_DOMAIN}/g" deploy/nginx.conf.template > nginx/conf.d/app.conf
else
  echo "Error: deploy/nginx.conf.template not found."
  exit 1
fi

# Install Node.js dependencies and build the frontend
read -p "Do you want to install Node.js dependencies and build the frontend? (y/n): " INSTALL_NODE
if [[ $INSTALL_NODE =~ ^[Yy]$ ]]; then
  if [ -f package.json ]; then
    echo "Installing Node.js dependencies..."
    npm install

    echo "Building the frontend..."
    npm run build
  else
    echo "No package.json found. Skipping Node.js setup."
  fi
fi

# Install Python dependencies for the FastAPI backend
read -p "Do you want to install Python dependencies for the FastAPI backend? (y/n): " INSTALL_PYTHON
if [[ $INSTALL_PYTHON =~ ^[Yy]$ ]]; then
  if [ -f requirements.txt ]; then
    echo "Installing Python dependencies..."
    pip3 install -r requirements.txt
  else
    echo "No requirements.txt found. Skipping Python dependencies."
  fi
fi

# At this point, all non-Docker-related setup is complete.
# Ask if the user wants to build and run Docker containers (and optionally configure UFW)
read -p "Do you want to build and run Docker containers now? (y/n): " INSTALL_DOCKER
if [[ $INSTALL_DOCKER =~ ^[Yy]$ ]]; then
  # Check for required Docker commands
  for cmd in docker docker-compose; do
    if ! command -v $cmd &> /dev/null; then
      echo "Error: $cmd is not installed. Please install $cmd before proceeding with Docker containers."
      exit 1
    fi
  done

  echo "Building Docker images..."
  docker-compose build

  # Optionally configure UFW to allow HTTP and HTTPS traffic
  read -p "Do you want to configure UFW to allow HTTP and HTTPS traffic? (y/n): " CONFIG_UFW
  if [[ $CONFIG_UFW =~ ^[Yy]$ ]]; then
    echo "Configuring UFW..."
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw reload
  fi

  #  SSL certificates using Certbot via Docker (initial certificate request)
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

  # Start all services using Docker Compose
  echo "Starting Docker containers..."
  docker-compose up -d
else
  echo "Docker containers installation skipped. You can run them later manually."
fi

echo "====================================="
echo "Installation complete!"
echo "Your OpenHowl application should now be running (if Docker was installed) at:"
echo "https://$PUBLIC_DOMAIN"
echo "Use 'docker-compose down' to stop all services if Docker was installed."
echo "====================================="
