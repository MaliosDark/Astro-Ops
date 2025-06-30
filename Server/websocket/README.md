# Bonk Raiders Simple WebSocket Server

This is a lightweight WebSocket server for Bonk Raiders that provides real-time communication features:

- Player status updates (online/offline/in-mission)
- Chat messaging
- Raid notifications
- Battle coordination

## Requirements

- PHP 7.4 or higher
- Socket extension enabled
- Access to the same database as the main API

## Installation

1. Upload the `server.php` file to your server
2. Make sure the database configuration matches your main API

## Running the Server

```bash
php server.php
```

For production use, you should run this as a background service. You can use screen, nohup, or a process manager like Supervisor:

```bash
# Using screen
screen -S bonk-websocket
php server.php
# Press Ctrl+A, then D to detach

# Using nohup
nohup php server.php > websocket.log 2>&1 &
```

## Client Usage

Connect to the WebSocket server from your client:

```javascript
const ws = new WebSocket('ws://your-server:8082');

// Authenticate after connection
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    data: {
      token: 'your-jwt-token'
    }
  }));
};

// Handle messages
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};
```

## Message Types

### Client to Server

- `auth`: Authenticate with JWT token
- `heartbeat`: Keep connection alive
- `status_update`: Update player status
- `chat_message`: Send chat message
- `raid_initiated`: Notify server about raid start
- `raid_completed`: Notify server about raid completion

### Server to Client

- `welcome`: Initial connection message
- `auth_success`: Authentication successful
- `auth_failed`: Authentication failed
- `heartbeat`: Heartbeat response
- `user_status_update`: User status changed
- `chat_message`: New chat message
- `raid_incoming`: Raid notification
- `raid_completed`: Raid result
- `error`: Error message

## Security

- All connections require JWT authentication
- Rate limiting is implemented
- Input validation for all message types
- IP-based connection limiting

## Troubleshooting

If you encounter issues:

1. Check that the socket extension is enabled in PHP
2. Verify database credentials
3. Ensure the port (8082) is open in your firewall
4. Check logs for error messages

For any questions, contact support@bonkraiders.com