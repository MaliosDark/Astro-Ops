#!/bin/bash
# Start script for WebSocket server

# Check if PHP is installed
if ! command -v php &> /dev/null; then
    echo "PHP is not installed. Please install PHP 7.4 or higher."
    exit 1
fi

# Check if socket extension is enabled
if ! php -m | grep -q "sockets"; then
    echo "PHP sockets extension is not enabled. Please enable it in your php.ini."
    exit 1
fi

# Create log directory if it doesn't exist
mkdir -p logs

# Start the WebSocket server
echo "Starting WebSocket server on port 8082..."
php server.php > logs/websocket.log 2>&1 &

# Save PID to file
echo $! > websocket.pid
echo "WebSocket server started with PID: $!"
echo "Logs are being written to logs/websocket.log"
echo "To stop the server, run: kill $(cat websocket.pid)"