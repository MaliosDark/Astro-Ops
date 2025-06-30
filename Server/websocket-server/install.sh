#!/bin/bash
# Installation script for Bonk Raiders WebSocket Server

# Set variables
INSTALL_DIR="/var/www/webrtc.bonkraiders.com"
NGINX_CONF="/etc/nginx/conf.d/webrtc.bonkraiders.com.conf"
SUPERVISOR_CONF="/etc/supervisor/conf.d/bonkraiders-websocket.conf"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root"
  exit 1
fi

# Create installation directory
echo "Creating installation directory..."
mkdir -p $INSTALL_DIR
mkdir -p $INSTALL_DIR/ssl
mkdir -p $INSTALL_DIR/public

# Copy files
echo "Copying files..."
cp -r ./* $INSTALL_DIR/
chmod +x $INSTALL_DIR/start.sh

# Install dependencies
echo "Installing dependencies..."
cd $INSTALL_DIR
composer install --no-dev --optimize-autoloader

# Configure environment
echo "Configuring environment..."
if [ ! -f "$INSTALL_DIR/.env" ]; then
  cp $INSTALL_DIR/.env.example $INSTALL_DIR/.env
  echo "Please edit $INSTALL_DIR/.env with your configuration."
fi

# Configure Nginx
echo "Configuring Nginx..."
if [ -d "/etc/nginx/conf.d" ]; then
  cp $INSTALL_DIR/nginx.conf $NGINX_CONF
  echo "Nginx configuration installed to $NGINX_CONF"
  echo "Please update SSL certificate paths in the configuration."
  
  # Test Nginx configuration
  nginx -t
  if [ $? -eq 0 ]; then
    echo "Nginx configuration is valid."
    systemctl reload nginx
  else
    echo "Nginx configuration is invalid. Please check and fix manually."
  fi
else
  echo "Nginx configuration directory not found. Please install Nginx configuration manually."
fi

# Configure Supervisor
echo "Configuring Supervisor..."
if [ -d "/etc/supervisor/conf.d" ]; then
  cp $INSTALL_DIR/supervisor.conf $SUPERVISOR_CONF
  echo "Supervisor configuration installed to $SUPERVISOR_CONF"
  
  # Update paths in supervisor config
  sed -i "s|/var/www/webrtc.bonkraiders.com|$INSTALL_DIR|g" $SUPERVISOR_CONF
  
  # Reload Supervisor
  supervisorctl reread
  supervisorctl update
  supervisorctl restart bonkraiders-websocket:*
else
  echo "Supervisor configuration directory not found. Please install Supervisor configuration manually."
fi

# Set permissions
echo "Setting permissions..."
chown -R www-data:www-data $INSTALL_DIR
chmod -R 755 $INSTALL_DIR

echo "Installation completed!"
echo "WebSocket server should now be running at wss://webrtc.bonkraiders.com/ws"
echo ""
echo "To check status: supervisorctl status bonkraiders-websocket:*"
echo "To restart: supervisorctl restart bonkraiders-websocket:*"
echo "To view logs: tail -f /var/log/bonkraiders-websocket.out.log"