# Bonk Raiders WebSocket Server

This WebSocket server provides real-time communication for the Bonk Raiders game, enabling features like:

- Player status updates (online/offline/in-mission)
- Raid notifications
- In-game chat
- Real-time battles
- Leaderboard updates

## Requirements

- PHP 7.4 or higher
- Composer
- MySQL/MariaDB database (shared with main API)

## Installation

1. Install dependencies:
   ```
   composer install
   ```

2. Configure environment:
   ```
   cp .env.example .env
   ```
   Edit the `.env` file with your database credentials and other settings.

3. Create SSL certificates (for production):
   ```
   mkdir ssl
   openssl req -newkey rsa:2048 -new -nodes -x509 -days 365 -keyout ssl/key.pem -out ssl/cert.pem
   ```

## Usage

Start the WebSocket server:
```
php server.php
```

For production, it's recommended to use a process manager like Supervisor to keep the server running:

```
[program:bonkraiders-ws]
command=php /path/to/server.php
directory=/path/to/websocket-server
autostart=true
autorestart=true
stderr_logfile=/var/log/bonkraiders-ws.err.log
stdout_logfile=/var/log/bonkraiders-ws.out.log
user=www-data
```

## Client Connection

Connect to the WebSocket server from the client:

```javascript
const ws = new WebSocket('wss://api.bonkraiders.com/ws');

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
- `battle_action`: Send battle action
- `join_channel`: Join chat channel
- `leave_channel`: Leave chat channel
- `request_leaderboard`: Request leaderboard data
- `request_chat_history`: Request chat history

### Server to Client

- `auth_success`: Authentication successful
- `auth_failed`: Authentication failed
- `heartbeat`: Heartbeat response
- `user_status_update`: User status changed
- `chat_message`: New chat message
- `raid_incoming`: Raid notification
- `raid_completed`: Raid result
- `battle_action`: Battle action update
- `leaderboard`: Leaderboard data
- `chat_history`: Chat history
- `online_users`: Online users list
- `error`: Error message

## Security

- All connections require JWT authentication
- Tokens are verified with the same secret as the main API
- Rate limiting is implemented for message sending
- Input validation for all message types
- Secure WebSocket (WSS) support for production