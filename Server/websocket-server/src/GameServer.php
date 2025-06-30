<?php
namespace BonkRaiders\WebSocket;

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use Exception;

/**
 * Main WebSocket server implementation
 */
class GameServer implements MessageComponentInterface
{
    protected $clients;
    protected $db;
    protected $auth;
    protected $debug;
    protected $userConnections = [];
    protected $channels = [];
    protected $raidBattles = [];
    protected $onlineUsers = [];
    protected $messageRateLimit = [];
    
    public function __construct(Database $db, Authentication $auth, bool $debug = false)
    {
        $this->clients = new \SplObjectStorage;
        $this->db = $db;
        $this->auth = $auth;
        $this->debug = $debug;
        
        // Initialize default channels
        $this->channels['global'] = [];
        
        $this->log('GameServer initialized');
    }

    /**
     * When a new connection is opened
     */
    public function onOpen(ConnectionInterface $conn)
    {
        // Store the new connection
        $this->clients->attach($conn);
        
        // Set initial connection data
        $conn->userData = [
            'authenticated' => false,
            'userId' => null,
            'publicKey' => null,
            'username' => null,
            'channels' => [],
            'lastActivity' => time(),
            'status' => 'online'
        ];
        
        $this->log("New connection: {$conn->resourceId}");
        
        // Send welcome message
        $this->sendToConnection($conn, 'welcome', [
            'message' => 'Welcome to Bonk Raiders WebSocket Server',
            'timestamp' => time()
        ]);
    }

    /**
     * When a message is received
     */
    public function onMessage(ConnectionInterface $from, $msg)
    {
        $from->userData['lastActivity'] = time();
        
        try {
            $data = json_decode($msg, true);
            
            if (!is_array($data) || !isset($data['type'])) {
                throw new Exception('Invalid message format');
            }
            
            $type = $data['type'];
            $payload = $data['data'] ?? [];
            
            // Check rate limiting
            if (!$this->checkRateLimit($from)) {
                $this->sendToConnection($from, 'error', [
                    'message' => 'Rate limit exceeded',
                    'code' => 429
                ]);
                return;
            }
            
            // Handle message based on type
            switch ($type) {
                case 'auth':
                    $this->handleAuth($from, $payload);
                    break;
                    
                case 'heartbeat':
                    $this->handleHeartbeat($from, $payload);
                    break;
                    
                default:
                    // All other message types require authentication
                    if (!$from->userData['authenticated']) {
                        $this->sendToConnection($from, 'error', [
                            'message' => 'Authentication required',
                            'code' => 401
                        ]);
                        return;
                    }
                    
                    // Handle authenticated messages
                    switch ($type) {
                        case 'status_update':
                            $this->handleStatusUpdate($from, $payload);
                            break;
                            
                        case 'chat_message':
                            $this->handleChatMessage($from, $payload);
                            break;
                            
                        case 'join_channel':
                            $this->handleJoinChannel($from, $payload);
                            break;
                            
                        case 'leave_channel':
                            $this->handleLeaveChannel($from, $payload);
                            break;
                            
                        case 'raid_initiated':
                            $this->handleRaidInitiated($from, $payload);
                            break;
                            
                        case 'raid_completed':
                            $this->handleRaidCompleted($from, $payload);
                            break;
                            
                        case 'battle_action':
                            $this->handleBattleAction($from, $payload);
                            break;
                            
                        case 'request_leaderboard':
                            $this->handleRequestLeaderboard($from, $payload);
                            break;
                            
                        case 'request_chat_history':
                            $this->handleRequestChatHistory($from, $payload);
                            break;
                            
                        default:
                            $this->sendToConnection($from, 'error', [
                                'message' => 'Unknown message type: ' . $type,
                                'code' => 400
                            ]);
                    }
            }
        } catch (Exception $e) {
            $this->log("Error handling message: " . $e->getMessage());
            $this->sendToConnection($from, 'error', [
                'message' => 'Error processing message: ' . $e->getMessage(),
                'code' => 500
            ]);
        }
    }

    /**
     * When a connection is closed
     */
    public function onClose(ConnectionInterface $conn)
    {
        // Remove from all channels
        foreach ($conn->userData['channels'] as $channel) {
            $this->removeFromChannel($conn, $channel);
        }
        
        // Remove from user connections
        if ($conn->userData['userId']) {
            unset($this->userConnections[$conn->userData['userId']]);
            
            // Update online status
            $this->updateUserStatus($conn->userData['userId'], 'offline');
        }
        
        // Detach from clients collection
        $this->clients->detach($conn);
        
        $this->log("Connection {$conn->resourceId} has disconnected");
    }

    /**
     * When an error occurs
     */
    public function onError(ConnectionInterface $conn, \Exception $e)
    {
        $this->log("Error: {$e->getMessage()}");
        $conn->close();
    }

    /**
     * Handle authentication
     */
    private function handleAuth(ConnectionInterface $conn, array $payload)
    {
        try {
            if (!isset($payload['token'])) {
                throw new Exception('Token is required');
            }
            
            $token = $payload['token'];
            $userData = $this->auth->validateToken($token);
            
            if (!$userData) {
                throw new Exception('Invalid token');
            }
            
            // Set user data on connection
            $conn->userData['authenticated'] = true;
            $conn->userData['userId'] = $userData['userId'];
            $conn->userData['publicKey'] = $userData['publicKey'];
            
            // Get username from database
            $username = $this->db->getUsernameById($userData['userId']);
            $conn->userData['username'] = $username ?: 'Player' . $userData['userId'];
            
            // Store connection by user ID
            $this->userConnections[$userData['userId']] = $conn;
            
            // Add to global channel
            $this->addToChannel($conn, 'global');
            
            // Update online status
            $this->updateUserStatus($userData['userId'], 'online');
            
            // Send success response
            $this->sendToConnection($conn, 'auth_success', [
                'userId' => $userData['userId'],
                'publicKey' => $userData['publicKey'],
                'username' => $conn->userData['username']
            ]);
            
            $this->log("User {$userData['userId']} authenticated");
            
            // Send online users list
            $this->sendOnlineUsers($conn);
        } catch (Exception $e) {
            $this->log("Authentication failed: " . $e->getMessage());
            $this->sendToConnection($conn, 'auth_failed', [
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * Handle heartbeat
     */
    private function handleHeartbeat(ConnectionInterface $conn, array $payload)
    {
        $this->sendToConnection($conn, 'heartbeat', [
            'timestamp' => time()
        ]);
    }

    /**
     * Handle status update
     */
    private function handleStatusUpdate(ConnectionInterface $conn, array $payload)
    {
        $status = $payload['status'] ?? 'online';
        $details = $payload['details'] ?? null;
        
        // Validate status
        $validStatuses = ['online', 'in_mission', 'in_raid', 'in_battle', 'away', 'offline'];
        if (!in_array($status, $validStatuses)) {
            $status = 'online';
        }
        
        // Update connection status
        $conn->userData['status'] = $status;
        
        // Update in database
        $this->db->updateUserStatus($conn->userData['userId'], $status, $details);
        
        // Broadcast to all users
        $this->broadcastUserStatus($conn->userData['userId'], $status, $details);
    }

    /**
     * Handle chat message
     */
    private function handleChatMessage(ConnectionInterface $conn, array $payload)
    {
        $message = $payload['message'] ?? '';
        $channel = $payload['channel'] ?? 'global';
        
        // Validate message
        if (empty($message) || strlen($message) > 500) {
            $this->sendToConnection($conn, 'error', [
                'message' => 'Invalid message',
                'code' => 400
            ]);
            return;
        }
        
        // Check if user is in channel
        if (!in_array($channel, $conn->userData['channels'])) {
            $this->sendToConnection($conn, 'error', [
                'message' => 'Not in channel: ' . $channel,
                'code' => 403
            ]);
            return;
        }
        
        // Filter message content
        $message = $this->filterMessage($message);
        
        // Store message in database
        $messageId = $this->db->storeChatMessage(
            $conn->userData['userId'],
            $channel,
            $message
        );
        
        // Broadcast to channel
        $this->broadcastToChannel($channel, 'chat_message', [
            'id' => $messageId,
            'userId' => $conn->userData['userId'],
            'username' => $conn->userData['username'],
            'message' => $message,
            'channel' => $channel,
            'timestamp' => time()
        ]);
    }

    /**
     * Handle join channel
     */
    private function handleJoinChannel(ConnectionInterface $conn, array $payload)
    {
        $channel = $payload['channel'] ?? '';
        
        if (empty($channel)) {
            $this->sendToConnection($conn, 'error', [
                'message' => 'Channel name is required',
                'code' => 400
            ]);
            return;
        }
        
        // Add to channel
        $this->addToChannel($conn, $channel);
        
        // Send confirmation
        $this->sendToConnection($conn, 'channel_joined', [
            'channel' => $channel
        ]);
        
        // Send recent messages
        $messages = $this->db->getRecentMessages($channel, 20);
        $this->sendToConnection($conn, 'chat_history', [
            'channel' => $channel,
            'messages' => $messages
        ]);
    }

    /**
     * Handle leave channel
     */
    private function handleLeaveChannel(ConnectionInterface $conn, array $payload)
    {
        $channel = $payload['channel'] ?? '';
        
        if (empty($channel) || $channel === 'global') {
            $this->sendToConnection($conn, 'error', [
                'message' => 'Cannot leave global channel',
                'code' => 400
            ]);
            return;
        }
        
        // Remove from channel
        $this->removeFromChannel($conn, $channel);
        
        // Send confirmation
        $this->sendToConnection($conn, 'channel_left', [
            'channel' => $channel
        ]);
    }

    /**
     * Handle raid initiated
     */
    private function handleRaidInitiated(ConnectionInterface $conn, array $payload)
    {
        $targetMissionId = $payload['targetMissionId'] ?? 0;
        
        if (!$targetMissionId) {
            $this->sendToConnection($conn, 'error', [
                'message' => 'Target mission ID is required',
                'code' => 400
            ]);
            return;
        }
        
        // Get mission details from database
        $mission = $this->db->getMissionById($targetMissionId);
        
        if (!$mission) {
            $this->sendToConnection($conn, 'error', [
                'message' => 'Mission not found',
                'code' => 404
            ]);
            return;
        }
        
        // Check if mission is raidable
        if ($mission['mode'] !== 'Unshielded' || $mission['raided'] || !$mission['success']) {
            $this->sendToConnection($conn, 'error', [
                'message' => 'Mission is not raidable',
                'code' => 400
            ]);
            return;
        }
        
        // Get target user
        $targetUserId = $mission['user_id'];
        
        // Create battle ID
        $battleId = uniqid('battle_');
        
        // Store raid battle
        $this->raidBattles[$battleId] = [
            'id' => $battleId,
            'attackerId' => $conn->userData['userId'],
            'defenderId' => $targetUserId,
            'missionId' => $targetMissionId,
            'startTime' => time(),
            'status' => 'initiated',
            'actions' => []
        ];
        
        // Notify target user if online
        if (isset($this->userConnections[$targetUserId])) {
            $this->sendToConnection($this->userConnections[$targetUserId], 'raid_incoming', [
                'battleId' => $battleId,
                'attackerId' => $conn->userData['userId'],
                'attackerName' => $conn->userData['username'],
                'missionType' => $mission['mission_type'],
                'estimatedReward' => $mission['reward']
            ]);
        }
        
        // Send confirmation to attacker
        $this->sendToConnection($conn, 'raid_initiated', [
            'battleId' => $battleId,
            'targetUserId' => $targetUserId,
            'missionType' => $mission['mission_type'],
            'estimatedReward' => $mission['reward']
        ]);
        
        $this->log("Raid initiated: User {$conn->userData['userId']} attacking mission $targetMissionId of user $targetUserId");
    }

    /**
     * Handle raid completed
     */
    private function handleRaidCompleted(ConnectionInterface $conn, array $payload)
    {
        $missionId = $payload['missionId'] ?? 0;
        $success = $payload['success'] ?? false;
        $stolen = $payload['stolen'] ?? 0;
        
        if (!$missionId) {
            $this->sendToConnection($conn, 'error', [
                'message' => 'Mission ID is required',
                'code' => 400
            ]);
            return;
        }
        
        // Get mission details from database
        $mission = $this->db->getMissionById($missionId);
        
        if (!$mission) {
            $this->sendToConnection($conn, 'error', [
                'message' => 'Mission not found',
                'code' => 404
            ]);
            return;
        }
        
        // Get target user
        $targetUserId = $mission['user_id'];
        
        // Find battle ID
        $battleId = null;
        foreach ($this->raidBattles as $id => $battle) {
            if ($battle['missionId'] == $missionId && $battle['attackerId'] == $conn->userData['userId']) {
                $battleId = $id;
                break;
            }
        }
        
        // Update battle status
        if ($battleId) {
            $this->raidBattles[$battleId]['status'] = $success ? 'success' : 'failed';
            $this->raidBattles[$battleId]['endTime'] = time();
            $this->raidBattles[$battleId]['stolen'] = $stolen;
        }
        
        // Notify target user if online
        if (isset($this->userConnections[$targetUserId])) {
            $this->sendToConnection($this->userConnections[$targetUserId], 'raid_completed', [
                'battleId' => $battleId,
                'attackerId' => $conn->userData['userId'],
                'attackerName' => $conn->userData['username'],
                'success' => $success,
                'stolenAmount' => $stolen,
                'missionId' => $missionId
            ]);
        }
        
        // Send confirmation to attacker
        $this->sendToConnection($conn, 'raid_completed', [
            'battleId' => $battleId,
            'targetUserId' => $targetUserId,
            'success' => $success,
            'stolenAmount' => $stolen,
            'missionId' => $missionId
        ]);
        
        $this->log("Raid completed: User {$conn->userData['userId']} " . ($success ? "successfully raided" : "failed to raid") . " mission $missionId of user $targetUserId");
    }

    /**
     * Handle battle action
     */
    private function handleBattleAction(ConnectionInterface $conn, array $payload)
    {
        $battleId = $payload['battleId'] ?? '';
        $action = $payload['action'] ?? '';
        $actionData = $payload['actionData'] ?? [];
        
        if (empty($battleId) || empty($action)) {
            $this->sendToConnection($conn, 'error', [
                'message' => 'Battle ID and action are required',
                'code' => 400
            ]);
            return;
        }
        
        // Check if battle exists
        if (!isset($this->raidBattles[$battleId])) {
            $this->sendToConnection($conn, 'error', [
                'message' => 'Battle not found',
                'code' => 404
            ]);
            return;
        }
        
        $battle = $this->raidBattles[$battleId];
        
        // Check if user is part of the battle
        if ($battle['attackerId'] != $conn->userData['userId'] && $battle['defenderId'] != $conn->userData['userId']) {
            $this->sendToConnection($conn, 'error', [
                'message' => 'Not authorized for this battle',
                'code' => 403
            ]);
            return;
        }
        
        // Add action to battle
        $this->raidBattles[$battleId]['actions'][] = [
            'userId' => $conn->userData['userId'],
            'action' => $action,
            'data' => $actionData,
            'timestamp' => time()
        ];
        
        // Determine other participant
        $otherUserId = ($battle['attackerId'] == $conn->userData['userId']) 
            ? $battle['defenderId'] 
            : $battle['attackerId'];
        
        // Forward action to other participant if online
        if (isset($this->userConnections[$otherUserId])) {
            $this->sendToConnection($this->userConnections[$otherUserId], 'battle_action', [
                'battleId' => $battleId,
                'userId' => $conn->userData['userId'],
                'username' => $conn->userData['username'],
                'action' => $action,
                'data' => $actionData,
                'timestamp' => time()
            ]);
        }
        
        // Send confirmation
        $this->sendToConnection($conn, 'battle_action_confirmed', [
            'battleId' => $battleId,
            'action' => $action,
            'timestamp' => time()
        ]);
    }

    /**
     * Handle request leaderboard
     */
    private function handleRequestLeaderboard(ConnectionInterface $conn, array $payload)
    {
        $type = $payload['type'] ?? 'missions';
        $limit = min(50, intval($payload['limit'] ?? 10));
        
        // Get leaderboard from database
        $leaderboard = $this->db->getLeaderboard($type, $limit);
        
        // Send leaderboard
        $this->sendToConnection($conn, 'leaderboard', [
            'type' => $type,
            'entries' => $leaderboard,
            'timestamp' => time()
        ]);
    }

    /**
     * Handle request chat history
     */
    private function handleRequestChatHistory(ConnectionInterface $conn, array $payload)
    {
        $channel = $payload['channel'] ?? 'global';
        $limit = min(50, intval($payload['limit'] ?? 20));
        
        // Check if user is in channel
        if (!in_array($channel, $conn->userData['channels'])) {
            $this->sendToConnection($conn, 'error', [
                'message' => 'Not in channel: ' . $channel,
                'code' => 403
            ]);
            return;
        }
        
        // Get messages from database
        $messages = $this->db->getRecentMessages($channel, $limit);
        
        // Send messages
        $this->sendToConnection($conn, 'chat_history', [
            'channel' => $channel,
            'messages' => $messages,
            'timestamp' => time()
        ]);
    }

    /**
     * Add connection to channel
     */
    private function addToChannel(ConnectionInterface $conn, string $channel)
    {
        // Create channel if it doesn't exist
        if (!isset($this->channels[$channel])) {
            $this->channels[$channel] = [];
        }
        
        // Add to channel if not already in it
        if (!in_array($channel, $conn->userData['channels'])) {
            $this->channels[$channel][] = $conn;
            $conn->userData['channels'][] = $channel;
            
            // Notify channel about new user
            $this->broadcastToChannel($channel, 'user_joined', [
                'userId' => $conn->userData['userId'],
                'username' => $conn->userData['username'],
                'channel' => $channel,
                'timestamp' => time()
            ], [$conn]);
        }
    }

    /**
     * Remove connection from channel
     */
    private function removeFromChannel(ConnectionInterface $conn, string $channel)
    {
        // Skip if channel doesn't exist
        if (!isset($this->channels[$channel])) {
            return;
        }
        
        // Remove from channel
        $index = array_search($conn, $this->channels[$channel]);
        if ($index !== false) {
            array_splice($this->channels[$channel], $index, 1);
        }
        
        // Remove from user's channels
        $index = array_search($channel, $conn->userData['channels']);
        if ($index !== false) {
            array_splice($conn->userData['channels'], $index, 1);
        }
        
        // Notify channel about user leaving
        $this->broadcastToChannel($channel, 'user_left', [
            'userId' => $conn->userData['userId'],
            'username' => $conn->userData['username'],
            'channel' => $channel,
            'timestamp' => time()
        ]);
    }

    /**
     * Broadcast message to channel
     */
    private function broadcastToChannel(string $channel, string $type, array $data, array $exclude = [])
    {
        if (!isset($this->channels[$channel])) {
            return;
        }
        
        foreach ($this->channels[$channel] as $client) {
            if (in_array($client, $exclude)) {
                continue;
            }
            
            $this->sendToConnection($client, $type, $data);
        }
    }

    /**
     * Send message to connection
     */
    private function sendToConnection(ConnectionInterface $conn, string $type, array $data)
    {
        $message = json_encode([
            'type' => $type,
            'data' => $data,
            'timestamp' => time()
        ]);
        
        $conn->send($message);
    }

    /**
     * Update user status and broadcast to all users
     */
    private function updateUserStatus(int $userId, string $status, $details = null)
    {
        // Update online users list
        if ($status === 'offline') {
            unset($this->onlineUsers[$userId]);
        } else {
            $this->onlineUsers[$userId] = [
                'userId' => $userId,
                'status' => $status,
                'lastActivity' => time(),
                'details' => $details
            ];
        }
        
        // Broadcast to all authenticated users
        foreach ($this->clients as $client) {
            if ($client->userData['authenticated']) {
                $this->sendToConnection($client, 'user_status_update', [
                    'userId' => $userId,
                    'status' => $status,
                    'details' => $details,
                    'timestamp' => time()
                ]);
            }
        }
    }

    /**
     * Send online users list to connection
     */
    private function sendOnlineUsers(ConnectionInterface $conn)
    {
        $this->sendToConnection($conn, 'online_users', [
            'users' => array_values($this->onlineUsers),
            'count' => count($this->onlineUsers),
            'timestamp' => time()
        ]);
    }

    /**
     * Check rate limit for connection
     */
    private function checkRateLimit(ConnectionInterface $conn)
    {
        $id = $conn->resourceId;
        $now = time();
        
        // Initialize rate limit data
        if (!isset($this->messageRateLimit[$id])) {
            $this->messageRateLimit[$id] = [
                'count' => 0,
                'window' => $now
            ];
        }
        
        // Reset window if needed
        if ($now - $this->messageRateLimit[$id]['window'] > 60) {
            $this->messageRateLimit[$id] = [
                'count' => 0,
                'window' => $now
            ];
        }
        
        // Increment count
        $this->messageRateLimit[$id]['count']++;
        
        // Check limit (30 messages per minute)
        return $this->messageRateLimit[$id]['count'] <= 30;
    }

    /**
     * Filter message content
     */
    private function filterMessage(string $message)
    {
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

    /**
     * Log message if debug is enabled
     */
    private function log(string $message)
    {
        if ($this->debug) {
            echo '[' . date('Y-m-d H:i:s') . '] ' . $message . PHP_EOL;
        }
    }
}