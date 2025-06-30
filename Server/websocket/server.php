<?php
/**
 * Simple WebSocket Server for Bonk Raiders
 * 
 * This is a lightweight WebSocket server that handles:
 * - Player status updates
 * - Chat messages
 * - Raid notifications
 * - Battle coordination
 * 
 * To run: php server.php
 */

// Database configuration - same as main API
define('DB_HOST', 'localhost');
define('DB_NAME', 'bonka_bonkartio');
define('DB_USER', 'bonka_bonusrtio');
define('DB_PASS', '*OxlUH49*69i');
define('JWT_SECRET', 'OAZchPBiIuZu5goVp8HAe5FzUzXFsNBm');

// WebSocket configuration
$host = '0.0.0.0';
$port = 8082;  // Using port 8082 instead of 8080

// Initialize WebSocket server
$server = new WebSocketServer($host, $port);
$server->run();

/**
 * Simple WebSocket Server implementation
 */
class WebSocketServer {
    protected $socket;
    protected $clients = [];
    protected $host;
    protected $port;
    protected $maxClients = 1000;
    protected $maxConnectionsPerIp = 10;
    protected $userConnections = [];
    protected $ipConnections = [];
    
    public function __construct($host, $port) {
        $this->host = $host;
        $this->port = $port;
    }
    
    public function run() {
        // Create socket
        $this->socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
        socket_set_option($this->socket, SOL_SOCKET, SO_REUSEADDR, 1);
        
        // Bind socket to address/port
        if (!socket_bind($this->socket, $this->host, $this->port)) {
            $this->log("Failed to bind to $this->host:$this->port: " . socket_strerror(socket_last_error()));
            exit(1);
        }
        
        // Start listening
        if (!socket_listen($this->socket)) {
            $this->log("Failed to listen on socket: " . socket_strerror(socket_last_error()));
            exit(1);
        }
        
        $this->log("WebSocket server running at ws://$this->host:$this->port");
        
        // Main loop
        while (true) {
            // Prepare read sockets
            $read = array_merge([$this->socket], array_column($this->clients, 'socket'));
            $write = $except = null;
            
            // Wait for activity
            if (socket_select($read, $write, $except, null) < 1) {
                continue;
            }
            
            // Handle new connections
            if (in_array($this->socket, $read)) {
                $this->acceptNewConnection();
                $key = array_search($this->socket, $read);
                unset($read[$key]);
            }
            
            // Handle client messages
            foreach ($read as $socket) {
                $client = $this->getClientBySocket($socket);
                if (!$client) continue;
                
                $data = $this->receiveData($client);
                
                if ($data === false) {
                    $this->disconnectClient($client);
                } else if (!empty($data)) {
                    $this->handleClientMessage($client, $data);
                }
            }
            
            // Cleanup disconnected clients
            $this->cleanupClients();
        }
    }
    
    protected function acceptNewConnection() {
        $clientSocket = socket_accept($this->socket);
        if (!$clientSocket) {
            $this->log("Failed to accept connection: " . socket_strerror(socket_last_error()));
            return;
        }
        
        // Get client IP
        socket_getpeername($clientSocket, $ip);
        
        // Check max connections per IP
        if (isset($this->ipConnections[$ip]) && $this->ipConnections[$ip] >= $this->maxConnectionsPerIp) {
            $this->log("Too many connections from $ip");
            socket_close($clientSocket);
            return;
        }
        
        // Check max clients
        if (count($this->clients) >= $this->maxClients) {
            $this->log("Server full, connection rejected");
            socket_close($clientSocket);
            return;
        }
        
        // Add to IP connections
        $this->ipConnections[$ip] = ($this->ipConnections[$ip] ?? 0) + 1;
        
        // Create client
        $client = [
            'id' => uniqid(),
            'socket' => $clientSocket,
            'ip' => $ip,
            'handshake' => false,
            'authenticated' => false,
            'userId' => null,
            'lastActivity' => time()
        ];
        
        $this->clients[$client['id']] = $client;
        $this->log("New connection from $ip");
    }
    
    protected function receiveData($client) {
        $socket = $client['socket'];
        
        // Read data from socket
        $data = @socket_read($socket, 2048, PHP_BINARY_READ);
        
        if ($data === false || $data === '') {
            return false;
        }
        
        // Handle WebSocket handshake
        if (!$client['handshake']) {
            return $this->handleHandshake($client, $data);
        }
        
        // Decode WebSocket frame
        return $this->decodeWebSocketFrame($data);
    }
    
    protected function handleHandshake($client, $data) {
        // Extract headers
        preg_match('#Sec-WebSocket-Key: (.*)\r\n#', $data, $matches);
        
        if (!isset($matches[1])) {
            $this->log("Invalid WebSocket handshake");
            return false;
        }
        
        $key = $matches[1];
        
        // Generate accept key
        $acceptKey = base64_encode(pack('H*', sha1($key . '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')));
        
        // Create handshake response
        $response = "HTTP/1.1 101 Switching Protocols\r\n";
        $response .= "Upgrade: websocket\r\n";
        $response .= "Connection: Upgrade\r\n";
        $response .= "Sec-WebSocket-Accept: $acceptKey\r\n";
        $response .= "\r\n";
        
        // Send handshake response
        socket_write($client['socket'], $response, strlen($response));
        
        // Update client
        $this->clients[$client['id']]['handshake'] = true;
        $this->clients[$client['id']]['lastActivity'] = time();
        
        // Send welcome message
        $this->sendToClient($client, [
            'type' => 'welcome',
            'data' => [
                'message' => 'Welcome to Bonk Raiders WebSocket Server',
                'timestamp' => time()
            ]
        ]);
        
        return '';
    }
    
    protected function handleClientMessage($client, $data) {
        try {
            $message = json_decode($data, true);
            
            if (!is_array($message) || !isset($message['type'])) {
                throw new Exception('Invalid message format');
            }
            
            $type = $message['type'];
            $payload = $message['data'] ?? [];
            
            // Update last activity
            $this->clients[$client['id']]['lastActivity'] = time();
            
            // Handle message based on type
            switch ($type) {
                case 'auth':
                    $this->handleAuth($client, $payload);
                    break;
                    
                case 'heartbeat':
                    $this->handleHeartbeat($client);
                    break;
                    
                default:
                    // All other message types require authentication
                    if (!$client['authenticated']) {
                        $this->sendToClient($client, [
                            'type' => 'error',
                            'data' => [
                                'message' => 'Authentication required',
                                'code' => 401
                            ]
                        ]);
                        return;
                    }
                    
                    // Handle authenticated messages
                    switch ($type) {
                        case 'status_update':
                            $this->handleStatusUpdate($client, $payload);
                            break;
                            
                        case 'chat_message':
                            $this->handleChatMessage($client, $payload);
                            break;
                            
                        case 'raid_initiated':
                            $this->handleRaidInitiated($client, $payload);
                            break;
                            
                        case 'raid_completed':
                            $this->handleRaidCompleted($client, $payload);
                            break;
                            
                        default:
                            $this->sendToClient($client, [
                                'type' => 'error',
                                'data' => [
                                    'message' => 'Unknown message type: ' . $type,
                                    'code' => 400
                                ]
                            ]);
                    }
            }
        } catch (Exception $e) {
            $this->log("Error handling message: " . $e->getMessage());
            $this->sendToClient($client, [
                'type' => 'error',
                'data' => [
                    'message' => 'Error processing message: ' . $e->getMessage(),
                    'code' => 500
                ]
            ]);
        }
    }
    
    protected function handleAuth($client, $payload) {
        try {
            if (!isset($payload['token'])) {
                throw new Exception('Token is required');
            }
            
            $token = $payload['token'];
            $userData = $this->validateToken($token);
            
            if (!$userData) {
                throw new Exception('Invalid token');
            }
            
            // Update client
            $this->clients[$client['id']]['authenticated'] = true;
            $this->clients[$client['id']]['userId'] = $userData['userId'];
            
            // Store connection by user ID
            $this->userConnections[$userData['userId']] = $client['id'];
            
            // Send success response
            $this->sendToClient($client, [
                'type' => 'auth_success',
                'data' => [
                    'userId' => $userData['userId'],
                    'publicKey' => $userData['publicKey']
                ]
            ]);
            
            $this->log("User {$userData['userId']} authenticated");
            
            // Broadcast user online status
            $this->broadcastUserStatus($userData['userId'], 'online');
        } catch (Exception $e) {
            $this->log("Authentication failed: " . $e->getMessage());
            $this->sendToClient($client, [
                'type' => 'auth_failed',
                'data' => [
                    'message' => $e->getMessage()
                ]
            ]);
        }
    }
    
    protected function handleHeartbeat($client) {
        $this->sendToClient($client, [
            'type' => 'heartbeat',
            'data' => [
                'timestamp' => time()
            ]
        ]);
    }
    
    protected function handleStatusUpdate($client, $payload) {
        $status = $payload['status'] ?? 'online';
        
        // Validate status
        $validStatuses = ['online', 'in_mission', 'in_raid', 'in_battle', 'away', 'offline'];
        if (!in_array($status, $validStatuses)) {
            $status = 'online';
        }
        
        // Broadcast status update
        $this->broadcastUserStatus($client['userId'], $status);
    }
    
    protected function handleChatMessage($client, $payload) {
        $message = $payload['message'] ?? '';
        $channel = $payload['channel'] ?? 'global';
        
        // Validate message
        if (empty($message) || strlen($message) > 500) {
            $this->sendToClient($client, [
                'type' => 'error',
                'data' => [
                    'message' => 'Invalid message',
                    'code' => 400
                ]
            ]);
            return;
        }
        
        // Filter message
        $message = $this->filterMessage($message);
        
        // Broadcast to all authenticated clients
        $this->broadcast([
            'type' => 'chat_message',
            'data' => [
                'userId' => $client['userId'],
                'message' => $message,
                'channel' => $channel,
                'timestamp' => time()
            ]
        ], [$client['id']]);
    }
    
    protected function handleRaidInitiated($client, $payload) {
        $targetMissionId = $payload['targetMissionId'] ?? 0;
        
        if (!$targetMissionId) {
            $this->sendToClient($client, [
                'type' => 'error',
                'data' => [
                    'message' => 'Target mission ID is required',
                    'code' => 400
                ]
            ]);
            return;
        }
        
        // Get mission details from database
        $mission = $this->getMissionById($targetMissionId);
        
        if (!$mission) {
            $this->sendToClient($client, [
                'type' => 'error',
                'data' => [
                    'message' => 'Mission not found',
                    'code' => 404
                ]
            ]);
            return;
        }
        
        // Get target user
        $targetUserId = $mission['user_id'];
        
        // Notify target user if online
        if (isset($this->userConnections[$targetUserId])) {
            $targetClientId = $this->userConnections[$targetUserId];
            $targetClient = $this->clients[$targetClientId] ?? null;
            
            if ($targetClient) {
                $this->sendToClient($targetClient, [
                    'type' => 'raid_incoming',
                    'data' => [
                        'attackerId' => $client['userId'],
                        'missionType' => $mission['mission_type'],
                        'estimatedReward' => $mission['reward']
                    ]
                ]);
            }
        }
        
        // Send confirmation to attacker
        $this->sendToClient($client, [
            'type' => 'raid_initiated',
            'data' => [
                'targetUserId' => $targetUserId,
                'missionType' => $mission['mission_type'],
                'estimatedReward' => $mission['reward']
            ]
        ]);
    }
    
    protected function handleRaidCompleted($client, $payload) {
        $missionId = $payload['missionId'] ?? 0;
        $success = $payload['success'] ?? false;
        $stolen = $payload['stolen'] ?? 0;
        
        if (!$missionId) {
            $this->sendToClient($client, [
                'type' => 'error',
                'data' => [
                    'message' => 'Mission ID is required',
                    'code' => 400
                ]
            ]);
            return;
        }
        
        // Get mission details from database
        $mission = $this->getMissionById($missionId);
        
        if (!$mission) {
            $this->sendToClient($client, [
                'type' => 'error',
                'data' => [
                    'message' => 'Mission not found',
                    'code' => 404
                ]
            ]);
            return;
        }
        
        // Get target user
        $targetUserId = $mission['user_id'];
        
        // Notify target user if online
        if (isset($this->userConnections[$targetUserId])) {
            $targetClientId = $this->userConnections[$targetUserId];
            $targetClient = $this->clients[$targetClientId] ?? null;
            
            if ($targetClient) {
                $this->sendToClient($targetClient, [
                    'type' => 'raid_completed',
                    'data' => [
                        'attackerId' => $client['userId'],
                        'success' => $success,
                        'stolenAmount' => $stolen,
                        'missionId' => $missionId
                    ]
                ]);
            }
        }
        
        // Send confirmation to attacker
        $this->sendToClient($client, [
            'type' => 'raid_completed',
            'data' => [
                'targetUserId' => $targetUserId,
                'success' => $success,
                'stolenAmount' => $stolen,
                'missionId' => $missionId
            ]
        ]);
    }
    
    protected function broadcastUserStatus($userId, $status) {
        $this->broadcast([
            'type' => 'user_status_update',
            'data' => [
                'userId' => $userId,
                'status' => $status,
                'timestamp' => time()
            ]
        ]);
    }
    
    protected function validateToken($token) {
        // Remove Bearer prefix if present
        $token = str_replace('Bearer ', '', $token);
        
        try {
            $parts = explode('.', $token);
            
            if (count($parts) !== 3) {
                return false;
            }
            
            list($header64, $payload64, $signature64) = $parts;
            
            // Verify signature
            $signature = $this->base64UrlDecode($signature64);
            $signInput = "$header64.$payload64";
            $expectedSignature = hash_hmac('sha256', $signInput, JWT_SECRET, true);
            
            if (!hash_equals($expectedSignature, $signature)) {
                return false;
            }
            
            // Decode payload
            $payload = json_decode($this->base64UrlDecode($payload64), true);
            
            // Check if token is expired
            if (isset($payload['exp']) && $payload['exp'] < time()) {
                return false;
            }
            
            // Check if publicKey exists
            if (!isset($payload['publicKey'])) {
                return false;
            }
            
            // Get user from database
            $userId = $this->getUserIdByPublicKey($payload['publicKey']);
            
            if (!$userId) {
                return false;
            }
            
            return [
                'userId' => $userId,
                'publicKey' => $payload['publicKey']
            ];
        } catch (Exception $e) {
            return false;
        }
    }
    
    protected function getUserIdByPublicKey($publicKey) {
        try {
            $pdo = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER, DB_PASS,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );
            
            $stmt = $pdo->prepare("SELECT id FROM users WHERE public_key = ?");
            $stmt->execute([$publicKey]);
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return $result ? $result['id'] : null;
        } catch (Exception $e) {
            $this->log("Database error: " . $e->getMessage());
            return null;
        }
    }
    
    protected function getMissionById($missionId) {
        try {
            $pdo = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER, DB_PASS,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );
            
            $stmt = $pdo->prepare("
                SELECT id, ship_id, user_id, mission_type, mode, ts_start, ts_complete,
                       success, reward, raided, raided_by
                FROM missions
                WHERE id = ?
            ");
            
            $stmt->execute([$missionId]);
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            $this->log("Database error: " . $e->getMessage());
            return null;
        }
    }
    
    protected function base64UrlDecode($input) {
        $remainder = strlen($input) % 4;
        if ($remainder) {
            $input .= str_repeat('=', 4 - $remainder);
        }
        
        return base64_decode(strtr($input, '-_', '+/'));
    }
    
    protected function filterMessage($message) {
        // Basic profanity filter
        $profanity = ['badword1', 'badword2', 'badword3'];
        $replacement = '***';
        
        $message = str_ireplace($profanity, $replacement, $message);
        
        // Trim and limit length
        $message = trim($message);
        if (strlen($message) > 500) {
            $message = substr($message, 0, 497) . '...';
        }
        
        return $message;
    }
    
    protected function sendToClient($client, $data) {
        $encoded = $this->encodeWebSocketFrame(json_encode($data));
        socket_write($client['socket'], $encoded, strlen($encoded));
    }
    
    protected function broadcast($data, $exclude = []) {
        $encoded = $this->encodeWebSocketFrame(json_encode($data));
        
        foreach ($this->clients as $id => $client) {
            if (in_array($id, $exclude) || !$client['handshake'] || !$client['authenticated']) {
                continue;
            }
            
            socket_write($client['socket'], $encoded, strlen($encoded));
        }
    }
    
    protected function encodeWebSocketFrame($payload) {
        $length = strlen($payload);
        $frame = chr(129); // FIN + text frame
        
        if ($length <= 125) {
            $frame .= chr($length);
        } else if ($length <= 65535) {
            $frame .= chr(126) . chr($length >> 8) . chr($length & 0xFF);
        } else {
            $frame .= chr(127) . pack('N', 0) . pack('N', $length);
        }
        
        return $frame . $payload;
    }
    
    protected function decodeWebSocketFrame($data) {
        $len = ord($data[1]) & 127;
        $maskStart = 2;
        
        if ($len == 126) {
            $maskStart = 4;
        } else if ($len == 127) {
            $maskStart = 10;
        }
        
        $masks = substr($data, $maskStart, 4);
        $dataStart = $maskStart + 4;
        $payload = substr($data, $dataStart);
        
        $decoded = '';
        for ($i = 0; $i < strlen($payload); $i++) {
            $decoded .= $payload[$i] ^ $masks[$i % 4];
        }
        
        return $decoded;
    }
    
    protected function getClientBySocket($socket) {
        foreach ($this->clients as $client) {
            if ($client['socket'] === $socket) {
                return $client;
            }
        }
        
        return null;
    }
    
    protected function disconnectClient($client) {
        // Remove from user connections
        if ($client['userId'] && isset($this->userConnections[$client['userId']])) {
            unset($this->userConnections[$client['userId']]);
            
            // Broadcast offline status
            $this->broadcastUserStatus($client['userId'], 'offline');
        }
        
        // Update IP connections
        if (isset($this->ipConnections[$client['ip']])) {
            $this->ipConnections[$client['ip']]--;
            if ($this->ipConnections[$client['ip']] <= 0) {
                unset($this->ipConnections[$client['ip']]);
            }
        }
        
        // Close socket
        socket_close($client['socket']);
        
        // Mark for removal
        $this->clients[$client['id']]['disconnected'] = true;
        
        $this->log("Client {$client['id']} disconnected");
    }
    
    protected function cleanupClients() {
        foreach ($this->clients as $id => $client) {
            if (isset($client['disconnected']) && $client['disconnected']) {
                unset($this->clients[$id]);
            }
        }
    }
    
    protected function log($message) {
        echo '[' . date('Y-m-d H:i:s') . '] ' . $message . PHP_EOL;
    }
}