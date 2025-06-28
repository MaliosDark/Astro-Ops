<?php
/**
 * Quick setup checker for cPanel deployment
 * Visit this file in your browser to verify everything is working
 */

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Bonk Raiders - Setup Check</title>
    <style>
        body { font-family: monospace; background: #000; color: #0f0; padding: 20px; }
        .success { color: #0f0; }
        .error { color: #f00; }
        .warning { color: #ff0; }
        .info { color: #0cf; }
        pre { background: #111; padding: 10px; border: 1px solid #333; }
    </style>
</head>
<body>
    <h1>🚀 Bonk Raiders Setup Check</h1>
    
    <?php
    // Database configuration
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'bonka_bonkartio');
    define('DB_USER', 'bonka_bonusrtio');
    define('DB_PASS', '*OxlUH49*69i');
    
    echo "<h2>📋 Configuration Check</h2>";
    echo "<div class='info'>Database Host: " . DB_HOST . "</div>";
    echo "<div class='info'>Database Name: " . DB_NAME . "</div>";
    echo "<div class='info'>Database User: " . DB_USER . "</div>";
    echo "<div class='info'>Password: " . (DB_PASS ? '***' : 'EMPTY') . "</div>";
    
    echo "<h2>🔌 Database Connection Test</h2>";
    
    try {
        $pdo = new PDO(
            "mysql:host=" . DB_HOST . ";charset=utf8mb4",
            DB_USER, 
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]
        );
        
        echo "<div class='success'>✅ Database connection successful!</div>";
        
        // Check if database exists
        try {
            $pdo->exec("USE `" . DB_NAME . "`");
            echo "<div class='success'>✅ Database '" . DB_NAME . "' exists and accessible</div>";
            
            // Check tables
            echo "<h2>📊 Tables Check</h2>";
            $tables = ['users', 'ships', 'missions', 'nonces', 'energy', 'reputation'];
            
            foreach ($tables as $table) {
                $result = $pdo->query("SHOW TABLES LIKE '$table'")->fetch();
                if ($result) {
                    $count = $pdo->query("SELECT COUNT(*) as count FROM $table")->fetch();
                    echo "<div class='success'>✅ Table '$table' exists (rows: {$count['count']})</div>";
                } else {
                    echo "<div class='error'>❌ Table '$table' missing</div>";
                }
            }
            
        } catch (Exception $e) {
            echo "<div class='error'>❌ Database '" . DB_NAME . "' not accessible: " . $e->getMessage() . "</div>";
            echo "<div class='warning'>💡 You may need to create the database first</div>";
        }
        
    } catch (Exception $e) {
        echo "<div class='error'>❌ Database connection failed!</div>";
        echo "<div class='error'>Error: " . $e->getMessage() . "</div>";
        
        if ($e->getCode() == 1045) {
            echo "<div class='warning'>💡 Check your username and password</div>";
        } elseif ($e->getCode() == 2002) {
            echo "<div class='warning'>💡 Make sure MySQL server is running</div>";
        }
    }
    
    echo "<h2>🌐 API Endpoints Test</h2>";
    
    // Test API endpoint
    $apiUrl = 'https://api.bonkraiders.com/api.php?action=auth/nonce';
    echo "<div class='info'>Testing: $apiUrl</div>";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $apiUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['publicKey' => 'test']));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        echo "<div class='error'>❌ API test failed: $error</div>";
    } elseif ($httpCode == 200) {
        echo "<div class='success'>✅ API endpoint responding (HTTP $httpCode)</div>";
        echo "<div class='info'>Response: " . substr($response, 0, 100) . "...</div>";
    } else {
        echo "<div class='warning'>⚠️ API returned HTTP $httpCode</div>";
        echo "<div class='info'>Response: " . substr($response, 0, 200) . "...</div>";
    }
    
    echo "<h2>📁 File Structure Check</h2>";
    
    $requiredFiles = [
        'api.php',
        'hacker_protect.php', 
        'anti_cheat.php',
        'init_database.php'
    ];
    
    foreach ($requiredFiles as $file) {
        if (file_exists($file)) {
            echo "<div class='success'>✅ $file exists</div>";
        } else {
            echo "<div class='error'>❌ $file missing</div>";
        }
    }
    
    echo "<h2>🔧 PHP Configuration</h2>";
    echo "<div class='info'>PHP Version: " . phpversion() . "</div>";
    echo "<div class='info'>Memory Limit: " . ini_get('memory_limit') . "</div>";
    echo "<div class='info'>Max Execution Time: " . ini_get('max_execution_time') . "s</div>";
    
    $extensions = ['pdo', 'pdo_mysql', 'json', 'curl', 'sodium'];
    foreach ($extensions as $ext) {
        if (extension_loaded($ext)) {
            echo "<div class='success'>✅ $ext extension loaded</div>";
        } else {
            echo "<div class='error'>❌ $ext extension missing</div>";
        }
    }
    
    echo "<h2>🎯 Next Steps</h2>";
    echo "<div class='info'>1. If database connection failed, check your cPanel database settings</div>";
    echo "<div class='info'>2. If tables are missing, visit init_database.php to create them</div>";
    echo "<div class='info'>3. Test the game at your main domain</div>";
    echo "<div class='info'>4. Check browser console for any JavaScript errors</div>";
    
    ?>
    
    <h2>🔗 Quick Links</h2>
    <div class='info'>
        <a href="init_database.php" style="color: #0cf;">Initialize Database</a> | 
        <a href="api.php?action=auth/nonce" style="color: #0cf;">Test API</a> |
        <a href="../" style="color: #0cf;">Game Frontend</a>
    </div>
    
</body>
</html>