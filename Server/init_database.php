<?php
/**
 * Database Initialization Script for cPanel
 * This file will be called automatically when the API is first accessed
 * to ensure the database is properly set up
 */

// Only run if called directly or if tables don't exist
if (basename($_SERVER['PHP_SELF']) === 'init_database.php' || !function_exists('checkTablesExist')) {
    
    // Database configuration - matches api.php
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'bonka_bonkartio');
    define('DB_USER', 'bonka_bonusrtio');
    define('DB_PASS', '*OxlUH49*69i');
    
    function initializeDatabase() {
        try {
            $pdo = new PDO(
                "mysql:host=" . DB_HOST . ";charset=utf8mb4",
                DB_USER, 
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
                ]
            );
            
            // Try to create database (might fail if no privileges)
            try {
                $pdo->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "`");
            } catch (Exception $e) {
                // Database might already exist or user might not have CREATE privileges
            }
            
            // Use the database
            $pdo->exec("USE `" . DB_NAME . "`");
            
            // Check if users table exists
            $result = $pdo->query("SHOW TABLES LIKE 'users'")->fetch();
            
            if (!$result) {
                // Create all tables
                $tables = [
                    'users' => "
                        CREATE TABLE users (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            public_key VARCHAR(64) NOT NULL UNIQUE,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            total_missions INT NOT NULL DEFAULT 0,
                            total_raids_won INT NOT NULL DEFAULT 0,
                            total_kills INT NOT NULL DEFAULT 0,
                            INDEX idx_public_key (public_key)
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                    ",
                    'nonces' => "
                        CREATE TABLE nonces (
                            public_key VARCHAR(64) NOT NULL PRIMARY KEY,
                            nonce CHAR(32) NOT NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                    ",
                    'ships' => "
                        CREATE TABLE ships (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            user_id INT NOT NULL,
                            level TINYINT NOT NULL DEFAULT 1,
                            last_mission_ts INT NOT NULL DEFAULT 0,
                            br_balance BIGINT NOT NULL DEFAULT 0,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            is_active TINYINT NOT NULL DEFAULT 1,
                            INDEX idx_user_id (user_id),
                            INDEX idx_is_active (is_active)
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                    ",
                    'missions' => "
                        CREATE TABLE missions (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            ship_id INT NOT NULL,
                            user_id INT NOT NULL,
                            mission_type ENUM('MiningRun','BlackMarket','ArtifactHunt') NOT NULL,
                            mode ENUM('Shielded','Unshielded') NOT NULL,
                            ts_start INT NOT NULL,
                            ts_complete INT NULL,
                            success TINYINT NOT NULL,
                            reward BIGINT NOT NULL,
                            raided TINYINT NOT NULL DEFAULT 0,
                            raided_by INT NULL,
                            ts_raid INT NULL,
                            claimed TINYINT NOT NULL DEFAULT 0,
                            INDEX idx_user_id (user_id),
                            INDEX idx_ship_id (ship_id),
                            INDEX idx_ts_start (ts_start),
                            INDEX idx_raided (raided),
                            INDEX idx_mission_type (mission_type)
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                    ",
                    'api_logs' => "
                        CREATE TABLE api_logs (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            ip VARCHAR(45) NOT NULL,
                            endpoint VARCHAR(64) NOT NULL,
                            ts INT NOT NULL,
                            INDEX idx_ip_ts (ip, ts),
                            INDEX idx_ts (ts)
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                    ",
                    'energy' => "
                        CREATE TABLE energy (
                            user_id INT NOT NULL PRIMARY KEY,
                            energy INT NOT NULL DEFAULT 10,
                            last_refill INT NOT NULL DEFAULT 0,
                            max_energy INT NOT NULL DEFAULT 10
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                    ",
                    'reputation' => "
                        CREATE TABLE reputation (
                            user_id INT NOT NULL PRIMARY KEY,
                            rep INT NOT NULL DEFAULT 100
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                    ",
                    'user_settings' => "
                        CREATE TABLE user_settings (
                            user_id INT NOT NULL,
                            setting_key VARCHAR(50) NOT NULL,
                            setting_value VARCHAR(255) NOT NULL,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            PRIMARY KEY (user_id, setting_key),
                            INDEX idx_user_setting (user_id, setting_key)
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                    ",
                    'user_cache' => "
                        CREATE TABLE user_cache (
                            user_id INT NOT NULL,
                            cache_key VARCHAR(50) NOT NULL,
                            cache_value TEXT,
                            expires_at INT NOT NULL,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            PRIMARY KEY (user_id, cache_key),
                            INDEX idx_expires (expires_at)
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                    ",
                    'achievements' => "
                        CREATE TABLE achievements (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            user_id INT NOT NULL,
                            achievement_type VARCHAR(50) NOT NULL,
                            achievement_value INT NOT NULL DEFAULT 1,
                            unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            UNIQUE KEY unique_user_achievement (user_id, achievement_type),
                            INDEX idx_user_achievements (user_id),
                            INDEX idx_achievement_type (achievement_type)
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                    ",
                    'user_sessions' => "
                        CREATE TABLE user_sessions (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            user_id INT NOT NULL,
                            token_hash VARCHAR(64) NOT NULL,
                            expires_at INT NOT NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            INDEX idx_token_hash (token_hash),
                            INDEX idx_expires (expires_at),
                            INDEX idx_user_id (user_id)
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                    ",
                    'token_withdrawals' => "
                        CREATE TABLE token_withdrawals (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            user_id INT NOT NULL,
                            amount BIGINT NOT NULL,
                            tx_hash VARCHAR(100) NULL,
                            status ENUM('pending', 'completed', 'failed') NOT NULL DEFAULT 'pending',
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            completed_at TIMESTAMP NULL,
                            INDEX idx_user_id (user_id),
                            INDEX idx_status (status),
                            FOREIGN KEY (user_id) REFERENCES users(id)
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                    "
                ];
                
                foreach ($tables as $tableName => $sql) {
                    try {
                        $pdo->exec($sql);
                        echo "✓ Created table: $tableName\n";
                    } catch (Exception $e) {
                        echo "✗ Error creating table $tableName: " . $e->getMessage() . "\n";
                    }
                }
                
                echo "Database initialization complete!\n";
                return true;
            } else {
                echo "Database already initialized.\n";
                return true;
            }
            
        } catch (Exception $e) {
            echo "Database initialization failed: " . $e->getMessage() . "\n";
            return false;
        }
    }
    
    // If called directly, run initialization
    if (basename($_SERVER['PHP_SELF']) === 'init_database.php') {
        header('Content-Type: text/plain');
        initializeDatabase();
    }
}

function checkTablesExist() {
    try {
        $pdo = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USER, 
            DB_PASS,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
        
        $result = $pdo->query("SHOW TABLES LIKE 'users'")->fetch();
        return !!$result;
    } catch (Exception $e) {
        return false;
    }
}
?>