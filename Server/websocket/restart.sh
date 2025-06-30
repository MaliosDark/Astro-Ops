#!/bin/bash
# Restart script for WebSocket server

echo "Restarting WebSocket server..."

# Stop the server
./stop.sh

# Wait a moment
sleep 2

# Start the server
./start.sh