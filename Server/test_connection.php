<?php
/**
 * Test Database Connection
 * Quick script to verify database connectivity
 */

// Database configuration - update these to match your setup
define('DB_HOST', 'localhost');
define('DB_NAME', 'bonkraiders_game');
define('DB_USER', 'root');
define('DB_PASS', '');

try {
    echo "Testing database connection...\n";
    echo "Host: " . DB_HOST . "\n";
    echo "Database: " . DB_NAME . "\n";
    echo "User: " . DB_USER . "\n\n";
    
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER, 
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
    
    echo "✅ Database connection successful!\n\n";
    
    // Test basic queries
    echo "Testing basic queries...\n";
    
    // Check if users table exists
    $result = $pdo->query("SHOW TABLES LIKE 'users'")->fetch();
    if ($result) {
        echo "✅ Users table exists\n";
        
        // Count users
        $count = $pdo->query("SELECT COUNT(*) as count FROM users")->fetch();
        echo "   Users count: " . $count['count'] . "\n";
    } else {
        echo "❌ Users table does not exist\n";
    }
    
    // Check if ships table exists
    $result = $pdo->query("SHOW TABLES LIKE 'ships'")->fetch();
    if ($result) {
        echo "✅ Ships table exists\n";
        
        // Count ships
        $count = $pdo->query("SELECT COUNT(*) as count FROM ships")->fetch();
        echo "   Ships count: " . $count['count'] . "\n";
    } else {
        echo "❌ Ships table does not exist\n";
    }
    
    echo "\n✅ All tests passed!\n";
    
} catch (PDOException $e) {
    echo "❌ Database connection failed!\n";
    echo "Error: " . $e->getMessage() . "\n";
    echo "Error Code: " . $e->getCode() . "\n";
    
    if ($e->getCode() == 1049) {
        echo "\n💡 Suggestion: Database '" . DB_NAME . "' doesn't exist. Run database_setup.php first.\n";
    } elseif ($e->getCode() == 1045) {
        echo "\n💡 Suggestion: Check your username and password.\n";
    } elseif ($e->getCode() == 2002) {
        echo "\n💡 Suggestion: Make sure MySQL server is running.\n";
    }
    
    exit(1);
} catch (Exception $e) {
    echo "❌ Unexpected error: " . $e->getMessage() . "\n";
    exit(1);
}