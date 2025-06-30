<?php
/**
 * Bonk Raiders WebSocket Server
 * Provides real-time communication for game features:
 * - Player status updates
 * - Raid notifications
 * - Game chat
 * - Battle coordination
 * - Leaderboard updates
 */

// Require Composer autoloader
require __DIR__ . '/vendor/autoload.php';

use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;
use React\EventLoop\Factory;
use React\Socket\SecureServer;
use React\Socket\Server;

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Configuration
$host = getenv('WS_HOST') ?: '0.0.0.0';
$port = getenv('WS_PORT') ?: 8080;
$useSSL = getenv('WS_USE_SSL') === 'true';
$sslCertPath = getenv('WS_SSL_CERT') ?: __DIR__ . '/ssl/cert.pem';
$sslKeyPath = getenv('WS_SSL_KEY') ?: __DIR__ . '/ssl/key.pem';
$jwtSecret = getenv('JWT_SECRET') ?: 'OAZchPBiIuZu5goVp8HAe5FzUzXFsNBm';
$dbConfig = [
    'host' => getenv('DB_HOST') ?: 'localhost',
    'name' => getenv('DB_NAME') ?: 'bonka_bonkartio',
    'user' => getenv('DB_USER') ?: 'bonka_bonusrtio',
    'pass' => getenv('DB_PASS') ?: '*OxlUH49*69i'
];

// Create WebSocket handler class
class BonkRaidersWebSocketServer implements \Ratchet\MessageComponentInterface {
    protected $clients;
    protected $clientsInfo;
    protected $pdo;
    protected $jwtSecret;
    protected $leaderboard;
    protected $lastLeaderboardUpdate;
    protected $activeBattles;
    protected $chatHistory;
    protected $userStatus;
    
    public function __construct($dbConfig, $jwtSecret) {
        $this->clients = new \SplObjectStorage;
        $this->clientsInfo = [];
        $this->jwtSecret = $jwtSecret;
        $this->leaderboard = [];
        $this->lastLeaderboardUpdate = 0;
        $this->activeBattles = [];
        $this->chatHistory = [];
        $this->userStatus = [];
        
        // Connect to database
        try {
            $this->pdo = new PDO(
                "mysql:host={$dbConfig['host']};dbname={$dbConfig['name']};charset=utf8mb4",
                $dbConfig['user'],
                $dbConfig['pass'],
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                ]
            );
            echo "Database connection established\n";
        } catch (\PDOException $e) {
            echo "Database connection failed: {$e->getMessage()}\n";
        }
        
        // Initialize chat history
        $this->chatHistory = [
            'global' => [],
            'raids' => []
        ];
        
        // Start periodic tasks
        $this->startPeriodicTasks();
    }
    
    /**
     * Start periodic background tasks
     */
    protected function startPeriodicTasks() {
        // Update leaderboard every 5 minutes
        $loop = \React\EventLoop\Loop::get();
        $loop->addPeriodicTimer(300, function() {
            $this->updateLeaderboard();
        });
        
        // Clean up inactive connections every minute
        $loop->addPeriodicTimer(60, function() {
            $this->cleanupInactiveConnections();
        });
        
        // Broadcast online player count every 30 seconds
        $loop->addPeriodicTimer(30, function() {
            $this->broadcastOnlineCount();
        });
        
        // Initial leaderboard update
        $this->updateLeaderboard();
    }
    
    /**
     * Handle new WebSocket connection
     */
    public function onOpen(\Ratchet\ConnectionInterface $conn) {
        // Store the new connection
        $this->clients->attach($conn);
        
        // Initialize client info
        $this->clientsInfo[$conn->resourceId] = [
            'authenticated' => false,
            'userId' => null,
            'publicKey' => null,
            'lastActivity' => time(),
            'channels' => ['global']
        ];
        
        echo "New connection! ({$conn->resourceId})\n";
        
        // Send welcome message
        $conn->send(json_encode([
            'type' => 'connection_established',
            'data' => [
                'connectionId' => $conn->resourceId,
                'timestamp' => time(),
                'message' => 'Welcome to Bonk Raiders WebSocket Server'
            ]
        ]));
    }
    
    /**
     * Handle incoming WebSocket messages
     */
    public function onMessage(\Ratchet\ConnectionInterface $from, $msg) {
        $clientInfo = $this->clientsInfo[$from->resourceId] ?? null;
        if (!$clientInfo) {
            return;
        }
        
        // Update last activity timestamp
        $this->clientsInfo[$from->resourceId]['lastActivity'] = time();
        
        // Parse message
        try {
            $data = json_decode($msg, true);
            if (!isset($data['type'])) {
                throw new \Exception('Message type is required');
            }
            
            // Handle message based on type
            switch ($data['type']) {
                case 'auth':
                    $this->handleAuthentication($from, $data['data'] ?? []);
                    break;
                    
                case 'heartbeat':
                    $this->handleHeartbeat($from);
                    break;
                    
                case 'status_update':
                    $this->handleStatusUpdate($from, $data['data'] ?? []);
                    break;
                    
                case 'chat_message':
                    $this->handleChatMessage($from, $data['data'] ?? []);
                    break;
                    
                case 'raid_initiated':
                    $this->handleRaidInitiated($from, $data['data'] ?? []);
                    break;
                    
                case 'raid_completed':
                    $this->handleRaidCompleted($from, $data['data'] ?? []);
                    break;
                    
                case 'battle_action':
                    $this->handleBattleAction($from, $data['data'] ?? []);
                    break;
                    
                case 'join_channel':
                    $this->handleJoinChannel($from, $data['data'] ?? []);
                    break;
                    
                case 'leave_channel':
                    $this->handleLeaveChannel($from, $data['data'] ?? []);
                    break;
                    
                case 'request_leaderboard':
                    $this->sendLeaderboard($from);
                    break;
                    
                case 'request_chat_history':
                    $this->sendChatHistory($from, $data['data'] ?? []);
                    break;
                    
                default:
                    $from->send(json_encode([
                        'type' => 'error',
                        'data' => [
                            'message' => 'Unknown message type',
                            'code' => 'UNKNOWN_TYPE'
                        ]
                    ]));
            }
        } catch (\Exception $e) {
            echo "Error handling message: {$e->getMessage()}\n";
            $from->send(json_encode([
                'type' => 'error',
                'data' => [
                    'message' => 'Error processing message: ' . $e->getMessage(),
                    'code' => 'PROCESSING_ERROR'
                ]
            ]));
        }
    }
    
    /**
     * Handle client disconnection
     */
    public function onClose(\Ratchet\ConnectionInterface $conn) {
        // Remove the connection
        $this->clients->detach($conn);
        
        // Get user info before removing
        $clientInfo = $this->clientsInfo[$conn->resourceId] ?? null;
        
        // Update user status if authenticated
        if ($clientInfo && $clientInfo['authenticated'] && $clientInfo['userId']) {
            $userId = $clientInfo['userId'];
            $this->userStatus[$userId] = 'offline';
            
            // Broadcast user offline status
            $this->broadcastToAuthenticated([
                'type' => 'user_status_update',
                'data' => [
                    'userId' => $userId,
                    'status' => 'offline',
                    'timestamp' => time()
                ]
            ]);
        }
        
        // Clean up client info
        unset($this->clientsInfo[$conn->resourceId]);
        
        echo "Connection {$conn->resourceId} has disconnected\n";
    }
    
    /**
     * Handle errors
     */
    public function onError(\Ratchet\ConnectionInterface $conn, \Exception $e) {
        echo "Error: {$e->getMessage()}\n";
        $conn->close();
    }
    
    /**
     * Handle authentication
     */
    protected function handleAuthentication(\Ratchet\ConnectionInterface $conn, array $data) {
        if (!isset($data['token'])) {
            $conn->send(json_encode([
                'type' => 'auth_failed',
                'data' => [
                    'message' => 'Token is required',
                    'code' => 'TOKEN_REQUIRED'
                ]
            ]));
            return;
        }
        
        try {
            // Verify JWT token
            $token = $data['token'];
            $payload = $this->decodeJwt($token);
            
            if (!isset($payload['publicKey'])) {
                throw new \Exception('Invalid token payload');
            }
            
            // Get user ID from database
            $stmt = $this->pdo->prepare("SELECT id FROM users WHERE public_key = ?");
            $stmt->execute([$payload['publicKey']]);
            $user = $stmt->fetch();
            
            if (!$user) {
                throw new \Exception('User not found');
            }
            
            $userId = $user['id'];
            
            // Update client info
            $this->clientsInfo[$conn->resourceId]['authenticated'] = true;
            $this->clientsInfo[$conn->resourceId]['userId'] = $userId;
            $this->clientsInfo[$conn->resourceId]['publicKey'] = $payload['publicKey'];
            
            // Update user status
            $this->userStatus[$userId] = 'online';
            
            // Update last login in database
            $this->pdo->prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?")
                ->execute([$userId]);
            
            // Send success response
            $conn->send(json_encode([
                'type' => 'auth_success',
                'data' => [
                    'userId' => $userId,
                    'publicKey' => $payload['publicKey'],
                    'timestamp' => time()
                ]
            ]));
            
            // Broadcast user online status
            $this->broadcastToAuthenticated([
                'type' => 'user_status_update',
                'data' => [
                    'userId' => $userId,
                    'status' => 'online',
                    'timestamp' => time()
                ]
            ]);
            
            // Send initial data
            $this->sendLeaderboard($conn);
            $this->sendOnlineUsers($conn);
            $this->sendChatHistory($conn, ['channel' => 'global']);
            
            echo "User {$userId} authenticated successfully\n";
        } catch (\Exception $e) {
            echo "Authentication failed: {$e->getMessage()}\n";
            $conn->send(json_encode([
                'type' => 'auth_failed',
                'data' => [
                    'message' => 'Authentication failed: ' . $e->getMessage(),
                    'code' => 'AUTH_FAILED'
                ]
            ]));
        }
    }
    
    /**
     * Handle heartbeat messages
     */
    protected function handleHeartbeat(\Ratchet\ConnectionInterface $conn) {
        // Update last activity timestamp
        $this->clientsInfo[$conn->resourceId]['lastActivity'] = time();
        
        // Send heartbeat response
        $conn->send(json_encode([
            'type' => 'heartbeat',
            'data' => [
                'timestamp' => time()
            ]
        ]));
    }
    
    /**
     * Handle status updates
     */
    protected function handleStatusUpdate(\Ratchet\ConnectionInterface $conn, array $data) {
        $clientInfo = $this->clientsInfo[$conn->resourceId] ?? null;
        if (!$clientInfo || !$clientInfo['authenticated']) {
            $conn->send(json_encode([
                'type' => 'error',
                'data' => [
                    'message' => 'Authentication required',
                    'code' => 'AUTH_REQUIRED'
                ]
            ]));
            return;
        }
        
        $userId = $clientInfo['userId'];
        $status = $data['status'] ?? 'online';
        
        // Validate status
        $validStatuses = ['online', 'in_mission', 'in_raid', 'away', 'busy'];
        if (!in_array($status, $validStatuses)) {
            $status = 'online';
        }
        
        // Update user status
        $this->userStatus[$userId] = $status;
        
        // Broadcast status update
        $this->broadcastToAuthenticated([
            'type' => 'user_status_update',
            'data' => [
                'userId' => $userId,
                'status' => $status,
                'timestamp' => time(),
                'details' => $data['details'] ?? null
            ]
        ]);
    }
    
    /**
     * Handle chat messages
     */
    protected function handleChatMessage(\Ratchet\ConnectionInterface $conn, array $data) {
        $clientInfo = $this->clientsInfo[$conn->resourceId] ?? null;
        if (!$clientInfo || !$clientInfo['authenticated']) {
            $conn->send(json_encode([
                'type' => 'error',
                'data' => [
                    'message' => 'Authentication required',
                    'code' => 'AUTH_REQUIRED'
                ]
            ]));
            return;
        }
        
        $userId = $clientInfo['userId'];
        $publicKey = $clientInfo['publicKey'];
        $message = $data['message'] ?? '';
        $channel = $data['channel'] ?? 'global';
        
        // Validate message
        if (empty($message) || strlen($message) > 500) {
            $conn->send(json_encode([
                'type' => 'error',
                'data' => [
                    'message' => 'Invalid message length',
                    'code' => 'INVALID_MESSAGE'
                ]
            ]));
            return;
        }
        
        // Validate channel
        $validChannels = ['global', 'raids', 'help', 'trade'];
        if (!in_array($channel, $validChannels)) {
            $channel = 'global';
        }
        
        // Check if user is in channel
        if (!in_array($channel, $clientInfo['channels'])) {
            $conn->send(json_encode([
                'type' => 'error',
                'data' => [
                    'message' => 'Not joined to channel',
                    'code' => 'NOT_IN_CHANNEL'
                ]
            ]));
            return;
        }
        
        // Get user info from database
        $stmt = $this->pdo->prepare("
            SELECT u.id, u.public_key, u.total_missions, u.total_raids_won, u.total_kills,
                   s.level as ship_level
            FROM users u
            LEFT JOIN ships s ON u.id = s.user_id AND s.is_active = 1
            WHERE u.id = ?
        ");
        $stmt->execute([$userId]);
        $userInfo = $stmt->fetch();
        
        // Create chat message
        $chatMessage = [
            'id' => uniqid(),
            'userId' => $userId,
            'publicKey' => $publicKey,
            'publicKeyShort' => substr($publicKey, 0, 6) . '...' . substr($publicKey, -4),
            'message' => $message,
            'timestamp' => time(),
            'channel' => $channel,
            'stats' => [
                'missions' => $userInfo['total_missions'] ?? 0,
                'raids' => $userInfo['total_raids_won'] ?? 0,
                'kills' => $userInfo['total_kills'] ?? 0,
                'shipLevel' => $userInfo['ship_level'] ?? 1
            ]
        ];
        
        // Store in chat history (limit to 100 messages per channel)
        $this->chatHistory[$channel][] = $chatMessage;
        if (count($this->chatHistory[$channel]) > 100) {
            array_shift($this->chatHistory[$channel]);
        }
        
        // Broadcast to channel
        $this->broadcastToChannel($channel, [
            'type' => 'chat_message',
            'data' => $chatMessage
        ]);
    }
    
    /**
     * Handle raid initiated
     */
    protected function handleRaidInitiated(\Ratchet\ConnectionInterface $conn, array $data) {
        $clientInfo = $this->clientsInfo[$conn->resourceId] ?? null;
        if (!$clientInfo || !$clientInfo['authenticated']) {
            $conn->send(json_encode([
                'type' => 'error',
                'data' => [
                    'message' => 'Authentication required',
                    'code' => 'AUTH_REQUIRED'
                ]
            ]));
            return;
        }
        
        $attackerId = $clientInfo['userId'];
        $targetMissionId = $data['targetMissionId'] ?? null;
        
        if (!$targetMissionId) {
            $conn->send(json_encode([
                'type' => 'error',
                'data' => [
                    'message' => 'Target mission ID is required',
                    'code' => 'MISSING_TARGET'
                ]
            ]));
            return;
        }
        
        try {
            // Get mission info
            $stmt = $this->pdo->prepare("
                SELECT m.*, u.public_key as defender_key
                FROM missions m
                JOIN users u ON m.user_id = u.id
                WHERE m.id = ?
            ");
            $stmt->execute([$targetMissionId]);
            $mission = $stmt->fetch();
            
            if (!$mission) {
                throw new \Exception('Mission not found');
            }
            
            $defenderId = $mission['user_id'];
            
            // Get attacker info
            $stmt = $this->pdo->prepare("
                SELECT public_key, total_raids_won
                FROM users
                WHERE id = ?
            ");
            $stmt->execute([$attackerId]);
            $attacker = $stmt->fetch();
            
            if (!$attacker) {
                throw new \Exception('Attacker not found');
            }
            
            // Create battle ID
            $battleId = uniqid('battle_');
            
            // Store battle info
            $this->activeBattles[$battleId] = [
                'id' => $battleId,
                'attackerId' => $attackerId,
                'defenderId' => $defenderId,
                'missionId' => $targetMissionId,
                'startTime' => time(),
                'status' => 'initiated',
                'attackerKey' => $attacker['public_key'],
                'defenderKey' => $mission['defender_key'],
                'reward' => $mission['reward'],
                'missionType' => $mission['mission_type']
            ];
            
            // Notify attacker
            $conn->send(json_encode([
                'type' => 'raid_initiated',
                'data' => [
                    'battleId' => $battleId,
                    'targetMissionId' => $targetMissionId,
                    'defenderId' => $defenderId,
                    'timestamp' => time()
                ]
            ]));
            
            // Find defender connection and notify
            $defenderConn = $this->findConnectionByUserId($defenderId);
            if ($defenderConn) {
                $defenderConn->send(json_encode([
                    'type' => 'raid_incoming',
                    'data' => [
                        'battleId' => $battleId,
                        'attackerId' => $attackerId,
                        'attackerName' => substr($attacker['public_key'], 0, 6) . '...',
                        'attackerRaids' => $attacker['total_raids_won'],
                        'missionType' => $mission['mission_type'],
                        'missionId' => $targetMissionId,
                        'timestamp' => time()
                    ]
                ]));
            }
            
            // Broadcast to raids channel
            $this->broadcastToChannel('raids', [
                'type' => 'raid_started',
                'data' => [
                    'battleId' => $battleId,
                    'attackerId' => $attackerId,
                    'attackerName' => substr($attacker['public_key'], 0, 6) . '...',
                    'defenderId' => $defenderId,
                    'defenderName' => substr($mission['defender_key'], 0, 6) . '...',
                    'timestamp' => time()
                ]
            ]);
            
            echo "Raid initiated: Battle {$battleId} - Attacker {$attackerId} vs Defender {$defenderId}\n";
        } catch (\Exception $e) {
            echo "Error initiating raid: {$e->getMessage()}\n";
            $conn->send(json_encode([
                'type' => 'error',
                'data' => [
                    'message' => 'Failed to initiate raid: ' . $e->getMessage(),
                    'code' => 'RAID_INIT_FAILED'
                ]
            ]));
        }
    }
    
    /**
     * Handle raid completed
     */
    protected function handleRaidCompleted(\Ratchet\ConnectionInterface $conn, array $data) {
        $clientInfo = $this->clientsInfo[$conn->resourceId] ?? null;
        if (!$clientInfo || !$clientInfo['authenticated']) {
            $conn->send(json_encode([
                'type' => 'error',
                'data' => [
                    'message' => 'Authentication required',
                    'code' => 'AUTH_REQUIRED'
                ]
            ]));
            return;
        }
        
        $userId = $clientInfo['userId'];
        $missionId = $data['missionId'] ?? null;
        $success = $data['success'] ?? false;
        $stolen = $data['stolen'] ?? 0;
        
        if (!$missionId) {
            $conn->send(json_encode([
                'type' => 'error',
                'data' => [
                    'message' => 'Mission ID is required',
                    'code' => 'MISSING_MISSION_ID'
                ]
            ]));
            return;
        }
        
        try {
            // Get mission info
            $stmt = $this->pdo->prepare("
                SELECT m.*, u.public_key as defender_key
                FROM missions m
                JOIN users u ON m.user_id = u.id
                WHERE m.id = ?
            ");
            $stmt->execute([$missionId]);
            $mission = $stmt->fetch();
            
            if (!$mission) {
                throw new \Exception('Mission not found');
            }
            
            $defenderId = $mission['user_id'];
            
            // Get attacker info
            $stmt = $this->pdo->prepare("
                SELECT public_key
                FROM users
                WHERE id = ?
            ");
            $stmt->execute([$userId]);
            $attacker = $stmt->fetch();
            
            // Find battle ID
            $battleId = null;
            foreach ($this->activeBattles as $id => $battle) {
                if ($battle['missionId'] == $missionId && $battle['attackerId'] == $userId) {
                    $battleId = $id;
                    break;
                }
            }
            
            // Update battle status
            if ($battleId && isset($this->activeBattles[$battleId])) {
                $this->activeBattles[$battleId]['status'] = $success ? 'success' : 'failed';
                $this->activeBattles[$battleId]['endTime'] = time();
                $this->activeBattles[$battleId]['stolenAmount'] = $stolen;
            }
            
            // Notify defender
            $defenderConn = $this->findConnectionByUserId($defenderId);
            if ($defenderConn) {
                $defenderConn->send(json_encode([
                    'type' => 'raid_completed',
                    'data' => [
                        'battleId' => $battleId,
                        'attackerId' => $userId,
                        'attackerName' => substr($attacker['public_key'], 0, 6) . '...',
                        'success' => $success,
                        'stolenAmount' => $stolen,
                        'timestamp' => time()
                    ]
                ]));
            }
            
            // Broadcast to raids channel
            $this->broadcastToChannel('raids', [
                'type' => 'raid_completed',
                'data' => [
                    'battleId' => $battleId,
                    'attackerId' => $userId,
                    'attackerName' => substr($attacker['public_key'], 0, 6) . '...',
                    'defenderId' => $defenderId,
                    'defenderName' => substr($mission['defender_key'], 0, 6) . '...',
                    'success' => $success,
                    'stolenAmount' => $stolen,
                    'timestamp' => time()
                ]
            ]);
            
            echo "Raid completed: Battle {$battleId} - " . ($success ? "Success" : "Failed") . " - Stolen: {$stolen}\n";
        } catch (\Exception $e) {
            echo "Error completing raid: {$e->getMessage()}\n";
            $conn->send(json_encode([
                'type' => 'error',
                'data' => [
                    'message' => 'Failed to complete raid: ' . $e->getMessage(),
                    'code' => 'RAID_COMPLETION_FAILED'
                ]
            ]));
        }
    }
    
    /**
     * Handle battle actions
     */
    protected function handleBattleAction(\Ratchet\ConnectionInterface $conn, array $data) {
        $clientInfo = $this->clientsInfo[$conn->resourceId] ?? null;
        if (!$clientInfo || !$clientInfo['authenticated']) {
            $conn->send(json_encode([
                'type' => 'error',
                'data' => [
                    'message' => 'Authentication required',
                    'code' => 'AUTH_REQUIRED'
                ]
            ]));
            return;
        }
        
        $userId = $clientInfo['userId'];
        $battleId = $data['battleId'] ?? null;
        $action = $data['action'] ?? null;
        $actionData = $data['actionData'] ?? [];
        
        if (!$battleId || !$action) {
            $conn->send(json_encode([
                'type' => 'error',
                'data' => [
                    'message' => 'Battle ID and action are required',
                    'code' => 'MISSING_PARAMS'
                ]
            ]));
            return;
        }
        
        // Check if battle exists
        if (!isset($this->activeBattles[$battleId])) {
            $conn->send(json_encode([
                'type' => 'error',
                'data' => [
                    'message' => 'Battle not found',
                    'code' => 'BATTLE_NOT_FOUND'
                ]
            ]));
            return;
        }
        
        $battle = $this->activeBattles[$battleId];
        
        // Check if user is part of the battle
        if ($battle['attackerId'] != $userId && $battle['defenderId'] != $userId) {
            $conn->send(json_encode([
                'type' => 'error',
                'data' => [
                    'message' => 'Not a participant in this battle',
                    'code' => 'NOT_PARTICIPANT'
                ]
            ]));
            return;
        }
        
        // Process battle action
        $actionResult = $this->processBattleAction($battle, $userId, $action, $actionData);
        
        // Notify both participants
        $this->notifyBattleParticipants($battle, [
            'type' => 'battle_action',
            'data' => [
                'battleId' => $battleId,
                'action' => $action,
                'userId' => $userId,
                'isAttacker' => $battle['attackerId'] == $userId,
                'result' => $actionResult,
                'timestamp' => time()
            ]
        ]);
    }
    
    /**
     * Process battle action
     */
    protected function processBattleAction(array $battle, int $userId, string $action, array $actionData) {
        $isAttacker = $battle['attackerId'] == $userId;
        $result = [
            'success' => true,
            'message' => 'Action processed',
            'effects' => []
        ];
        
        switch ($action) {
            case 'deploy_unit':
                $unitType = $actionData['unitType'] ?? 'soldier';
                $position = $actionData['position'] ?? [0, 0];
                
                // Validate unit type
                $validUnitTypes = ['soldier', 'mech', 'drone'];
                if (!in_array($unitType, $validUnitTypes)) {
                    $result['success'] = false;
                    $result['message'] = 'Invalid unit type';
                    break;
                }
                
                // Add unit to battle
                $unitId = uniqid('unit_');
                $this->activeBattles[$battle['id']]['units'][$unitId] = [
                    'id' => $unitId,
                    'type' => $unitType,
                    'position' => $position,
                    'health' => 100,
                    'ownerId' => $userId,
                    'isAttacker' => $isAttacker
                ];
                
                $result['effects'][] = [
                    'type' => 'unit_deployed',
                    'unitId' => $unitId,
                    'unitType' => $unitType,
                    'position' => $position
                ];
                break;
                
            case 'move_unit':
                $unitId = $actionData['unitId'] ?? null;
                $newPosition = $actionData['position'] ?? null;
                
                if (!$unitId || !$newPosition || !isset($battle['units'][$unitId])) {
                    $result['success'] = false;
                    $result['message'] = 'Invalid unit or position';
                    break;
                }
                
                // Check if unit belongs to user
                $unit = $battle['units'][$unitId];
                if ($unit['ownerId'] != $userId) {
                    $result['success'] = false;
                    $result['message'] = 'Not your unit';
                    break;
                }
                
                // Update unit position
                $this->activeBattles[$battle['id']]['units'][$unitId]['position'] = $newPosition;
                
                $result['effects'][] = [
                    'type' => 'unit_moved',
                    'unitId' => $unitId,
                    'position' => $newPosition
                ];
                break;
                
            case 'attack':
                $attackerUnitId = $actionData['attackerUnitId'] ?? null;
                $targetUnitId = $actionData['targetUnitId'] ?? null;
                
                if (!$attackerUnitId || !$targetUnitId || 
                    !isset($battle['units'][$attackerUnitId]) || 
                    !isset($battle['units'][$targetUnitId])) {
                    $result['success'] = false;
                    $result['message'] = 'Invalid attacker or target unit';
                    break;
                }
                
                // Check if attacker unit belongs to user
                $attackerUnit = $battle['units'][$attackerUnitId];
                if ($attackerUnit['ownerId'] != $userId) {
                    $result['success'] = false;
                    $result['message'] = 'Not your unit';
                    break;
                }
                
                // Check if target unit belongs to opponent
                $targetUnit = $battle['units'][$targetUnitId];
                if ($targetUnit['ownerId'] == $userId) {
                    $result['success'] = false;
                    $result['message'] = 'Cannot attack your own unit';
                    break;
                }
                
                // Calculate damage
                $damage = $this->calculateDamage($attackerUnit, $targetUnit);
                
                // Apply damage
                $newHealth = max(0, $targetUnit['health'] - $damage);
                $this->activeBattles[$battle['id']]['units'][$targetUnitId]['health'] = $newHealth;
                
                $result['effects'][] = [
                    'type' => 'unit_damaged',
                    'unitId' => $targetUnitId,
                    'damage' => $damage,
                    'newHealth' => $newHealth,
                    'attackerId' => $attackerUnitId
                ];
                
                // Check if unit is destroyed
                if ($newHealth <= 0) {
                    $result['effects'][] = [
                        'type' => 'unit_destroyed',
                        'unitId' => $targetUnitId
                    ];
                    
                    // Check if battle is over
                    $battleOver = $this->checkBattleOver($battle['id']);
                    if ($battleOver) {
                        $result['effects'][] = [
                            'type' => 'battle_over',
                            'winner' => $battleOver['winner'],
                            'remainingUnits' => $battleOver['remainingUnits']
                        ];
                    }
                }
                break;
                
            case 'surrender':
                // End battle with opponent as winner
                $winnerId = $isAttacker ? $battle['defenderId'] : $battle['attackerId'];
                
                $this->activeBattles[$battle['id']]['status'] = 'completed';
                $this->activeBattles[$battle['id']]['endTime'] = time();
                $this->activeBattles[$battle['id']]['winner'] = $winnerId;
                
                $result['effects'][] = [
                    'type' => 'battle_over',
                    'winner' => $winnerId,
                    'surrender' => true
                ];
                break;
                
            default:
                $result['success'] = false;
                $result['message'] = 'Unknown action';
        }
        
        return $result;
    }
    
    /**
     * Calculate damage for battle
     */
    protected function calculateDamage(array $attackerUnit, array $targetUnit) {
        // Base damage by unit type
        $baseDamage = [
            'soldier' => 20,
            'mech' => 35,
            'drone' => 15
        ];
        
        // Get base damage for attacker unit type
        $damage = $baseDamage[$attackerUnit['type']] ?? 20;
        
        // Add random variation (±20%)
        $variation = $damage * 0.2;
        $damage += mt_rand(-$variation, $variation);
        
        // Round to integer
        return max(1, round($damage));
    }
    
    /**
     * Check if battle is over
     */
    protected function checkBattleOver(string $battleId) {
        if (!isset($this->activeBattles[$battleId])) {
            return false;
        }
        
        $battle = $this->activeBattles[$battleId];
        
        // Count remaining units for each side
        $attackerUnits = 0;
        $defenderUnits = 0;
        
        foreach ($battle['units'] ?? [] as $unit) {
            if ($unit['health'] > 0) {
                if ($unit['isAttacker']) {
                    $attackerUnits++;
                } else {
                    $defenderUnits++;
                }
            }
        }
        
        // Check if one side has no units left
        if ($attackerUnits == 0 || $defenderUnits == 0) {
            $winner = $attackerUnits > 0 ? $battle['attackerId'] : $battle['defenderId'];
            
            // Update battle status
            $this->activeBattles[$battleId]['status'] = 'completed';
            $this->activeBattles[$battleId]['endTime'] = time();
            $this->activeBattles[$battleId]['winner'] = $winner;
            
            return [
                'winner' => $winner,
                'remainingUnits' => $winner == $battle['attackerId'] ? $attackerUnits : $defenderUnits
            ];
        }
        
        return false;
    }
    
    /**
     * Notify battle participants
     */
    protected function notifyBattleParticipants(array $battle, array $message) {
        $attackerConn = $this->findConnectionByUserId($battle['attackerId']);
        $defenderConn = $this->findConnectionByUserId($battle['defenderId']);
        
        if ($attackerConn) {
            $attackerConn->send(json_encode($message));
        }
        
        if ($defenderConn) {
            $defenderConn->send(json_encode($message));
        }
    }
    
    /**
     * Handle join channel
     */
    protected function handleJoinChannel(\Ratchet\ConnectionInterface $conn, array $data) {
        $clientInfo = $this->clientsInfo[$conn->resourceId] ?? null;
        if (!$clientInfo || !$clientInfo['authenticated']) {
            $conn->send(json_encode([
                'type' => 'error',
                'data' => [
                    'message' => 'Authentication required',
                    'code' => 'AUTH_REQUIRED'
                ]
            ]));
            return;
        }
        
        $channel = $data['channel'] ?? null;
        
        if (!$channel) {
            $conn->send(json_encode([
                'type' => 'error',
                'data' => [
                    'message' => 'Channel is required',
                    'code' => 'MISSING_CHANNEL'
                ]
            ]));
            return;
        }
        
        // Validate channel
        $validChannels = ['global', 'raids', 'help', 'trade'];
        if (!in_array($channel, $validChannels)) {
            $conn->send(json_encode([
                'type' => 'error',
                'data' => [
                    'message' => 'Invalid channel',
                    'code' => 'INVALID_CHANNEL'
                ]
            ]));
            return;
        }
        
        // Add channel to user's channels
        if (!in_array($channel, $this->clientsInfo[$conn->resourceId]['channels'])) {
            $this->clientsInfo[$conn->resourceId]['channels'][] = $channel;
        }
        
        // Send success response
        $conn->send(json_encode([
            'type' => 'channel_joined',
            'data' => [
                'channel' => $channel,
                'timestamp' => time()
            ]
        ]));
        
        // Send channel history
        $this->sendChatHistory($conn, ['channel' => $channel]);
    }
    
    /**
     * Handle leave channel
     */
    protected function handleLeaveChannel(\Ratchet\ConnectionInterface $conn, array $data) {
        $clientInfo = $this->clientsInfo[$conn->resourceId] ?? null;
        if (!$clientInfo || !$clientInfo['authenticated']) {
            $conn->send(json_encode([
                'type' => 'error',
                'data' => [
                    'message' => 'Authentication required',
                    'code' => 'AUTH_REQUIRED'
                ]
            ]));
            return;
        }
        
        $channel = $data['channel'] ?? null;
        
        if (!$channel) {
            $conn->send(json_encode([
                'type' => 'error',
                'data' => [
                    'message' => 'Channel is required',
                    'code' => 'MISSING_CHANNEL'
                ]
            ]));
            return;
        }
        
        // Remove channel from user's channels
        $channels = &$this->clientsInfo[$conn->resourceId]['channels'];
        $index = array_search($channel, $channels);
        if ($index !== false) {
            unset($channels[$index]);
            $channels = array_values($channels); // Reindex array
        }
        
        // Send success response
        $conn->send(json_encode([
            'type' => 'channel_left',
            'data' => [
                'channel' => $channel,
                'timestamp' => time()
            ]
        ]));
    }
    
    /**
     * Send leaderboard to client
     */
    protected function sendLeaderboard(\Ratchet\ConnectionInterface $conn) {
        $conn->send(json_encode([
            'type' => 'leaderboard',
            'data' => [
                'leaderboard' => $this->leaderboard,
                'timestamp' => time(),
                'lastUpdate' => $this->lastLeaderboardUpdate
            ]
        ]));
    }
    
    /**
     * Send chat history to client
     */
    protected function sendChatHistory(\Ratchet\ConnectionInterface $conn, array $data) {
        $channel = $data['channel'] ?? 'global';
        
        // Validate channel
        $validChannels = ['global', 'raids', 'help', 'trade'];
        if (!in_array($channel, $validChannels)) {
            $channel = 'global';
        }
        
        // Get chat history for channel
        $history = $this->chatHistory[$channel] ?? [];
        
        // Send history
        $conn->send(json_encode([
            'type' => 'chat_history',
            'data' => [
                'channel' => $channel,
                'messages' => $history,
                'timestamp' => time()
            ]
        ]));
    }
    
    /**
     * Send online users to client
     */
    protected function sendOnlineUsers(\Ratchet\ConnectionInterface $conn) {
        // Get online users
        $onlineUsers = [];
        foreach ($this->userStatus as $userId => $status) {
            if ($status != 'offline') {
                $onlineUsers[] = [
                    'userId' => $userId,
                    'status' => $status,
                    'lastSeen' => time()
                ];
            }
        }
        
        // Send online users
        $conn->send(json_encode([
            'type' => 'online_users',
            'data' => [
                'users' => $onlineUsers,
                'timestamp' => time()
            ]
        ]));
    }
    
    /**
     * Update leaderboard from database
     */
    protected function updateLeaderboard() {
        try {
            // Get top players by different metrics
            $stmt = $this->pdo->prepare("
                SELECT u.id, u.public_key, u.total_missions, u.total_raids_won, u.total_kills,
                       s.level as ship_level, s.br_balance
                FROM users u
                LEFT JOIN ships s ON u.id = s.user_id AND s.is_active = 1
                ORDER BY u.total_raids_won DESC, u.total_missions DESC
                LIMIT 20
            ");
            $stmt->execute();
            $topRaiders = $stmt->fetchAll();
            
            $stmt = $this->pdo->prepare("
                SELECT u.id, u.public_key, u.total_missions, u.total_raids_won, u.total_kills,
                       s.level as ship_level, s.br_balance
                FROM users u
                LEFT JOIN ships s ON u.id = s.user_id AND s.is_active = 1
                ORDER BY s.br_balance DESC
                LIMIT 20
            ");
            $stmt->execute();
            $topBalance = $stmt->fetchAll();
            
            $stmt = $this->pdo->prepare("
                SELECT u.id, u.public_key, u.total_missions, u.total_raids_won, u.total_kills,
                       s.level as ship_level, s.br_balance
                FROM users u
                LEFT JOIN ships s ON u.id = s.user_id AND s.is_active = 1
                ORDER BY u.total_kills DESC
                LIMIT 20
            ");
            $stmt->execute();
            $topKillers = $stmt->fetchAll();
            
            // Format leaderboard data
            $this->leaderboard = [
                'topRaiders' => array_map(function($user) {
                    return [
                        'userId' => $user['id'],
                        'publicKey' => $user['public_key'],
                        'publicKeyShort' => substr($user['public_key'], 0, 6) . '...' . substr($user['public_key'], -4),
                        'raids' => $user['total_raids_won'],
                        'missions' => $user['total_missions'],
                        'kills' => $user['total_kills'],
                        'shipLevel' => $user['ship_level'] ?? 1,
                        'balance' => $user['br_balance'] ?? 0
                    ];
                }, $topRaiders),
                
                'topBalance' => array_map(function($user) {
                    return [
                        'userId' => $user['id'],
                        'publicKey' => $user['public_key'],
                        'publicKeyShort' => substr($user['public_key'], 0, 6) . '...' . substr($user['public_key'], -4),
                        'balance' => $user['br_balance'] ?? 0,
                        'shipLevel' => $user['ship_level'] ?? 1,
                        'raids' => $user['total_raids_won'],
                        'missions' => $user['total_missions']
                    ];
                }, $topBalance),
                
                'topKillers' => array_map(function($user) {
                    return [
                        'userId' => $user['id'],
                        'publicKey' => $user['public_key'],
                        'publicKeyShort' => substr($user['public_key'], 0, 6) . '...' . substr($user['public_key'], -4),
                        'kills' => $user['total_kills'],
                        'raids' => $user['total_raids_won'],
                        'shipLevel' => $user['ship_level'] ?? 1
                    ];
                }, $topKillers)
            ];
            
            $this->lastLeaderboardUpdate = time();
            
            // Broadcast leaderboard update
            $this->broadcastToAuthenticated([
                'type' => 'leaderboard_updated',
                'data' => [
                    'timestamp' => time()
                ]
            ]);
            
            echo "Leaderboard updated\n";
        } catch (\Exception $e) {
            echo "Error updating leaderboard: {$e->getMessage()}\n";
        }
    }
    
    /**
     * Clean up inactive connections
     */
    protected function cleanupInactiveConnections() {
        $now = time();
        $inactiveTimeout = 300; // 5 minutes
        
        foreach ($this->clients as $conn) {
            $clientInfo = $this->clientsInfo[$conn->resourceId] ?? null;
            if ($clientInfo && ($now - $clientInfo['lastActivity']) > $inactiveTimeout) {
                echo "Closing inactive connection {$conn->resourceId}\n";
                $conn->close();
            }
        }
    }
    
    /**
     * Broadcast online player count
     */
    protected function broadcastOnlineCount() {
        $authenticatedCount = 0;
        foreach ($this->clientsInfo as $info) {
            if ($info['authenticated']) {
                $authenticatedCount++;
            }
        }
        
        $this->broadcastToAll([
            'type' => 'online_count',
            'data' => [
                'count' => $authenticatedCount,
                'timestamp' => time()
            ]
        ]);
    }
    
    /**
     * Find connection by user ID
     */
    protected function findConnectionByUserId(int $userId) {
        foreach ($this->clients as $conn) {
            $clientInfo = $this->clientsInfo[$conn->resourceId] ?? null;
            if ($clientInfo && $clientInfo['authenticated'] && $clientInfo['userId'] == $userId) {
                return $conn;
            }
        }
        return null;
    }
    
    /**
     * Broadcast message to all connected clients
     */
    protected function broadcastToAll(array $message) {
        $encodedMessage = json_encode($message);
        foreach ($this->clients as $client) {
            $client->send($encodedMessage);
        }
    }
    
    /**
     * Broadcast message to authenticated clients
     */
    protected function broadcastToAuthenticated(array $message) {
        $encodedMessage = json_encode($message);
        foreach ($this->clients as $client) {
            $clientInfo = $this->clientsInfo[$client->resourceId] ?? null;
            if ($clientInfo && $clientInfo['authenticated']) {
                $client->send($encodedMessage);
            }
        }
    }
    
    /**
     * Broadcast message to specific channel
     */
    protected function broadcastToChannel(string $channel, array $message) {
        $encodedMessage = json_encode($message);
        foreach ($this->clients as $client) {
            $clientInfo = $this->clientsInfo[$client->resourceId] ?? null;
            if ($clientInfo && $clientInfo['authenticated'] && in_array($channel, $clientInfo['channels'])) {
                $client->send($encodedMessage);
            }
        }
    }
    
    /**
     * Decode JWT token
     */
    protected function decodeJwt(string $token) {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            throw new \Exception('Invalid JWT format');
        }
        
        list($h64, $p64, $s64) = $parts;
        
        // Decode payload
        $payload = json_decode($this->base64UrlDecode($p64), true);
        if (!$payload) {
            throw new \Exception('Invalid JWT payload');
        }
        
        // Verify signature
        $signature = $this->base64UrlDecode($s64);
        $signInput = "$h64.$p64";
        $expectedSignature = hash_hmac('sha256', $signInput, $this->jwtSecret, true);
        
        if (!hash_equals($expectedSignature, $signature)) {
            throw new \Exception('Invalid JWT signature');
        }
        
        // Check expiration
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            throw new \Exception('JWT token expired');
        }
        
        return $payload;
    }
    
    /**
     * Base64 URL decode
     */
    protected function base64UrlDecode(string $input) {
        $remainder = strlen($input) % 4;
        if ($remainder) {
            $input .= str_repeat('=', 4 - $remainder);
        }
        return base64_decode(strtr($input, '-_', '+/'));
    }
}

// Create event loop
$loop = Factory::create();

// Create WebSocket server
$webSocket = new BonkRaidersWebSocketServer($dbConfig, $jwtSecret);
$wsServer = new WsServer($webSocket);
$httpServer = new HttpServer($wsServer);

// Create socket server
$socket = new Server("$host:$port", $loop);

// Use SSL if enabled
if ($useSSL && file_exists($sslCertPath) && file_exists($sslKeyPath)) {
    $socket = new SecureServer($socket, $loop, [
        'local_cert' => $sslCertPath,
        'local_pk' => $sslKeyPath,
        'verify_peer' => false
    ]);
    echo "SSL enabled\n";
}

// Create IO server
$server = new IoServer($httpServer, $socket, $loop);

echo "WebSocket server running on $host:$port\n";

// Run the server
$server->run();