<?php
namespace BonkRaiders\WebSocket;

use PDO;
use Exception;

/**
 * Database handler for WebSocket server
 */
class Database
{
    private $pdo;
    private $debug;
    
    public function __construct(array $config, bool $debug = false)
    {
        $this->debug = $debug;
        
        try {
            $this->pdo = new PDO(
                "mysql:host={$config['host']};dbname={$config['name']};charset=utf8mb4",
                $config['user'],
                $config['pass'],
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
                ]
            );
            
            $this->log("Database connection established");
            
            // Initialize tables if needed
            $this->initializeTables();
        } catch (Exception $e) {
            $this->log("Database connection failed: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Initialize required tables
     */
    private function initializeTables()
    {
        // Create chat_messages table if it doesn't exist
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS chat_messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                channel VARCHAR(50) NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_channel (channel),
                INDEX idx_user_id (user_id),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        
        // Create user_status table if it doesn't exist
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS user_status (
                user_id INT NOT NULL PRIMARY KEY,
                status VARCHAR(20) NOT NULL DEFAULT 'offline',
                details TEXT NULL,
                last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        
        // Create battle_logs table if it doesn't exist
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS battle_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                battle_id VARCHAR(50) NOT NULL,
                attacker_id INT NOT NULL,
                defender_id INT NOT NULL,
                mission_id INT NULL,
                start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                end_time TIMESTAMP NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'initiated',
                result TEXT NULL,
                INDEX idx_battle_id (battle_id),
                INDEX idx_attacker_id (attacker_id),
                INDEX idx_defender_id (defender_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        
        $this->log("Database tables initialized");
    }
    
    /**
     * Get user by public key
     */
    public function getUserByPublicKey(string $publicKey)
    {
        $stmt = $this->pdo->prepare("
            SELECT id, public_key, created_at, last_login
            FROM users
            WHERE public_key = ?
        ");
        $stmt->execute([$publicKey]);
        
        return $stmt->fetch();
    }
    
    /**
     * Get username by user ID
     */
    public function getUsernameById(int $userId)
    {
        $stmt = $this->pdo->prepare("
            SELECT public_key
            FROM users
            WHERE id = ?
        ");
        $stmt->execute([$userId]);
        
        $result = $stmt->fetch();
        
        if ($result) {
            // Use first 6 characters of public key as username
            return substr($result['public_key'], 0, 6) . '...';
        }
        
        return null;
    }
    
    /**
     * Update user status
     */
    public function updateUserStatus(int $userId, string $status, $details = null)
    {
        $stmt = $this->pdo->prepare("
            INSERT INTO user_status (user_id, status, details)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE
                status = VALUES(status),
                details = VALUES(details),
                last_activity = CURRENT_TIMESTAMP
        ");
        
        return $stmt->execute([$userId, $status, $details ? json_encode($details) : null]);
    }
    
    /**
     * Get user status
     */
    public function getUserStatus(int $userId)
    {
        $stmt = $this->pdo->prepare("
            SELECT status, details, last_activity
            FROM user_status
            WHERE user_id = ?
        ");
        $stmt->execute([$userId]);
        
        $result = $stmt->fetch();
        
        if ($result) {
            $result['details'] = $result['details'] ? json_decode($result['details'], true) : null;
            return $result;
        }
        
        return [
            'status' => 'offline',
            'details' => null,
            'last_activity' => null
        ];
    }
    
    /**
     * Store chat message
     */
    public function storeChatMessage(int $userId, string $channel, string $message)
    {
        $stmt = $this->pdo->prepare("
            INSERT INTO chat_messages (user_id, channel, message)
            VALUES (?, ?, ?)
        ");
        
        $stmt->execute([$userId, $channel, $message]);
        
        return $this->pdo->lastInsertId();
    }
    
    /**
     * Get recent messages
     */
    public function getRecentMessages(string $channel, int $limit = 20)
    {
        $stmt = $this->pdo->prepare("
            SELECT cm.id, cm.user_id, cm.message, cm.created_at,
                   u.public_key
            FROM chat_messages cm
            JOIN users u ON cm.user_id = u.id
            WHERE cm.channel = ?
            ORDER BY cm.created_at DESC
            LIMIT ?
        ");
        
        $stmt->execute([$channel, $limit]);
        
        $messages = $stmt->fetchAll();
        
        // Format messages
        foreach ($messages as &$message) {
            $message['username'] = substr($message['public_key'], 0, 6) . '...';
            $message['timestamp'] = strtotime($message['created_at']);
            unset($message['created_at']);
            unset($message['public_key']);
        }
        
        return array_reverse($messages);
    }
    
    /**
     * Get mission by ID
     */
    public function getMissionById(int $missionId)
    {
        $stmt = $this->pdo->prepare("
            SELECT id, ship_id, user_id, mission_type, mode, ts_start, ts_complete,
                   success, reward, raided, raided_by
            FROM missions
            WHERE id = ?
        ");
        
        $stmt->execute([$missionId]);
        
        return $stmt->fetch();
    }
    
    /**
     * Log battle
     */
    public function logBattle(string $battleId, int $attackerId, int $defenderId, int $missionId = null)
    {
        $stmt = $this->pdo->prepare("
            INSERT INTO battle_logs (battle_id, attacker_id, defender_id, mission_id, status)
            VALUES (?, ?, ?, ?, 'initiated')
        ");
        
        return $stmt->execute([$battleId, $attackerId, $defenderId, $missionId]);
    }
    
    /**
     * Update battle status
     */
    public function updateBattleStatus(string $battleId, string $status, array $result = null)
    {
        $stmt = $this->pdo->prepare("
            UPDATE battle_logs
            SET status = ?, end_time = CURRENT_TIMESTAMP, result = ?
            WHERE battle_id = ?
        ");
        
        return $stmt->execute([$status, $result ? json_encode($result) : null, $battleId]);
    }
    
    /**
     * Get leaderboard
     */
    public function getLeaderboard(string $type = 'missions', int $limit = 10)
    {
        $column = 'total_missions';
        
        switch ($type) {
            case 'raids':
                $column = 'total_raids_won';
                break;
            case 'kills':
                $column = 'total_kills';
                break;
            case 'balance':
                // Special case for balance
                return $this->getBalanceLeaderboard($limit);
        }
        
        $stmt = $this->pdo->prepare("
            SELECT id, public_key, $column as score
            FROM users
            ORDER BY $column DESC
            LIMIT ?
        ");
        
        $stmt->execute([$limit]);
        
        $results = $stmt->fetchAll();
        
        // Format results
        foreach ($results as &$result) {
            $result['username'] = substr($result['public_key'], 0, 6) . '...';
            unset($result['public_key']);
        }
        
        return $results;
    }
    
    /**
     * Get balance leaderboard
     */
    private function getBalanceLeaderboard(int $limit = 10)
    {
        $stmt = $this->pdo->prepare("
            SELECT u.id, u.public_key, s.br_balance as score
            FROM users u
            JOIN ships s ON u.id = s.user_id
            WHERE s.is_active = 1
            ORDER BY s.br_balance DESC
            LIMIT ?
        ");
        
        $stmt->execute([$limit]);
        
        $results = $stmt->fetchAll();
        
        // Format results
        foreach ($results as &$result) {
            $result['username'] = substr($result['public_key'], 0, 6) . '...';
            unset($result['public_key']);
        }
        
        return $results;
    }
    
    /**
     * Log message if debug is enabled
     */
    private function log(string $message)
    {
        if ($this->debug) {
            echo '[Database] ' . $message . PHP_EOL;
        }
    }
}