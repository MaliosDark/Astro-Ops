#!/bin/bash
# Status script for WebSocket server

if [ -f "websocket.pid" ]; then
    PID=$(cat websocket.pid)
    
    if ps -p $PID > /dev/null; then
        echo "WebSocket server is running with PID: $PID"
        
        # Show uptime
        PROCESS_START=$(ps -o lstart= -p $PID)
        echo "Running since: $PROCESS_START"
        
        # Show memory usage
        MEM_USAGE=$(ps -o rss= -p $PID)
        echo "Memory usage: $(($MEM_USAGE / 1024)) MB"
        
        # Show log file size
        if [ -f "logs/websocket.log" ]; then
            LOG_SIZE=$(du -h logs/websocket.log | cut -f1)
            echo "Log file size: $LOG_SIZE"
        fi
        
        # Show connection count (if netstat is available)
        if command -v netstat &> /dev/null; then
            CONN_COUNT=$(netstat -an | grep ":8082" | grep ESTABLISHED | wc -l)
            echo "Active connections: $CONN_COUNT"
        fi
        
        exit 0
    else
        echo "WebSocket server is not running (PID: $PID not found)."
        rm websocket.pid
        exit 1
    fi
else
    # Try to find the process by name
    PID=$(ps aux | grep "[p]hp server.php" | awk '{print $2}')
    
    if [ -n "$PID" ]; then
        echo "WebSocket server is running with PID: $PID (PID file missing)"
        echo "Creating PID file..."
        echo $PID > websocket.pid
        exit 0
    else
        echo "WebSocket server is not running."
        exit 1
    fi
fi