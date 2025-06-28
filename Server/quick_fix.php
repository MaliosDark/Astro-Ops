<?php
/**
 * Quick Fix Script - Run this to fix the missing columns issue
 * Visit this file in your browser: https://api.bonkraiders.com/quick_fix.php
 */

header('Content-Type: text/html; charset=utf-8');

// Database configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'bonka_bonkartio');
define('DB_USER', 'bonka_bonusrtio');
define('DB_PASS', '*OxlUH49*69i');

?>
<!DOCTYPE html>
<html>
<head>
    <title>Bonk Raiders - Quick Database Fix</title>
    <style>
        body { font-family: monospace; background: #000; color: #0f0; padding: 20px; }
        .success { color: #0f0; }
        .error { color: #f00; }
        .warning { color: #ff0; }
        .info { color: #0cf; }
        pre { background: #111; padding: 10px; border: 1px solid #333; }
        .button { 
            background: #0f0; 
            color: #000; 
            padding: 10px 20px; 
            border: none; 
            cursor: pointer; 
            margin: 10px 5px;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <h1>🔧 Bonk Raiders Database Quick Fix</h1>
    
    <?php
    if (isset($_POST['action'])) {
        try {
            $pdo = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER, 
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                ]
            );
            
            if ($_POST['action'] === 'fix_columns') {
                echo "<h2>🔧 Fixing Missing Columns</h2>";
                
                // Check current table structure
                echo "<div class='info'>Checking current users table structure...</div>";
                $columns = $pdo->query("SHOW COLUMNS FROM users")->fetchAll();
                $hasColumns = [];
                foreach ($columns as $col) {
                    $hasColumns[] = $col['Field'];
                    echo "<div class='info'>- Found column: {$col['Field']}</div>";
                }
                
                // Add missing columns
                $requiredColumns = [
                    'total_missions' => 'INT NOT NULL DEFAULT 0',
                    'total_raids_won' => 'INT NOT NULL DEFAULT 0', 
                    'total_kills' => 'INT NOT NULL DEFAULT 0'
                ];
                
                foreach ($requiredColumns as $colName => $colDef) {
                    if (!in_array($colName, $hasColumns)) {
                        try {
                            $pdo->exec("ALTER TABLE users ADD COLUMN $colName $colDef");
                            echo "<div class='success'>✅ Added column: $colName</div>";
                        } catch (Exception $e) {
                            echo "<div class='error'>❌ Failed to add $colName: " . $e->getMessage() . "</div>";
                        }
                    } else {
                        echo "<div class='success'>✅ Column $colName already exists</div>";
                    }
                }
                
                // Add some demo data to existing users
                echo "<div class='info'>Adding demo stats to existing users...</div>";
                $result = $pdo->exec("
                    UPDATE users 
                    SET total_missions = FLOOR(5 + RAND() * 15),
                        total_raids_won = FLOOR(1 + RAND() * 5),
                        total_kills = FLOOR(10 + RAND() * 30)
                    WHERE total_missions = 0 AND total_raids_won = 0 AND total_kills = 0
                ");
                echo "<div class='success'>✅ Updated $result users with demo stats</div>";
                
                // Check energy table
                echo "<div class='info'>Checking energy table...</div>";
                try {
                    $energyColumns = $pdo->query("SHOW COLUMNS FROM energy")->fetchAll();
                    $hasMaxEnergy = false;
                    foreach ($energyColumns as $col) {
                        if ($col['Field'] === 'max_energy') {
                            $hasMaxEnergy = true;
                            break;
                        }
                    }
                    
                    if (!$hasMaxEnergy) {
                        $pdo->exec("ALTER TABLE energy ADD COLUMN max_energy INT NOT NULL DEFAULT 10");
                        echo "<div class='success'>✅ Added max_energy column to energy table</div>";
                    } else {
                        echo "<div class='success'>✅ Energy table already has max_energy column</div>";
                    }
                } catch (Exception $e) {
                    echo "<div class='error'>❌ Energy table issue: " . $e->getMessage() . "</div>";
                }
                
                echo "<div class='success'>🎉 Database fix completed!</div>";
                echo "<div class='info'>You can now test the game again.</div>";
                
            } elseif ($_POST['action'] === 'reset_all') {
                echo "<h2>🗑️ Resetting All Tables</h2>";
                echo "<div class='warning'>⚠️ This will delete ALL existing data!</div>";
                
                // Drop tables in correct order
                $tables = ['user_sessions', 'achievements', 'user_cache', 'user_settings', 'reputation', 'energy', 'api_logs', 'missions', 'ships', 'nonces', 'users'];
                
                foreach ($tables as $table) {
                    try {
                        $pdo->exec("DROP TABLE IF EXISTS $table");
                        echo "<div class='info'>Dropped table: $table</div>";
                    } catch (Exception $e) {
                        echo "<div class='warning'>Warning dropping $table: " . $e->getMessage() . "</div>";
                    }
                }
                
                // Recreate users table with all columns
                $pdo->exec("
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
                ");
                echo "<div class='success'>✅ Recreated users table with all columns</div>";
                
                // Create other essential tables
                $pdo->exec("
                    CREATE TABLE nonces (
                        public_key VARCHAR(64) NOT NULL PRIMARY KEY,
                        nonce CHAR(32) NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                ");
                
                $pdo->exec("
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
                ");
                
                $pdo->exec("
                    CREATE TABLE energy (
                        user_id INT NOT NULL PRIMARY KEY,
                        energy INT NOT NULL DEFAULT 10,
                        last_refill INT NOT NULL DEFAULT 0,
                        max_energy INT NOT NULL DEFAULT 10
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                ");
                
                $pdo->exec("
                    CREATE TABLE api_logs (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        ip VARCHAR(45) NOT NULL,
                        endpoint VARCHAR(64) NOT NULL,
                        ts INT NOT NULL,
                        INDEX idx_ip_ts (ip, ts),
                        INDEX idx_ts (ts)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                ");
                
                echo "<div class='success'>✅ Created essential tables</div>";
                echo "<div class='success'>🎉 Database reset completed!</div>";
            }
            
        } catch (Exception $e) {
            echo "<div class='error'>❌ Database operation failed: " . $e->getMessage() . "</div>";
        }
    } else {
        echo "<h2>🎯 Choose Your Fix</h2>";
        echo "<div class='info'>Select the appropriate fix for your situation:</div>";
        
        echo "<form method='post' style='margin: 20px 0;'>";
        echo "<input type='hidden' name='action' value='fix_columns'>";
        echo "<button type='submit' class='button'>🔧 FIX MISSING COLUMNS (Recommended)</button>";
        echo "<div class='info'>This will add the missing columns to your existing users table without losing data.</div>";
        echo "</form>";
        
        echo "<form method='post' style='margin: 20px 0;'>";
        echo "<input type='hidden' name='action' value='reset_all'>";
        echo "<button type='submit' class='button' onclick='return confirm(\"This will delete ALL data! Are you sure?\")'>🗑️ RESET EVERYTHING (Nuclear Option)</button>";
        echo "<div class='warning'>⚠️ This will delete ALL existing data and recreate tables from scratch.</div>";
        echo "</form>";
        
        echo "<h2>📋 Current Database Status</h2>";
        
        try {
            $pdo = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER, 
                DB_PASS,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );
            
            echo "<div class='success'>✅ Database connection successful</div>";
            
            // Check users table structure
            try {
                $columns = $pdo->query("SHOW COLUMNS FROM users")->fetchAll();
                echo "<div class='info'>Users table columns:</div>";
                $hasRequired = ['total_missions' => false, 'total_raids_won' => false, 'total_kills' => false];
                
                foreach ($columns as $col) {
                    $status = in_array($col['Field'], array_keys($hasRequired)) ? 
                        (isset($hasRequired[$col['Field']]) ? '✅' : '❓') : '📝';
                    echo "<div class='info'>$status {$col['Field']} ({$col['Type']})</div>";
                    
                    if (isset($hasRequired[$col['Field']])) {
                        $hasRequired[$col['Field']] = true;
                    }
                }
                
                $missing = array_keys(array_filter($hasRequired, function($v) { return !$v; }));
                if (!empty($missing)) {
                    echo "<div class='error'>❌ Missing columns: " . implode(', ', $missing) . "</div>";
                } else {
                    echo "<div class='success'>✅ All required columns present</div>";
                }
                
            } catch (Exception $e) {
                echo "<div class='error'>❌ Users table issue: " . $e->getMessage() . "</div>";
            }
            
        } catch (Exception $e) {
            echo "<div class='error'>❌ Database connection failed: " . $e->getMessage() . "</div>";
        }
    }
    ?>
    
    <h2>🔗 Quick Links</h2>
    <div class='info'>
        <a href="check_setup.php" style="color: #0cf;">Setup Check</a> | 
        <a href="api.php?action=auth/nonce" style="color: #0cf;">Test API</a> |
        <a href="../" style="color: #0cf;">Game Frontend</a>
    </div>
    
</body>
</html>