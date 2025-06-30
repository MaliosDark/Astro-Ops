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
define('DB_NAME',         'bonka_bonkartio');
define('DB_USER',         'bonka_bonusrtio');
define('DB_PASS',         '*OxlUH49*69i');
define('JWT_SECRET',      'OAZchPBiIuZu5goVp8HAe5FzUzXFsNBm');
define('SOLANA_RPC',      'https://api.devnet.solana.com');
define('GAME_TOKEN_MINT','CCmGDrD9jZarDEz1vrjKcE9rrJjL8VecDYjAWxhwhGPo');
define('SOLANA_API_URL',  'https://verify.bonkraiders.com');

// Debug mode constant
define('DEBUG_MODE', false); // Disable for production

// Treasury-safe mission config
$REWARD_CONFIG = [
  'MiningRun'   => [0.90,  3000,  6000],
  'BlackMarket' => [0.70,  6000, 10000],
  'ArtifactHunt'=> [0.50, 12000, 18000],
];
define('PARTICIPATION_FEE', 250);    // No burn fee for now


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
  try {
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `".DB_NAME."`");
  } catch (Exception $e) {
    // Database might already exist or user might not have CREATE privileges
    if (DEBUG_MODE) {
      error_log("Database creation warning: " . $e->getMessage());
    }
  }
  
  $pdo->exec("USE `".DB_NAME."`");
  
  // if no users table, run migrations.sql
  try {
    $has = $pdo->query("SHOW TABLES LIKE 'users'")->fetch();
  } catch (Exception $e) {
    if (DEBUG_MODE) {
      error_log("Table check error: " . $e->getMessage());
    }
    $has = false;
  }
  
  if (!$has) {
    // Create tables one by one with error handling
    $tables = [
      'users' => "
        CREATE TABLE IF NOT EXISTS users (
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
        CREATE TABLE IF NOT EXISTS nonces (
          public_key VARCHAR(64) NOT NULL PRIMARY KEY,
          nonce CHAR(32) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      ",
      'ships' => "
        CREATE TABLE IF NOT EXISTS ships (
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
        CREATE TABLE IF NOT EXISTS missions (
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
        CREATE TABLE IF NOT EXISTS api_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          ip VARCHAR(45) NOT NULL,
          endpoint VARCHAR(64) NOT NULL,
          ts INT NOT NULL,
          INDEX idx_ip_ts (ip, ts),
          INDEX idx_ts (ts)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      ",
      'energy' => "
        CREATE TABLE IF NOT EXISTS energy (
          user_id INT NOT NULL PRIMARY KEY,
          energy INT NOT NULL DEFAULT 10,
          last_refill INT NOT NULL DEFAULT 0,
          max_energy INT NOT NULL DEFAULT 10
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      ",
      'reputation' => "
        CREATE TABLE IF NOT EXISTS reputation (
          user_id INT NOT NULL PRIMARY KEY,
          rep INT NOT NULL DEFAULT 100
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      ",
      'user_settings' => "
        CREATE TABLE IF NOT EXISTS user_settings (
          user_id INT NOT NULL,
          setting_key VARCHAR(50) NOT NULL,
          setting_value VARCHAR(255) NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (user_id, setting_key),
          INDEX idx_user_setting (user_id, setting_key)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      ",
      'user_cache' => "
        CREATE TABLE IF NOT EXISTS user_cache (
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
        CREATE TABLE IF NOT EXISTS achievements (
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
        CREATE TABLE IF NOT EXISTS user_sessions (
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
      'token_transactions' => "
        CREATE TABLE IF NOT EXISTS token_transactions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          amount BIGINT NOT NULL,
          tx_hash VARCHAR(100) NULL,
          tx_type ENUM('mission_reward', 'raid_reward', 'claim', 'withdraw', 'upgrade_cost', 'burn', 'ship_purchase') NOT NULL,
          status ENUM('pending', 'completed', 'failed') NOT NULL DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          completed_at TIMESTAMP NULL,
          INDEX idx_user_id (user_id),
          INDEX idx_status (status),
          INDEX idx_tx_type (tx_type),
          FOREIGN KEY (user_id) REFERENCES users(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      ",
      'token_withdrawals' => "
        CREATE TABLE IF NOT EXISTS token_withdrawals (
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
        if (DEBUG_MODE) {
          error_log("Created table: $tableName");
        }
      } catch (Exception $e) {
        if (DEBUG_MODE) {
          error_log("Error creating table $tableName: " . $e->getMessage());
        }
        // Continue with other tables even if one fails
      }
    }
  } else {
    // Tables exist, check for missing columns
    try {
      $hasMaxEnergy = $pdo->query("
        SELECT COUNT(*) FROM information_schema.columns 
        WHERE table_schema = '".DB_NAME."' 
        AND table_name = 'energy' 
        AND column_name = 'max_energy'
      ")->fetchColumn();
      
      if (!$hasMaxEnergy) {
        $pdo->exec("ALTER TABLE energy ADD COLUMN max_energy INT NOT NULL DEFAULT 10");
      }
    } catch (Exception $e) {
      if (DEBUG_MODE) {
        error_log("Error checking/adding max_energy column: " . $e->getMessage());
      }
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
  // Use globally stored JSON input instead of re-reading php://input
  return $GLOBALS['_json_input'] ?: [];
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
    error_log("Request method: " . $_SERVER['REQUEST_METHOD']);
    error_log("Query string: " . ($_SERVER['QUERY_STRING'] ?? 'none'));
    error_log("Has JSON input: " . (isset($GLOBALS['_json_input']) ? 'yes' : 'no'));
  }
  
  // Method 1: In query string (for GET requests)
  if (isset($_GET['_auth_token'])) {
    if (defined('DEBUG_MODE') && DEBUG_MODE) {
      error_log("Found token in query string, length: " . strlen($_GET['_auth_token']));
    }
    return $_GET['_auth_token'];
  }
  
  // Method 2: In request body (POST/PUT/PATCH)
  if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH'])) {
    // Use globally stored JSON input instead of re-reading php://input
    if ($GLOBALS['_json_input'] && isset($GLOBALS['_json_input']['_auth_token'])) {
        if (defined('DEBUG_MODE') && DEBUG_MODE) {
          error_log("Found token in request body, length: " . strlen($GLOBALS['_json_input']['_auth_token']));
        }
        return $GLOBALS['_json_input']['_auth_token'];
    }
  }
  
  // Method 3: HTTP_AUTHORIZATION header (fallback)
  if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
    if (defined('DEBUG_MODE') && DEBUG_MODE) {
      error_log("Found token in HTTP_AUTHORIZATION header");
    }
    return $_SERVER['HTTP_AUTHORIZATION'];
  }
  
  // Method 4: getallheaders() fallback
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
  
  // Method 5: Redirect header for Apache
  if (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
    if (defined('DEBUG_MODE') && DEBUG_MODE) {
      error_log("Found token via REDIRECT_HTTP_AUTHORIZATION");
    }
    return $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
  }
  
  if (defined('DEBUG_MODE') && DEBUG_MODE) {
    error_log("NO AUTH TOKEN FOUND ANYWHERE!");
    error_log("Available GET params: " . print_r(array_keys($_GET), true));
    error_log("Available JSON keys: " . print_r($GLOBALS['_json_input'] ? array_keys($GLOBALS['_json_input']) : [], true));
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
        
        // Initialize real user data (no demo data)
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
          
          $pdo->commit();
          
          if (defined('DEBUG_MODE') && DEBUG_MODE) {
            error_log("Committed user setup transaction");
          }
        } catch (Exception $e) {
          $pdo->rollback();
          if (defined('DEBUG_MODE') && DEBUG_MODE) {
            error_log("User initialization error: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
          }
          // Don't fail ship purchase if user init fails
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
          
          // Create ship with ZERO balance (real game progression)
          $startingBalance = 0; // Users must earn their BR through real gameplay
          
          if (defined('DEBUG_MODE') && DEBUG_MODE) {
            error_log("Creating new ship with starting balance: " . $startingBalance);
          }
          
          $pdo->prepare("INSERT INTO ships(user_id, br_balance) VALUES (?, ?)")
              ->execute([$me['userId'], $startingBalance]);
          $shipId = $pdo->lastInsertId();
          
          if (defined('DEBUG_MODE') && DEBUG_MODE) {
            error_log("Created ship with ID: " . $shipId);
          }
          
          // Record ship purchase transaction
          $pdo->prepare("
            INSERT INTO token_transactions (user_id, amount, tx_type, status, ship_id)
            VALUES (?, ?, 'ship_purchase', 'completed', ?)
          ")->execute([$me['userId'], 0, $shipId]); // Assuming 0 BR cost in-game for ship purchase

          // Update user stats
          $pdo->prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?")
              ->execute([$me['userId']]);
          
          $pdo->commit();
          
          if (defined('DEBUG_MODE') && DEBUG_MODE) {
            error_log("Successfully created ship and committed transaction");
          }
          
          echo json_encode(['ship_id' => $shipId, 'already_owned' => false, 'starting_balance' => $startingBalance]);
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


      // NEW: Get Wallet Balances (On-chain and In-game)
      case 'wallet_balance':
        AntiCheat::validateRequestOrigin();
        $onchain_balance = getOnchainBalance($me['publicKey']);
        $stmt = $pdo->prepare("SELECT br_balance FROM ships WHERE user_id = ?");
        $stmt->execute([$me['userId']]);
        $ship_balance = $stmt->fetchColumn();
        echo json_encode([
          'onchain_balance' => $onchain_balance,
          'ingame_balance' => (int)$ship_balance
        ]);
        exit;

      // MODIFIED: Claim Rewards (now claims in-game balance)
      case 'claim_rewards':
        AntiCheat::validateRequestOrigin();
        $pdo->beginTransaction();
        try {
          $stmt = $pdo->prepare("SELECT br_balance FROM ships WHERE user_id = ? FOR UPDATE");
          $stmt->execute([$me['userId']]);
          $claimable_amount = (int)$stmt->fetchColumn();

          if ($claimable_amount <= 0) {
            $pdo->rollback();
            jsonErr('No tokens to claim', 400);
          }

          // Record transaction
          $pdo->prepare("
            INSERT INTO token_transactions (user_id, amount, tx_type, status)
            VALUES (?, ?, 'claim', 'completed')
          ")->execute([$me['userId'], $claimable_amount]);

          // Reset ship's in-game balance
          $pdo->prepare("UPDATE ships SET br_balance = 0 WHERE user_id = ?")
              ->execute([$me['userId']]);

          $pdo->commit();
          echo json_encode(['claimable_AT' => $claimable_amount]);
        } catch (Exception $e) {
          $pdo->rollback();
          jsonErr('Claim failed: ' . $e->getMessage(), 500);
        }
        exit;

      // NEW: Withdraw Tokens (from in-game to on-chain, real transfer)
      case 'withdraw_tokens':
        AntiCheat::validateRequestOrigin();
        AntiCheat::validateJsonPayload();
        $b = getJson();
        $amount = intval($b['amount'] ?? 0); // Amount is in UI units, assuming 0 decimals for game token

        if ($amount <= 0) jsonErr('Amount must be positive', 400);

        $pdo->beginTransaction();
        try {
          // 1. Lock ship balance and check funds
          $stmt = $pdo->prepare("SELECT br_balance FROM ships WHERE user_id = ? FOR UPDATE");
          $stmt->execute([$me['userId']]);
          $current_ingame_balance = (int)$stmt->fetchColumn();

          if ($current_ingame_balance < $amount) {
            $pdo->rollback();
            jsonErr('Insufficient in-game balance', 400);
          }

          $new_ingame_balance = $current_ingame_balance - $amount;

          // 2. Record transaction as pending
          $stmt = $pdo->prepare("
            INSERT INTO token_transactions (user_id, amount, tx_type, status, notes)
            VALUES (?, ?, 'withdraw', 'pending', 'Withdrawal initiated')
          ");
          $stmt->execute([$me['userId'], $amount]);
          $transaction_id = $pdo->lastInsertId(); // Get the ID of the pending transaction

          // 3. Call Node.js microservice to mint tokens to user's wallet
          $client = new Client();
          $mint_tx_hash = null;
          $mint_success = false;
          $mint_error_message = null;

          try {
            $mint_resp = $client->post(SOLANA_API_URL . '/mint', [
              'json' => [
                'recipient' => $me['publicKey'], // User's public key
                'amount' => $amount // Amount in raw units (assuming 0 decimals)
              ]
            ]);
            $mint_data = json_decode($mint_resp->getBody(), true);
            $mint_tx_hash = $mint_data['signature'] ?? null;
            
            if ($mint_tx_hash) {
                $mint_success = true;
            } else {
                $mint_error_message = 'No signature returned from mint service';
            }
          } catch (Exception $e) {
            $mint_error_message = 'Solana mint transaction failed: ' . $e->getMessage();
          }

          // 4. Update transaction status based on minting result
          if ($mint_success) {
            // Deduct from ship's in-game balance
            $pdo->prepare("UPDATE ships SET br_balance = ? WHERE user_id = ?")
                ->execute([$new_ingame_balance, $me['userId']]);

            // Update token_transactions to completed
            $pdo->prepare("
              UPDATE token_transactions SET status = 'completed', tx_hash = ?, completed_at = CURRENT_TIMESTAMP
              WHERE id = ?
            ")->execute([$mint_tx_hash, $transaction_id]);
            
            $pdo->commit();
            echo json_encode(['success' => true, 'br_balance' => $new_ingame_balance, 'mint_tx_hash' => $mint_tx_hash, 'id' => $transaction_id]);
          } else {
            // Update token_transactions to failed and rollback in-game balance deduction
            $pdo->prepare("
              UPDATE token_transactions SET status = 'failed', notes = ?, completed_at = CURRENT_TIMESTAMP
              WHERE id = ?
            ")->execute([$mint_error_message, $transaction_id]);
            
            $pdo->rollback(); // Revert the in-game balance deduction
            jsonErr('Withdrawal failed: ' . ($mint_error_message ?: 'Unknown error during minting'), 500);
          }
        } catch (Exception $e) {
          $pdo->rollback();
          // If transaction_id exists, update its status to failed
          if (isset($transaction_id)) {
            $pdo->prepare("
              UPDATE token_transactions SET status = 'failed', notes = ?, completed_at = CURRENT_TIMESTAMP
              WHERE id = ?
            ")->execute(['Internal server error: ' . $e->getMessage(), $transaction_id]);
          }
          jsonErr('Withdrawal failed: ' . $e->getMessage(), 500);
        }
        exit;

      // NEW: Get Transaction History
      case 'transaction_history':
        AntiCheat::validateRequestOrigin();
        $stmt = $pdo->prepare("
          SELECT id, amount, tx_type, status, created_at
          FROM token_transactions
          WHERE user_id = ?
          ORDER BY created_at DESC
          LIMIT 50
        ");
        $stmt->execute([$me['userId']]);
        $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['transactions' => $transactions]);
        exit;


      // RAID SCAN
      case 'raid/scan':
        AntiCheat::validateRequestOrigin();
        
        try {
          // Refill energy first
          $energy = refillEnergy($pdo, $me['userId']);
          if ($energy < 1) {
            jsonErr('Not enough energy to scan', 400);
          }
          
          // Deduct 1 energy for scanning
          $pdo->prepare("UPDATE energy SET energy = energy - 1 WHERE user_id = ?")
              ->execute([$me['userId']]);
          
          // Get REAL raidable missions from actual users
          $stmt = $pdo->prepare("
            SELECT m.id, m.mission_type AS type, m.mode, m.reward,
                   u.public_key AS owner, m.ts_start, m.ts_complete,
                   SUBSTRING(u.public_key, 1, 8) AS owner_short,
                   u.total_missions, u.total_raids_won, u.total_kills
            FROM missions m
            JOIN users u ON m.user_id = u.id
            WHERE m.mode = 'Unshielded' 
              AND m.success = 1 
              AND m.raided = 0
              AND m.claimed = 1
              AND m.user_id != ?
              AND m.ts_complete > ?
            ORDER BY m.ts_start DESC
            LIMIT 15
          ");
          
          // Show missions from the last 12 hours to keep it fresh
          $halfDayAgo = time() - (12 * 3600);
          $stmt->execute([$me['userId'], $halfDayAgo]);
          $missions = $stmt->fetchAll(PDO::FETCH_ASSOC);
          
          // If no real missions found, get some recent users and create realistic missions
          if (empty($missions)) {
            // Get other real users from the database
            $stmt = $pdo->prepare("
              SELECT id, public_key, total_missions, total_raids_won, total_kills,
                     SUBSTRING(public_key, 1, 8) AS owner_short
              FROM users 
              WHERE id != ? 
              ORDER BY last_login DESC 
              LIMIT 8
            ");
            $stmt->execute([$me['userId']]);
            $otherUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (!empty($otherUsers)) {
              // Create realistic missions based on real users
              $missionTypes = ['MiningRun', 'BlackMarket', 'ArtifactHunt'];
              $baseRewards = ['MiningRun' => 4500, 'BlackMarket' => 8000, 'ArtifactHunt' => 15000];
              
              foreach ($otherUsers as $i => $user) {
                $missionType = $missionTypes[array_rand($missionTypes)];
                $baseReward = $baseRewards[$missionType];
                $variance = rand(80, 120) / 100; // ±20% variance
                $finalReward = floor($baseReward * $variance);
                
                $missions[] = [
                  'id' => 9990 + $i, // Use high IDs to distinguish from real missions
                  'type' => $missionType,
                  'mode' => 'Unshielded',
                  'reward' => $finalReward,
                  'owner' => $user['public_key'],
                  'owner_short' => $user['owner_short'],
                  'ts_start' => time() - rand(1800, 7200), // 30min to 2h ago
                  'total_missions' => $user['total_missions'],
                  'total_raids_won' => $user['total_raids_won'],
                  'total_kills' => $user['total_kills']
                ];
              }
            }
          }
          
          if (defined('DEBUG_MODE') && DEBUG_MODE) {
            error_log("Raid scan found " . count($missions) . " missions for user " . $me['userId']);
          }
          
          echo json_encode([
            'missions' => $missions, 
            'remainingEnergy' => $energy - 1,
            'scanned_at' => time()
          ]);
          
        } catch (Exception $e) {
          if (defined('DEBUG_MODE') && DEBUG_MODE) {
            error_log("Raid scan error: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
          }
          jsonErr('Scan failed: ' . $e->getMessage(), 500);
        }
        
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
        $signedBurnTx = $b['signedBurnTx'] ?? ''; // This is the user-signed burn transaction
        if (!$type || !$mode) jsonErr('type & mode required', 400);
        if (!$signedBurnTx) jsonErr('signedBurnTx required', 400);

        // validate parameters
        AntiCheat::validateMissionParams(
          $type, $mode,
          array_keys($REWARD_CONFIG),
          ['Shielded','Unshielded']
        );

        try {
          $pdo->beginTransaction();
          
          // lock & fetch ship
          $stmt = $pdo->prepare("SELECT * FROM ships WHERE user_id = ? FOR UPDATE");
          $stmt->execute([$me['userId']]);
          $ship = $stmt->fetch(PDO::FETCH_ASSOC);
          if (!$ship) {
            $pdo->rollback();
            jsonErr('Buy a ship first', 400);
          }

          // off‐chain anti‐cheat
          AntiCheat::enforceCooldown($ship);
          AntiCheat::enforceDailyLimit($pdo, $me['userId']);
          
          // --- NEW: Send burn transaction to Solana via Node.js microservice ---
          $client = new Client();
          try {
            $burn_resp = $client->post(SOLANA_API_URL . '/burn', [
              'json' => ['signedTx' => $signedBurnTx]
            ]);
            $burn_data = json_decode($burn_resp->getBody(), true);
            $burn_tx_hash = $burn_data['signature'] ?? null;
            if (!$burn_tx_hash) {
                throw new Exception('Solana burn transaction failed: No signature returned');
            }
            // Prevent replay using the actual transaction hash
            AntiCheat::preventReplay($pdo, $burn_tx_hash, $me['userId']);

            // Record burn transaction (cost)
            $pdo->prepare("
              INSERT INTO token_transactions (user_id, amount, tx_type, status, tx_hash)
              VALUES (?, ?, 'burn', 'completed', ?)
            ")->execute([$me['userId'], -PARTICIPATION_FEE, $burn_tx_hash]); // Negative amount for cost

          } catch (Exception $e) {
            $pdo->rollback();
            jsonErr('Failed to process burn transaction: ' . $e->getMessage(), 500);
          }
          // --- END NEW ---

          list($chance, $minReward, $maxReward) = $REWARD_CONFIG[$type];
          $ok  = (mt_rand()/mt_getrandmax()) < $chance;
          $raw = $ok ? mt_rand($minReward, $maxReward) : 0;
          AntiCheat::validateMissionReward($type, $raw, $REWARD_CONFIG);
          
          // Apply mode modifier
          $payout = ($mode === 'Shielded') ? floor($raw * 0.8) : $raw;

          // Record mission in database
          $stmt = $pdo->prepare("
            INSERT INTO missions
              (ship_id, user_id, mission_type, mode, ts_start, ts_complete, success, reward, claimed)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
          ");
          $now = time();
          $stmt->execute([
            $ship['id'], $me['userId'], $type, $mode, $now, $now + 300, $ok ? 1 : 0, $payout
          ]);
          $missionId = $pdo->lastInsertId(); // Get the ID of the newly inserted mission
          
          // Update ship balance and mission timestamp
          $newBalance = $ship['br_balance'] + $payout;
          $pdo->prepare("UPDATE ships SET last_mission_ts = ?, br_balance = ? WHERE id = ?")
              ->execute([$now, $newBalance, $ship['id']]);
          
          // Record mission reward transaction
          if ($ok) {
            $pdo->prepare("
              INSERT INTO token_transactions (user_id, amount, tx_type, status, tx_hash, mission_id, ship_id)
              VALUES (?, ?, 'mission_reward', 'completed', ?, ?, ?)
            ")->execute([$me['userId'], $payout, $burn_tx_hash, $missionId, $ship['id']]); // Associate burn tx hash with mission
          }

          // Update user stats
          $pdo->prepare("UPDATE users SET total_missions = total_missions + 1 WHERE id = ?")
              ->execute([$me['userId']]);
          
          $pdo->commit();
          
          if (defined('DEBUG_MODE') && DEBUG_MODE) {
            error_log("Mission completed: User {$me['userId']} earned {$payout} BR from {$type}");
          }
          
          echo json_encode([
            'success' => $ok,
            'reward' => $payout,
            'br_balance' => $newBalance,
            'mission_type' => $type,
            'mode' => $mode,
            'burn_tx_hash' => $burn_tx_hash // Return burn tx hash to frontend
          ]);
          
        } catch (Exception $e) {
          $pdo->rollback();
          if (defined('DEBUG_MODE') && DEBUG_MODE) {
            error_log("Send mission error: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
          }
          jsonErr('Mission failed: ' . $e->getMessage(), 500);
        }
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
          
          // Record upgrade cost transaction
          $pdo->prepare("
            INSERT INTO token_transactions (user_id, amount, tx_type, status, ship_id)
            VALUES (?, ?, 'upgrade_cost', 'completed', ?)
          ")->execute([$me['userId'], -$costs[$lvl], $ship['id']]); // Negative amount for cost

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

        // Handle demo missions (IDs >= 9990)
        if ($mid >= 9990) {
          // Demo mission raid - simulate success
          $demoRewards = [
            9999 => 4500,
            9998 => 8000, 
            9997 => 15000
          ];
          
          $stolen = $demoRewards[$mid] ?? 1000;
          
          // Get user's ship and add reward
          $stmt = $pdo->prepare("SELECT * FROM ships WHERE user_id = ?");
          $stmt->execute([$me['userId']]);
          $ship = $stmt->fetch(PDO::FETCH_ASSOC);
          
          if (!$ship) {
            jsonErr('No ship found', 400);
          }
          
          $newBR = $ship['br_balance'] + $stolen;
          
          // Update balance
          $pdo->prepare("UPDATE ships SET br_balance = ? WHERE id = ?")
              ->execute([$newBR, $ship['id']]);
          
          // Update user stats
          $pdo->prepare("UPDATE users SET total_raids_won = total_raids_won + 1 WHERE id = ?")
              ->execute([$me['userId']]);
          
          // Record raid reward transaction
          $pdo->prepare("
            INSERT INTO token_transactions (user_id, amount, tx_type, status)
            VALUES (?, ?, 'raid_reward', 'completed')
          ")->execute([$me['userId'], $stolen]);

          if (defined('DEBUG_MODE') && DEBUG_MODE) {
            error_log("Demo raid successful: User {$me['userId']} stole {$stolen} BR from demo mission {$mid}");
          }
          
          echo json_encode(['stolen' => $stolen, 'br_balance' => $newBR, 'demo' => true]);
          exit;
        }
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
          
          // Record raid reward transaction
          $pdo->prepare("
            INSERT INTO token_transactions (user_id, amount, tx_type, status)
            VALUES (?, ?, 'raid_reward', 'completed')
          ")->execute([$me['userId'], $stolen]);

          // Opcional: Notificar al jugador objetivo que fue raideado
          // En un juego real, esto podría activar una batalla defensiva
          // o enviar una notificación push
          
        $pdo->commit();

        echo json_encode(['stolen'=>$stolen,'br_balance'=>$newBR]);
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
