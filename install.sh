
set -e

echo "====================================="
echo "   OpenHowl Installation Script"
echo "====================================="

# Check for required commands
for cmd in docker docker-compose npm pip3 ufw; do
  if ! command -v $cmd &> /dev/null; then
    echo "Error: $cmd is not installed. Please install $cmd before proceeding."
    exit 1
  fi
done

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

# Install and build the Next.js frontend (if applicable)
if [ -f package.json ]; then
  echo "Installing Node.js dependencies..."
  npm install

  echo "Building the frontend..."
  npm run build
fi

# Install Python dependencies for the FastAPI backend
if [ -f requirements.txt ]; then
  echo "Installing Python dependencies..."
  pip3 install -r requirements.txt
fi

# Build Docker images (using docker-compose.yml)
echo "Building Docker images..."
docker-compose build

# Configure UFW to allow HTTP and HTTPS traffic
echo "Configuring UFW..."
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload

# Obtain SSL certificates using Certbot via Docker (initial certificate request)
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

echo "====================================="
echo "Installation complete!"
echo "Your OpenHowl application should now be running at:"
echo "https://$PUBLIC_DOMAIN"
echo "Use 'docker-compose down' to stop all services."
echo "====================================="
