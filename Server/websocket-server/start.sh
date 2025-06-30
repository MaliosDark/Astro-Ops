#!/bin/bash
# Start script for WebSocket server

# Check if PHP is installed
if ! command -v php &> /dev/null; then
    echo "PHP is not installed. Please install PHP 7.4 or higher."
    exit 1
fi

# Check if Composer is installed
if ! command -v composer &> /dev/null; then
    echo "Composer is not installed. Please install Composer."
    exit 1
fi

# Install dependencies if vendor directory doesn't exist
if [ ! -d "vendor" ]; then
    echo "Installing dependencies..."
    composer install
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Creating .env file from example..."
    cp .env.example .env
    echo "Please edit .env file with your configuration."
fi

# Create SSL directory if it doesn't exist
if [ ! -d "ssl" ]; then
    mkdir -p ssl
    echo "Created ssl directory."
fi

# Check if SSL certificates exist
if [ ! -f "ssl/cert.pem" ] || [ ! -f "ssl/key.pem" ]; then
    echo "SSL certificates not found. Do you want to generate self-signed certificates? (y/n)"
    read -r generate_ssl
    
    if [ "$generate_ssl" = "y" ]; then
        echo "Generating self-signed SSL certificates..."
        openssl req -newkey rsa:2048 -new -nodes -x509 -days 365 -keyout ssl/key.pem -out ssl/cert.pem
    else
        echo "Please place your SSL certificates in the ssl directory."
    fi
fi

# Start the WebSocket server
echo "Starting WebSocket server..."
php server.php