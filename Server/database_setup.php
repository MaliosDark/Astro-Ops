<?php
/**
 * Database Setup Script
 * Run this file directly to set up the database properly
 */

require __DIR__ . '/vendor/autoload.php';

// Database configuration - update these to match your setup
define('DB_HOST', 'localhost');
define('DB_NAME', 'bonkraiders_game');
define('DB_USER', 'root');
define('DB_PASS', '');

try {
    echo "Connecting to MySQL server...\n";
    
    // Connect to MySQL server (without database)
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
    
    echo "Connected successfully!\n";
    
    // Create database if it doesn't exist
    echo "Creating database if not exists...\n";
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "`");
    $pdo->exec("USE `" . DB_NAME . "`");
    
    echo "Reading migrations.sql file...\n";
    
    // Read and execute the migrations.sql file
    $migrationFile = __DIR__ . '/../database/migrations.sql';
    if (!file_exists($migrationFile)) {
        throw new Exception("migrations.sql file not found at: " . $migrationFile);
    }
    
    $sql = file_get_contents($migrationFile);
    if ($sql === false) {
        throw new Exception("Could not read migrations.sql file");
    }
    
    // Split SQL into individual statements and execute them
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    foreach ($statements as $statement) {
        if (empty($statement) || strpos($statement, '--') === 0) {
            continue; // Skip empty statements and comments
        }
        
        try {
            $pdo->exec($statement);
            echo "✓ Executed: " . substr($statement, 0, 50) . "...\n";
        } catch (PDOException $e) {
            echo "⚠ Warning executing statement: " . $e->getMessage() . "\n";
            echo "Statement: " . substr($statement, 0, 100) . "...\n";
        }
    }
    
    echo "\n=== Database Setup Complete ===\n";
    echo "Database: " . DB_NAME . "\n";
    echo "Host: " . DB_HOST . "\n";
    echo "User: " . DB_USER . "\n";
    
    // Test the connection by listing tables
    echo "\nTables created:\n";
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    foreach ($tables as $table) {
        echo "- " . $table . "\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}