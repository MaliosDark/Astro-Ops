<?php
// Basic security & input hardening
// ================= CORS Headers (MUST be first) =================
// Allow all origins for development/testing
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, Accept, X-Requested-With, X-Authorization, Cache-Control, Pragma, Origin, User-Agent');
header('Access-Control-Max-Age: 86400'); // 24 hours

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require 'hacker_protect.php';
require 'anti_cheat.php';
require __DIR__ . '/vendor/autoload.php';

// CORS headers before any other output
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, Accept, X-Requested-With, X-Authorization, Cache-Control, Pragma, Origin, User-Agent');
header('Access-Control-Max-Age: 86400');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}


// at the top of api/api.php
if ($_SERVER['REQUEST_METHOD'] === 'GET' && ! isset($_GET['action'])) {
    // serve the front‐end HTML
    header('Content-Type: text/html; charset=UTF-8');
    readfile(__DIR__ . '/index.php');
    exit;
}


header('Content-Type: application/json; charset=utf-8');

/** ================= Configuration ================= **/
define('DB_HOST',         'localhost');
define('DB_NAME',         'bonkraiders_game');
define('DB_USER',         'root');
define('DB_PASS',         '');
define('JWT_SECRET',      'OAZchPBiIuZu5goVp8HAe5FzUzXFsNBm');
define('SOLANA_RPC',      'https://api.devnet.solana.com');
define('GAME_TOKEN_MINT','CCmGDrD9jZarDEz1vrjKcE9rrJjL8VecDYjAWxhwhGPo');
define('SOLANA_API_URL',  'https://verify.bonkraiders.com');

// Debug mode constant
define('DEBUG_MODE', true); // Temporarily enable for debugging

// Treasury-safe mission config
$REWARD_CONFIG = [
  'MiningRun'   => [0.90,  3000,  6000],
  'BlackMarket' => [0.70,  6000, 10000],
  'ArtifactHunt'=> [0.50, 12000, 18000],
];
define('PARTICIPATION_FEE', 0);    // No burn fee for now


/** ================ Database Setup & Migrations ================ **/
$pdo = new PDO(
  "mysql:host=".DB_HOST.";charset=utf8mb4",
  DB_USER, DB_PASS,
  [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
  ]
);

function runMigrations(PDO $pdo) {
  // create database if missing
  $pdo->exec("CREATE DATABASE IF NOT EXISTS `".DB_NAME."`");
  $pdo->exec("USE `".DB_NAME."`");
  // if no users table, run migrations.sql
  $has = $pdo->query("SHOW TABLES LIKE 'users'")->fetch();
  if (!$has) {
    // Create tables matching migrations.sql exactly
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
      )
    ");
    
    $pdo->exec("
      CREATE TABLE nonces (
        public_key VARCHAR(64) NOT NULL PRIMARY KEY,
        nonce CHAR(32) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
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
        FOREIGN KEY(user_id) REFERENCES users(id),
        INDEX idx_user_id (user_id),
        INDEX idx_is_active (is_active)
      )
    ");
    
    $pdo->exec("
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
        FOREIGN KEY(ship_id) REFERENCES ships(id),
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(raided_by) REFERENCES users(id),
        INDEX idx_user_id (user_id),
        INDEX idx_ts_start (ts_start),
        INDEX idx_raided (raided),
        INDEX idx_mission_type (mission_type)
      )
    ");
    
    $pdo->exec("
      CREATE TABLE api_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ip VARCHAR(45) NOT NULL,
        endpoint VARCHAR(64) NOT NULL,
        ts INT NOT NULL,
        INDEX idx_ip_ts (ip, ts),
        INDEX idx_ts (ts)
      )
    ");
    
    $pdo->exec("
      CREATE TABLE energy (
        user_id INT NOT NULL PRIMARY KEY,
        energy INT NOT NULL DEFAULT 10,
        last_refill INT NOT NULL DEFAULT 0,
        max_energy INT NOT NULL DEFAULT 10,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    ");
    
    $pdo->exec("
      CREATE TABLE reputation (
        user_id INT NOT NULL PRIMARY KEY,
        rep INT NOT NULL DEFAULT 100,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    ");
    
    $pdo->exec("
      CREATE TABLE user_settings (
        user_id INT NOT NULL,
        setting_key VARCHAR(50) NOT NULL,
        setting_value VARCHAR(255) NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, setting_key),
        FOREIGN KEY(user_id) REFERENCES users(id),
        INDEX idx_user_setting (user_id, setting_key)
      )
    ");
    
    $pdo->exec("
      CREATE TABLE user_cache (
        user_id INT NOT NULL,
        cache_key VARCHAR(50) NOT NULL,
        cache_value TEXT,
        expires_at INT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, cache_key),
        FOREIGN KEY(user_id) REFERENCES users(id),
        INDEX idx_expires (expires_at)
      )
    ");
    
    $pdo->exec("
      CREATE TABLE achievements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        achievement_type VARCHAR(50) NOT NULL,
        achievement_value INT NOT NULL DEFAULT 1,
        unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        UNIQUE KEY unique_user_achievement (user_id, achievement_type),
        INDEX idx_user_achievements (user_id),
        INDEX idx_achievement_type (achievement_type)
      )
    ");
    
    $pdo->exec("
      CREATE TABLE user_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token_hash VARCHAR(64) NOT NULL,
        expires_at INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
        INDEX idx_token_hash (token_hash),
        INDEX idx_expires (expires_at),
        INDEX idx_user_id (user_id)
      )
    ");
  } else {
    // Check if max_energy column exists in energy table, add if missing
    $hasMaxEnergy = $pdo->query("
      SELECT COUNT(*) FROM information_schema.columns 
      WHERE table_schema = '".DB_NAME."' 
      AND table_name = 'energy' 
      AND column_name = 'max_energy'
    ")->fetchColumn();
    
    if (!$hasMaxEnergy) {
      $pdo->exec("ALTER TABLE energy ADD COLUMN max_energy INT NOT NULL DEFAULT 10");
    }
  }
}
runMigrations($pdo);
$pdo->exec("USE `".DB_NAME."`");


/** ================= Utility Functions ================= **/
function jsonErr(string $msg, int $code = 400): void {
  http_response_code($code);
  echo json_encode(['error' => $msg]);
  exit;
}

function getJson(): array {
  if (!in_array($_SERVER['REQUEST_METHOD'], ['POST','PUT','PATCH'])) {
    return [];
  }
  if (!empty($_SERVER['CONTENT_LENGTH']) && $_SERVER['CONTENT_LENGTH'] > 1024*1024) {
    jsonErr('Payload too large', 413);
  }
  $body = file_get_contents('php://input');
  return json_decode($body, true) ?: [];
}

function rateLimit(PDO $pdo): void {
  $ip   = $_SERVER['REMOTE_ADDR'] ?? '';
  $ep   = $_GET['action'] ?? '';
  $now  = time();
  $stmt = $pdo->prepare("SELECT COUNT(*) FROM api_logs WHERE ip = ? AND ts > ?");
  $stmt->execute([$ip, $now - 60]);
  $count = (int)$stmt->fetchColumn();
  if ($count > 60) {
    jsonErr('Rate limit exceeded', 429);
  }
  $pdo->prepare("INSERT INTO api_logs(ip, endpoint, ts) VALUES (?, ?, ?)")
      ->execute([$ip, $ep, $now]);
}
rateLimit($pdo);

function base58_decode(string $b58): string {
  $alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  $out = gmp_init(0);
  foreach (str_split($b58) as $c) {
    $out = gmp_add(gmp_mul($out, 58), strpos($alphabet, $c));
  }
  $dec = '';
  while (gmp_cmp($out, 0) > 0) {
    list($out, $rem) = [gmp_div_q($out, 256), gmp_mod($out, 256)];
    $dec = chr(gmp_intval($rem)) . $dec;
  }
  // handle leading zeros
  foreach (str_split($b58) as $c) {
    if ($c === '1') $dec = "\x00" . $dec; else break;
  }
  return $dec;
}

function verifyWalletSignature(string $pubKey, string $sigB64, string $msg): bool {
  $sig = base64_decode($sigB64, true);
  if ($sig === false) return false;
  $pub = base58_decode($pubKey);
  return sodium_crypto_sign_verify_detached($sig, $msg, $pub);
}

function base64url_encode(string $data): string {
  return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode(string $data): string {
  $pad = 4 - (strlen($data) % 4);
  if ($pad < 4) $data .= str_repeat('=', $pad);
  return base64_decode(strtr($data, '-_', '+/'));
}

function jwt_encode(array $payload, string $secret): string {
  $header = ['alg'=>'HS256','typ'=>'JWT'];
  $segments = [
    base64url_encode(json_encode($header)),
    base64url_encode(json_encode($payload))
  ];
  $sign_input = implode('.', $segments);
  $sig = hash_hmac('sha256', $sign_input, $secret, true);
  $segments[] = base64url_encode($sig);
  return implode('.', $segments);
}

function jwt_decode(string $token, string $secret): array {
  $parts = explode('.', $token);
  if (count($parts) !== 3) {
    throw new Exception('Invalid JWT format');
  }
  list($h64, $p64, $s64) = $parts;
  $sig = base64url_decode($s64);
  $valid = hash_hmac('sha256', "$h64.$p64", $secret, true);
  if (!hash_equals($valid, $sig)) {
    throw new Exception('Invalid JWT signature');
  }
  return json_decode(base64url_decode($p64), true);
}

function refillEnergy(PDO $pdo, int $userId): int {
  $now = time();
  $stmt = $pdo->prepare("SELECT energy, last_refill FROM energy WHERE user_id = ?");
  $stmt->execute([$userId]);
  $row = $stmt->fetch(PDO::FETCH_ASSOC);
  if (!$row) {
    $pdo->prepare("INSERT INTO energy(user_id, energy, last_refill) VALUES (?, 10, ?)")
        ->execute([$userId, $now]);
    return 10;
  }
  $elapsed = floor(($now - $row['last_refill']) / 3600);
  if ($elapsed <= 0) {
    return (int)$row['energy'];
  }
  $newEnergy = min(10, $row['energy'] + $elapsed);
  $pdo->prepare("UPDATE energy SET energy = ?, last_refill = ? WHERE user_id = ?")
      ->execute([$newEnergy, $now, $userId]);
  return $newEnergy;
}

use GuzzleHttp\Client;
function getOnchainBalance(string $ownerPk): float {
  $client = new Client();
  $resp = $client->post(SOLANA_RPC, [
    'json'=>[
      'jsonrpc'=>'2.0',
      'id'=>1,
      'method'=>'getTokenAccountsByOwner',
      'params'=>[
        $ownerPk,
        ['mint'=>GAME_TOKEN_MINT],
        ['encoding'=>'jsonParsed']
      ]
    ]
  ]);
  $data = json_decode($resp->getBody(), true);
  $sum = 0.0;
  foreach ($data['result']['value'] ?? [] as $acct) {
    $sum += $acct['account']['data']['parsed']['info']['tokenAmount']['uiAmount'] ?? 0;
  }
  return $sum;
}

/** ================ Authentication Middleware ================ **/
function requireAuth(PDO $pdo): array {
  // NUEVA ESTRATEGIA: Buscar token en cuerpo de la petición o query string
  $token = getAuthToken();
  
  if (!$token) {
    jsonErr('Missing authentication token', 401);
  }
  
  // Remove Bearer prefix if present
  $cleanToken = preg_replace('/^Bearer\s+/', '', $token);
  
  try {
    $data = jwt_decode($cleanToken, JWT_SECRET);
  } catch (Exception $e) {
    jsonErr('Invalid token', 401);
  }
  
  $stmt = $pdo->prepare("SELECT id FROM users WHERE public_key = ?");
  $stmt->execute([$data['publicKey']]);
  $user = $stmt->fetch(PDO::FETCH_ASSOC);
  if (!$user) {
    jsonErr('User not found', 401);
  }
  
  return ['publicKey' => $data['publicKey'], 'userId' => (int)$user['id']];
}

/**
 * Get authentication token from multiple sources
 */
function getAuthToken(): string {
  if (defined('DEBUG_MODE') && DEBUG_MODE) {
    error_log("=== SEARCHING FOR AUTH TOKEN ===");
  }
  
  // Método 1: En el cuerpo de la petición (POST/PUT/PATCH)
  if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH'])) {
    $body = file_get_contents('php://input');
    if ($body) {
      $data = json_decode($body, true);
      if ($data && isset($data['_auth_token'])) {
        if (defined('DEBUG_MODE') && DEBUG_MODE) {
          error_log("Found token in request body");
        }
        return $data['_auth_token'];
      }
    }
  }
  
  // Método 2: En query string (GET)
  if (isset($_GET['_auth_token'])) {
    if (defined('DEBUG_MODE') && DEBUG_MODE) {
      error_log("Found token in query string");
    }
    return $_GET['_auth_token'];
  }
  
  // Método 3: HTTP_AUTHORIZATION header (fallback)
  if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
    if (defined('DEBUG_MODE') && DEBUG_MODE) {
      error_log("Found token in HTTP_AUTHORIZATION header");
    }
    return $_SERVER['HTTP_AUTHORIZATION'];
  }
  
  // Método 4: getallheaders() fallback
  if (function_exists('getallheaders')) {
    $headers = getallheaders();
    foreach ($headers as $name => $value) {
      if (strtolower($name) === 'authorization') {
        if (defined('DEBUG_MODE') && DEBUG_MODE) {
          error_log("Found token via getallheaders()");
        }
        return $value;
      }
    }
  }
  
  // Método 5: Redirect header para Apache
  if (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
    if (defined('DEBUG_MODE') && DEBUG_MODE) {
      error_log("Found token via REDIRECT_HTTP_AUTHORIZATION");
    }
    return $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
  }
  
  if (defined('DEBUG_MODE') && DEBUG_MODE) {
    error_log("NO AUTH TOKEN FOUND ANYWHERE!");
  }
  
  return '';
}

/** ================= Routing ================= **/
$action = $_GET['action'] ?? '';

switch ($action) {

  // 1) GET NONCE (no auth)
  case 'auth/nonce':
    AntiCheat::validateRequestOrigin();
    AntiCheat::validateJsonPayload();
    $b = getJson();
    $pk = $b['publicKey'] ?? '';
    if (!$pk) jsonErr('publicKey required');
    $nonce = bin2hex(random_bytes(16));
    $pdo->prepare("REPLACE INTO nonces(public_key, nonce) VALUES (?, ?)")
        ->execute([$pk, $nonce]);
    echo json_encode(['nonce' => $nonce]);
    exit;


  // 2) LOGIN (no auth)
  case 'auth/login':
    AntiCheat::validateRequestOrigin();
    AntiCheat::validateJsonPayload();
    $b = getJson();
    foreach (['publicKey','signature','nonce'] as $f) {
      if (empty($b[$f])) jsonErr("$f required");
    }
    $stmt = $pdo->prepare("SELECT nonce FROM nonces WHERE public_key = ?");
    $stmt->execute([$b['publicKey']]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row || $row['nonce'] !== $b['nonce']) jsonErr('Invalid nonce', 401);
    if (!verifyWalletSignature($b['publicKey'], $b['signature'], $b['nonce'])) {
      jsonErr('Signature invalid', 401);
    }
    $pdo->prepare("INSERT IGNORE INTO users(public_key) VALUES(?)")
        ->execute([$b['publicKey']]);
    
    // Get user ID for new user setup
    $stmt = $pdo->prepare("SELECT id FROM users WHERE public_key = ?");
    $stmt->execute([$b['publicKey']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
      // Initialize basic data for new users
      try {
        $userId = $user['id'];
        $now = time();
        
        // Initialize energy
        $pdo->prepare("INSERT IGNORE INTO energy (user_id, energy, last_refill, max_energy) VALUES (?, 10, ?, 10)")
            ->execute([$userId, $now]);
        
        // Initialize reputation
        $pdo->prepare("INSERT IGNORE INTO reputation (user_id, rep) VALUES (?, 100)")
            ->execute([$userId]);
        
        // Check if this is a completely new user (no stats)
        $stmt = $pdo->prepare("SELECT total_missions FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $userStats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($userStats && $userStats['total_missions'] == 0) {
          // Give new users some demo stats so they don't start with all zeros
          $demoMissions = rand(3, 12);
          $demoRaids = rand(1, 4);
          $demoKills = rand(5, 25);
          
          $pdo->prepare("UPDATE users SET total_missions = ?, total_raids_won = ?, total_kills = ? WHERE id = ?")
              ->execute([$demoMissions, $demoRaids, $demoKills, $userId]);
        }
      } catch (Exception $e) {
        // Don't fail login if demo data setup fails
        if (defined('DEBUG_MODE') && DEBUG_MODE) {
          error_log("Demo data setup error: " . $e->getMessage());
        }
      }
    }
    
    $token = jwt_encode([
      'publicKey' => $b['publicKey'],
      'iat'       => time(),
      'exp'       => time() + 3600
    ], JWT_SECRET);
    echo json_encode(['token' => $token]);
    exit;


  // 3+) All other routes require a valid JWT
  default:
    $me = requireAuth($pdo);
    
    // Auto-populate basic user data on any authenticated request
    try {
      $pdo->prepare("INSERT IGNORE INTO energy (user_id, energy, last_refill, max_energy) VALUES (?, 10, ?, 10)")
          ->execute([$me['userId'], time()]);
      $pdo->prepare("INSERT IGNORE INTO reputation (user_id, rep) VALUES (?, 100)")
          ->execute([$me['userId']]);
    } catch (Exception $e) {
      // Ignore errors in auto-population
    }

    switch ($action) {

      // BUY SHIP
      case 'buy_ship':
        if (defined('DEBUG_MODE') && DEBUG_MODE) {
          error_log("=== BUY SHIP REQUEST ===");
          error_log("User ID: " . $me['userId']);
        }
        
        AntiCheat::validateRequestOrigin();
        
        // Auto-populate demo data for new users
        $pdo->beginTransaction();
        try {
          if (defined('DEBUG_MODE') && DEBUG_MODE) {
            error_log("Starting transaction for user setup");
          }
          
          // Initialize user stats if they don't exist
          $pdo->prepare("INSERT IGNORE INTO energy (user_id, energy, last_refill, max_energy) VALUES (?, 10, ?, 10)")
              ->execute([$me['userId'], time()]);
          $pdo->prepare("INSERT IGNORE INTO reputation (user_id, rep) VALUES (?, 100)")
              ->execute([$me['userId']]);
          
          if (defined('DEBUG_MODE') && DEBUG_MODE) {
            error_log("Initialized energy and reputation");
          }
          
          // Add some demo stats for new users
          $stmt = $pdo->prepare("SELECT total_missions FROM users WHERE id = ?");
          $stmt->execute([$me['userId']]);
          $user = $stmt->fetch(PDO::FETCH_ASSOC);
          
          if ($user && $user['total_missions'] == 0) {
            // Give new users some demo stats
            $pdo->prepare("UPDATE users SET total_missions = ?, total_raids_won = ?, total_kills = ? WHERE id = ?")
                ->execute([rand(5, 15), rand(1, 5), rand(10, 30), $me['userId']]);
            
            if (defined('DEBUG_MODE') && DEBUG_MODE) {
              error_log("Updated demo stats for new user");
            }
          }
          
          $pdo->commit();
          
          if (defined('DEBUG_MODE') && DEBUG_MODE) {
            error_log("Committed user setup transaction");
          }
        } catch (Exception $e) {
          $pdo->rollback();
          if (defined('DEBUG_MODE') && DEBUG_MODE) {
            error_log("Demo data population error: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
          }
          jsonErr('Failed to initialize user data: ' . $e->getMessage(), 500);
        }
        
        $pdo->beginTransaction();
        try {
          if (defined('DEBUG_MODE') && DEBUG_MODE) {
            error_log("Starting ship purchase transaction");
          }
          
          $stmt = $pdo->prepare("SELECT id FROM ships WHERE user_id = ?");
          $stmt->execute([$me['userId']]);
          $existingShip = $stmt->fetch();
          if ($existingShip) {
            $pdo->commit();
            if (defined('DEBUG_MODE') && DEBUG_MODE) {
              error_log("User already has ship: " . $existingShip['id']);
            }
            echo json_encode(['ship_id' => $existingShip['id'], 'already_owned' => true]);
            exit;
          }
          
          // Create ship with some demo balance for new users
          $demoBalance = rand(50, 200); // Give new users 50-200 BR to start
          
          if (defined('DEBUG_MODE') && DEBUG_MODE) {
            error_log("Creating new ship with balance: " . $demoBalance);
          }
          
          $pdo->prepare("INSERT INTO ships(user_id, br_balance) VALUES (?, ?)")
              ->execute([$me['userId'], $demoBalance]);
          $shipId = $pdo->lastInsertId();
          
          if (defined('DEBUG_MODE') && DEBUG_MODE) {
            error_log("Created ship with ID: " . $shipId);
          }
          
          // Update user stats
          $pdo->prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?")
              ->execute([$me['userId']]);
          
          $pdo->commit();
          
          if (defined('DEBUG_MODE') && DEBUG_MODE) {
            error_log("Successfully created ship and committed transaction");
          }
          
          echo json_encode(['ship_id' => $shipId, 'already_owned' => false, 'demo_balance' => $demoBalance]);
        } catch (Exception $e) {
          $pdo->rollback();
          if (defined('DEBUG_MODE') && DEBUG_MODE) {
            error_log("Ship creation error: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
          }
          jsonErr('Failed to create ship: ' . $e->getMessage(), 500);
        }
        exit;


      // USER PROFILE
      case 'user_profile':
        try {
          AntiCheat::validateRequestOrigin();
          
          // Ensure we have a valid user
          if (!$me || !$me['userId']) {
            jsonErr('User not authenticated', 401);
          }
          
          // Initialize energy and reputation if they don't exist
          $pdo->prepare("INSERT IGNORE INTO energy (user_id, energy, last_refill, max_energy) VALUES (?, 10, ?, 10)")
              ->execute([$me['userId'], time()]);
          $pdo->prepare("INSERT IGNORE INTO reputation (user_id, rep) VALUES (?, 100)")
              ->execute([$me['userId']]);
          
          $stmt = $pdo->prepare("
            SELECT u.id, u.public_key, u.created_at, u.last_login,
                   u.total_missions, u.total_raids_won, u.total_kills,
                   s.id as ship_id, s.level as ship_level, s.br_balance,
                   s.last_mission_ts, s.purchased_at,
                   e.energy, e.max_energy, e.last_refill,
                   r.rep as reputation
            FROM users u
            LEFT JOIN ships s ON u.id = s.user_id AND s.is_active = 1
            LEFT JOIN energy e ON u.id = e.user_id
            LEFT JOIN reputation r ON u.id = r.user_id
            WHERE u.id = ?
          ");
          $stmt->execute([$me['userId']]);
          $profile = $stmt->fetch(PDO::FETCH_ASSOC);
          
          if (!$profile) {
            jsonErr('User profile not found', 404);
          }
          
          // Update last login
          $pdo->prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?")
              ->execute([$me['userId']]);
          
          // Calculate current energy
          if ($profile['energy'] !== null) {
            $now = time();
            $elapsed = floor(($now - $profile['last_refill']) / 3600);
            if ($elapsed > 0) {
              $newEnergy = min($profile['max_energy'], $profile['energy'] + $elapsed);
              if ($newEnergy != $profile['energy']) {
                $pdo->prepare("UPDATE energy SET energy = ?, last_refill = ? WHERE user_id = ?")
                    ->execute([$newEnergy, $now, $me['userId']]);
                $profile['energy'] = $newEnergy;
              }
            }
          }
          
          // Format response
          $response = [
            'user_id' => (int)$profile['id'],
            'public_key' => $profile['public_key'],
            'created_at' => $profile['created_at'],
            'last_login' => $profile['last_login'],
            'stats' => [
              'total_missions' => (int)$profile['total_missions'],
              'total_raids_won' => (int)$profile['total_raids_won'],
              'total_kills' => (int)$profile['total_kills'],
              'reputation' => (int)($profile['reputation'] ?? 100)
            ],
            'ship' => null,
            'energy' => [
              'current' => (int)($profile['energy'] ?? 10),
              'max' => (int)($profile['max_energy'] ?? 10),
              'last_refill' => (int)($profile['last_refill'] ?? time())
            ]
          ];
          
          if ($profile['ship_id']) {
            $response['ship'] = [
              'id' => (int)$profile['ship_id'],
              'level' => (int)$profile['ship_level'],
              'balance' => (int)$profile['br_balance'],
              'last_mission_ts' => (int)$profile['last_mission_ts'],
              'purchased_at' => $profile['purchased_at']
            ];
          }
          
          echo json_encode($response);
          exit;
        } catch (Exception $e) {
          if (defined('DEBUG_MODE') && DEBUG_MODE) {
            error_log("User profile error: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
          }
          jsonErr('Failed to load user profile: ' . $e->getMessage(), 500);
        }




      // RAID SCAN
      case 'raid/scan':
        AntiCheat::validateRequestOrigin();
        $energy = refillEnergy($pdo, $me['userId']);
        if ($energy < 1) jsonErr('Not enough energy', 400);
        $pdo->prepare("UPDATE energy SET energy = energy - 1 WHERE user_id = ?")
            ->execute([$me['userId']]);
        
        // Obtener misiones raidables con más información
        $missions = $pdo->query("
          SELECT m.id, m.mission_type AS type, m.mode, m.reward, u.public_key AS owner
          FROM missions
          JOIN users u ON m.user_id = u.id
          WHERE mode='Unshielded' AND success=1 AND raided=0
            AND user_id <> {$me['userId']}
          ORDER BY m.ts_start DESC
          LIMIT 10
        ")->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['missions' => $missions, 'remainingEnergy' => $energy - 1]);
        exit;

      // GET PLAYER ENERGY
      case 'player_energy':
        AntiCheat::validateRequestOrigin();
        $energy = refillEnergy($pdo, $me['userId']);
        echo json_encode(['energy' => $energy]);
        exit;


      // SEND MISSION
      case 'send_mission':
        AntiCheat::validateRequestOrigin();
        AntiCheat::validateJsonPayload();
        $b = getJson();
        $type = $b['type'] ?? '';
        $mode = $b['mode'] ?? '';
        $signedBurnTx = $b['signedBurnTx'] ?? '';
        if (!$type || !$mode) jsonErr('type & mode required', 400);
        if (!$signedBurnTx) jsonErr('signedBurnTx required', 400);

        // validate parameters
        AntiCheat::validateMissionParams(
          $type, $mode,
          array_keys($REWARD_CONFIG),
          ['Shielded','Unshielded']
        );

        // submit on‐chain burn
        $http = new Client(['base_uri' => SOLANA_API_URL]);
        try {
          $http->post('/burn', ['json'=>['signedTx'=>$signedBurnTx]]);
        } catch (Exception $e) {
          jsonErr('On-chain burn failed: '.$e->getMessage(), 400);
        }

        $pdo->beginTransaction();
          // lock & fetch ship
          $stmt = $pdo->prepare("SELECT * FROM ships WHERE user_id = ? FOR UPDATE");
          $stmt->execute([$me['userId']]);
          $ship = $stmt->fetch(PDO::FETCH_ASSOC);
          if (!$ship) jsonErr('Buy a ship first', 400);

          // off‐chain anti‐cheat
          AntiCheat::enforceCooldown($ship);
          AntiCheat::enforceDailyLimit($pdo, $me['userId']);
          AntiCheat::preventReplay($pdo, $signedBurnTx, $me['userId']);

          list($chance, $minReward, $maxReward) = $REWARD_CONFIG[$type];
          $ok  = (mt_rand()/mt_getrandmax()) < $chance;
          $raw = $ok ? mt_rand($minReward, $maxReward) : 0;
          AntiCheat::validateMissionReward($type, $raw, $REWARD_CONFIG);
          $payout = ($mode==='Shielded') ? floor($raw*0.8) : $raw;

          // record mission
          $stmt = $pdo->prepare("
            INSERT INTO missions
              (ship_id,user_id,mission_type,mode,ts_start,success,reward,claimed)
            VALUES (?,?,?,?,?,?,?,1)
          ");
          $stmt->execute([
            $ship['id'],$me['userId'],$type,$mode,time(),$ok?1:0,$payout
          ]);

          // update off‐chain balance
          $newBalance = $ship['br_balance'] + $payout;
          $pdo->prepare("UPDATE ships SET last_mission_ts = ?, br_balance = ? WHERE id = ?")
              ->execute([time(), $newBalance, $ship['id']]);
        $pdo->commit();

        // mint reward on‐chain
        if ($ok && $payout > 0) {
          try {
            $http->post('/mint', [
              'json'=>[
                'recipient' => $me['publicKey'],
                'amount'    => $payout
              ]
            ]);
          } catch (Exception $e) {
            jsonErr('On-chain mint failed: '.$e->getMessage(), 500);
          }
        }

        echo json_encode([
          'success'    => $ok,
          'reward'     => $payout,
          'br_balance' => $newBalance
        ]);
        exit;


      // UPGRADE SHIP
      case 'upgrade_ship':
        AntiCheat::validateRequestOrigin();
        AntiCheat::validateJsonPayload();
        $b = getJson();
        $lvl = intval($b['level'] ?? 0);
        $costs = [2=>50,3=>100,4=>150,5=>225,6=>300,7=>400];
        if (!isset($costs[$lvl])) jsonErr('Invalid level', 400);

        $pdo->beginTransaction();
          $stmt = $pdo->prepare("SELECT * FROM ships WHERE user_id = ? FOR UPDATE");
          $stmt->execute([$me['userId']]);
          $ship = $stmt->fetch(PDO::FETCH_ASSOC);
          if (!$ship) jsonErr('No ship', 400);
          if ($lvl <= $ship['level']) jsonErr('Cannot downgrade', 400);
          if ($ship['br_balance'] < $costs[$lvl]) jsonErr('Not enough BR', 400);
          $newBR = $ship['br_balance'] - $costs[$lvl];
          $pdo->prepare("UPDATE ships SET level = ?, br_balance = ? WHERE id = ?")
              ->execute([$lvl, $newBR, $ship['id']]);
        $pdo->commit();

        echo json_encode(['level'=>$lvl, 'br_balance'=>$newBR]);
        exit;


      // RAID MISSION
      case 'raid_mission':
        AntiCheat::validateRequestOrigin();
        AntiCheat::validateJsonPayload();
        $b = getJson();
        $mid = intval($b['mission_id'] ?? 0);
        if (!$mid) jsonErr('mission_id required', 400);

        $pdo->beginTransaction();
          // lock mission
          $stmt = $pdo->prepare("SELECT * FROM missions WHERE id = ? FOR UPDATE");
          $stmt->execute([$mid]);
          $m = $stmt->fetch(PDO::FETCH_ASSOC);
          if (!$m) jsonErr('Mission not found', 404);
          if ($m['raided']) jsonErr('Already raided', 400);
          if ($m['mode'] === 'Shielded') {
            // penalize
            $pdo->prepare("UPDATE reputation SET rep = GREATEST(rep-10,0) WHERE user_id = ?")
                ->execute([$me['userId']]);
            jsonErr('Shielded: cannot raid (–10 rep)', 400);
          }

          // steal reward
          $stolen = $m['reward'];
          $stmt = $pdo->prepare("SELECT * FROM ships WHERE user_id = ? FOR UPDATE");
          $stmt->execute([$me['userId']]);
          $ship = $stmt->fetch(PDO::FETCH_ASSOC);
          if (!$ship) jsonErr('No ship', 400);
          $newBR = $ship['br_balance'] + $stolen;

          // update balances & mark raided
          $pdo->prepare("UPDATE ships SET br_balance = ? WHERE id = ?")
              ->execute([$newBR, $ship['id']]);
          $pdo->prepare("
            UPDATE missions
               SET raided = 1, raided_by = ?, ts_raid = ?
             WHERE id = ?
          ")->execute([$me['userId'], time(), $mid]);
          
          // Opcional: Notificar al jugador objetivo que fue raideado
          // En un juego real, esto podría activar una batalla defensiva
          // o enviar una notificación push
          
        $pdo->commit();

        echo json_encode(['stolen'=>$stolen,'br_balance'=>$newBR]);
        exit;


      // CLAIM REWARDS
      case 'claim_rewards':
        AntiCheat::validateRequestOrigin();
        $onchain = getOnchainBalance($me['publicKey']);
        echo json_encode(['claimable_AT' => $onchain]);
        exit;


      // WALLET TRANSPARENCY (no auth)
      case 'wallet/status':
        AntiCheat::validateRequestOrigin();
        $wallet = 'CommunityWalletPublicKey';
        $client = new Client();
        $resp = $client->post(SOLANA_RPC, [
          'json'=>[
            'jsonrpc'=>'2.0',
            'id'=>1,
            'method'=>'getBalance',
            'params'=>[$wallet]
          ]
        ]);
        $bal = json_decode($resp->getBody(), true)['result']['value'];
        echo json_encode(['wallet'=>$wallet,'balance'=>$bal,'unit'=>'lamports']);
        exit;


      // LIST MISSIONS FOR RAID
      case 'list_missions':
        AntiCheat::validateRequestOrigin();
        $stmt = $pdo->prepare("
          SELECT id, mission_type AS type, mode, reward
            FROM missions
           WHERE raided = 0
             AND mode = 'Unshielded'
             AND user_id <> ?
             AND claimed = 1
        ");
        $stmt->execute([$me['userId']]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        exit;


      // PENDING REWARDS
      case 'pending_missions':
        AntiCheat::validateRequestOrigin();
        $stmt = $pdo->prepare("
          SELECT id, mission_type AS source, reward AS amount
            FROM missions
           WHERE user_id = ?
             AND claimed = 0
        ");
        $stmt->execute([$me['userId']]);
        echo json_encode(['pending' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        exit;


      default:
        http_response_code(404);
        echo json_encode(['error'=>'Unknown action']);
        exit;
    }
}
