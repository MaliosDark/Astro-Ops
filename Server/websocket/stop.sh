#!/bin/bash
# Stop script for WebSocket server

if [ -f "websocket.pid" ]; then
    PID=$(cat websocket.pid)
    
    if ps -p $PID > /dev/null; then
        echo "Stopping WebSocket server with PID: $PID"
        kill $PID
        rm websocket.pid
        echo "WebSocket server stopped."
    else
        echo "WebSocket server is not running (PID: $PID not found)."
        rm websocket.pid
    fi
else
    echo "WebSocket server PID file not found."
    
    # Try to find the process by name
    PID=$(ps aux | grep "[p]hp server.php" | awk '{print $2}')
    
    if [ -n "$PID" ]; then
        echo "Found WebSocket server process: $PID"
        kill $PID
        echo "WebSocket server stopped."
    else
        echo "No running WebSocket server process found."
    fi
fi