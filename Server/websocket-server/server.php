<?php
/**
 * Bonk Raiders WebSocket Server
 * Provides real-time communication for the game
 */

require __DIR__ . '/vendor/autoload.php';

use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;
use React\EventLoop\Factory;
use React\Socket\SecureServer;
use React\Socket\Server as SocketServer;
use BonkRaiders\WebSocket\GameServer;
use BonkRaiders\WebSocket\Database;
use BonkRaiders\WebSocket\Authentication;
use Dotenv\Dotenv;

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Configure server
$host = $_ENV['WS_HOST'] ?? '0.0.0.0';
$port = $_ENV['WS_PORT'] ?? '8082';
$useSSL = filter_var($_ENV['WS_USE_SSL'] ?? false, FILTER_VALIDATE_BOOLEAN);
$sslCert = $_ENV['WS_SSL_CERT'] ?? 'ssl/cert.pem';
$sslKey = $_ENV['WS_SSL_KEY'] ?? 'ssl/key.pem';
$debug = filter_var($_ENV['DEBUG'] ?? false, FILTER_VALIDATE_BOOLEAN);

// Configure database
$dbConfig = [
    'host' => $_ENV['DB_HOST'] ?? 'localhost',
    'name' => $_ENV['DB_NAME'] ?? 'bonka_bonkartio',
    'user' => $_ENV['DB_USER'] ?? 'bonka_bonusrtio',
    'pass' => $_ENV['DB_PASS'] ?? '*OxlUH49*69i'
];

// Configure authentication
$jwtSecret = $_ENV['JWT_SECRET'] ?? 'OAZchPBiIuZu5goVp8HAe5FzUzXFsNBm';

// Initialize components
$db = new Database($dbConfig, $debug);
$auth = new Authentication($jwtSecret, $db);
$gameServer = new GameServer($db, $auth, $debug);

// Create event loop
$loop = Factory::create();

// Create WebSocket server
$webSock = new SocketServer("$host:$port", $loop);

// Apply SSL if enabled
if ($useSSL && file_exists($sslCert) && file_exists($sslKey)) {
    $webSock = new SecureServer($webSock, $loop, [
        'local_cert' => $sslCert,
        'local_pk' => $sslKey,
        'allow_self_signed' => true,
        'verify_peer' => false
    ]);
    
    echo "SSL enabled with certificate: $sslCert\n";
} else if ($useSSL) {
    echo "Warning: SSL enabled but certificates not found. Running without SSL.\n";
}

// Create the server
$server = new IoServer(
    new HttpServer(
        new WsServer(
            $gameServer
        )
    ),
    $webSock,
    $loop
);

// Log server start
$protocol = $useSSL ? 'wss' : 'ws';
echo "Bonk Raiders WebSocket Server running at $protocol://$host:$port\n";

// Run the server
$server->run();