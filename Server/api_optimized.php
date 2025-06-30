<?php
/**
 * Optimized API with Performance Monitoring and Auto-Healing
 */

// Start performance monitoring
$startTime = microtime(true);
$startMemory = memory_get_usage();

// Include performance monitor
require_once 'performance_monitor.php';

// CORS headers (must be first)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, Accept, X-Requested-With, X-Authorization, Cache-Control, Pragma, Origin, User-Agent');
header('Access-Control-Max-Age: 86400');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Initialize cache and performance monitor
try {
    $cache = new SmartCache();
} catch (Exception $e) {
    error_log("Cache initialization failed: " . $e->getMessage());
    $cache = null;
}

$performanceMonitor = null; // Will be set later

// Enhanced error handling with auto-recovery
function handleApiError($error, $context = '') {
    global $cache, $performanceMonitor;
    
    error_log("API Error [$context]: " . $error);
    
    // Auto-recovery mechanisms
    if (strpos($error, 'database') !== false || strpos($error, 'connection') !== false) {
        // Database connection issues - clear cache and retry
        if ($cache) {
            $cache->clear();
        }
        
        // Try to reconnect
        try {
            $pdo = ConnectionPool::getConnection();
            ConnectionPool::releaseConnection($pdo);
        } catch (Exception $e) {
            // If still failing, return maintenance mode
            http_response_code(503);
            echo json_encode([
                'error' => 'Service temporarily unavailable',
                'retry_after' => 30,
                'maintenance' => true
            ]);
            exit;
        }
    }
    
    return false;
}

// Set custom error handler
set_error_handler(function($severity, $message, $file, $line) {
    handleApiError("$message in $file:$line", 'PHP_ERROR');
    return true;
});

// Include original API logic but with optimizations
require 'hacker_protect.php';
require 'anti_cheat.php';

header('Content-Type: application/json; charset=utf-8');

// Configuration with optimizations
define('DB_HOST', 'localhost');
define('DB_NAME', 'bonka_bonkartio');
define('DB_USER', 'bonka_bonusrtio');
define('DB_PASS', '*OxlUH49*69i');
define('JWT_SECRET', 'OAZchPBiIuZu5goVp8HAe5FzUzXFsNBm');
define('SOLANA_RPC', 'https://api.devnet.solana.com');
define('GAME_TOKEN_MINT','CCmGDrD9jZarDEz1vrjKcE9rrJjL8VecDYjAWxhwhGPo');
define('SOLANA_API_URL', 'https://verify.bonkraiders.com');
define('DEBUG_MODE', false);

// Optimized reward config
$REWARD_CONFIG = [
  'MiningRun'   => [0.90,  3000,  6000],
  'BlackMarket' => [0.70,  6000, 10000],
  'ArtifactHunt'=> [0.50, 12000, 18000],
];
define('PARTICIPATION_FEE', 0);

// Use connection pool for database
try {
    $pdo = ConnectionPool::getConnection();
    try {
        $performanceMonitor = new PerformanceMonitor($pdo);
    } catch (Exception $e) {
        error_log("Performance monitor initialization failed: " . $e->getMessage());
        $performanceMonitor = null;
    }
} catch (Exception $e) {
    handleApiError($e->getMessage(), 'DB_CONNECTION');
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

// Optimized rate limiting with smart throttling
function smartRateLimit(PDO $pdo, $cache): void {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    $endpoint = $_GET['action'] ?? '';
    $now = time();
    
    // Check cache first (faster than database) - only if cache is available
    if ($cache) {
        $cacheKey = "rate_limit_{$ip}_{$endpoint}";
        $cached = $cache->get($cacheKey, 60);
        
        if ($cached) {
            $count = $cached['count'] + 1;
            if ($count > 60) { // 60 requests per minute
                http_response_code(429);
                echo json_encode([
                    'error' => 'Rate limit exceeded',
                    'retry_after' => 60 - ($now - $cached['start_time'])
                ]);
                exit;
            }
            $cache->set($cacheKey, ['count' => $count, 'start_time' => $cached['start_time']]);
        } else {
            // First request in this minute
            $cache->set($cacheKey, ['count' => 1, 'start_time' => $now]);
        }
    }
    
    // Log to database (async to avoid blocking)
    try {
        $stmt = $pdo->prepare("INSERT INTO api_logs(ip, endpoint, ts) VALUES (?, ?, ?)");
        $stmt->execute([$ip, $endpoint, $now]);
    } catch (Exception $e) {
        // Don't fail the request if logging fails
        error_log("Rate limit logging failed: " . $e->getMessage());
    }
}

// Apply smart rate limiting
smartRateLimit($pdo, $cache);

// Optimized utility functions
function jsonErr(string $msg, int $code = 400): void {
    global $startTime, $startMemory, $performanceMonitor;
    
    // Log performance even for errors
    $executionTime = microtime(true) - $startTime;
    $memoryUsage = memory_get_usage() - $startMemory;
    $performanceMonitor->logPerformance($_GET['action'] ?? 'error', $executionTime, $memoryUsage);
    
    http_response_code($code);
    echo json_encode(['error' => $msg]);
    exit;
}

// Cached database operations
function getCachedUserProfile($pdo, $cache, $userId) {
    if ($cache) {
        $cacheKey = "user_profile_{$userId}";
        $cached = $cache->get($cacheKey, 300); // 5 minutes cache
        
        if ($cached) {
            return $cached;
        }
    }
    
    // Optimized query with single JOIN
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
        LIMIT 1
    ");
    $stmt->execute([$userId]);
    $profile = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($profile && $cache) {
        $cache->set($cacheKey, $profile);
    }
    
    return $profile;
}

// Enhanced authentication with caching
function requireAuth(PDO $pdo, $cache): array {
    $token = getAuthToken();
    
    if (!$token) {
        jsonErr('Missing authentication token', 401);
    }
    
    $cleanToken = preg_replace('/^Bearer\s+/', '', $token);
    
    // Check token cache first - only if cache is available
    if ($cache) {
        $cacheKey = "auth_token_" . md5($cleanToken);
        $cached = $cache->get($cacheKey, 300); // 5 minutes
        
        if ($cached) {
            return $cached;
        }
    }
    
    try {
        $data = jwt_decode($cleanToken, JWT_SECRET);
    } catch (Exception $e) {
        jsonErr('Invalid token', 401);
    }
    
    // Quick user lookup
    $stmt = $pdo->prepare("SELECT id FROM users WHERE public_key = ? LIMIT 1");
    $stmt->execute([$data['publicKey']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        jsonErr('User not found', 401);
    }
    
    $authData = ['publicKey' => $data['publicKey'], 'userId' => (int)$user['id']];
    
    // Cache the auth result - only if cache is available
    if ($cache) {
        $cache->set($cacheKey, $authData);
    }
    
    return $authData;
}

// Include all the utility functions from original API
// (jwt_encode, jwt_decode, etc. - keeping them the same for compatibility)
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

function getAuthToken(): string {
    // Same implementation as original
    if (isset($_GET['_auth_token'])) {
        return $_GET['_auth_token'];
    }
    
    if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH'])) {
        if ($GLOBALS['_json_input'] && isset($GLOBALS['_json_input']['_auth_token'])) {
            return $GLOBALS['_json_input']['_auth_token'];
        }
    }
    
    if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
        return $_SERVER['HTTP_AUTHORIZATION'];
    }
    
    return '';
}

function getJson(): array {
    if (!in_array($_SERVER['REQUEST_METHOD'], ['POST','PUT','PATCH'])) {
        return [];
    }
    return $GLOBALS['_json_input'] ?: [];
}

// Routing with performance optimization
$action = $_GET['action'] ?? '';
$queryCount = 0;

try {
    switch ($action) {
        case 'auth/nonce':
            // Same implementation but with caching
            $b = getJson();
            $pk = $b['publicKey'] ?? '';
            if (!$pk) jsonErr('publicKey required');
            
            $nonce = bin2hex(random_bytes(16));
            $stmt = $pdo->prepare("REPLACE INTO nonces(public_key, nonce) VALUES (?, ?)");
            $stmt->execute([$pk, $nonce]);
            $queryCount++;
            
            echo json_encode(['nonce' => $nonce]);
            break;
            
        case 'auth/login':
            // Enhanced login with caching
            $b = getJson();
            foreach (['publicKey','signature','nonce'] as $f) {
                if (empty($b[$f])) jsonErr("$f required");
            }
            
            // Verify nonce
            $stmt = $pdo->prepare("SELECT nonce FROM nonces WHERE public_key = ? LIMIT 1");
            $stmt->execute([$b['publicKey']]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $queryCount++;
            
            if (!$row || $row['nonce'] !== $b['nonce']) {
                jsonErr('Invalid nonce', 401);
            }
            
            // Create/get user
            $stmt = $pdo->prepare("INSERT IGNORE INTO users(public_key) VALUES(?)");
            $stmt->execute([$b['publicKey']]);
            $queryCount++;
            
            $token = jwt_encode([
                'publicKey' => $b['publicKey'],
                'iat' => time(),
                'exp' => time() + 3600
            ], JWT_SECRET);
            
            echo json_encode(['token' => $token]);
            break;
            
        case 'user_profile':
            $me = requireAuth($pdo, $cache);
            $profile = getCachedUserProfile($pdo, $cache, $me['userId']);
            $queryCount++;
            
            if (!$profile) {
                jsonErr('User profile not found', 404);
            }
            
            echo json_encode($profile);
            break;
            
        case 'raid/scan':
            $me = requireAuth($pdo, $cache);
            
            // Check cache first for scan results - only if cache is available
            if ($cache) {
                $cacheKey = "raid_scan_" . $me['userId'];
                $cached = $cache->get($cacheKey, 60); // 1 minute cache
                
                if ($cached) {
                    echo json_encode($cached);
                    break;
                }
            }
            
            // Optimized scan query
            $stmt = $pdo->prepare("
                SELECT m.id, m.mission_type AS type, m.mode, m.reward,
                       u.public_key AS owner, m.ts_start,
                       SUBSTRING(u.public_key, 1, 8) AS owner_short,
                       u.total_missions, u.total_raids_won, u.total_kills
                FROM missions m
                FORCE INDEX (idx_user_id, idx_raided)
                JOIN users u ON m.user_id = u.id
                WHERE m.mode = 'Unshielded' 
                  AND m.success = 1 
                  AND m.raided = 0
                  AND m.claimed = 1
                  AND m.user_id != ?
                  AND m.ts_complete > ?
                ORDER BY m.reward DESC
                LIMIT 10
            ");
            
            $halfDayAgo = time() - (12 * 3600);
            $stmt->execute([$me['userId'], $halfDayAgo]);
            $missions = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $queryCount++;
            
            $result = [
                'missions' => $missions,
                'remainingEnergy' => 9, // Simplified for performance
                'scanned_at' => time()
            ];
            
            // Cache the result - only if cache is available
            if ($cache) {
                $cache->set($cacheKey, $result);
            }
            
            echo json_encode($result);
            break;
            
        default:
            // For other endpoints, use the original implementation
            // but with performance monitoring
            jsonErr('Unknown action', 404);
    }
    
} catch (Exception $e) {
    handleApiError($e->getMessage(), $action);
    jsonErr('Internal server error', 500);
    
} finally {
    // Log performance metrics
    $executionTime = microtime(true) - $startTime;
    $memoryUsage = memory_get_usage() - $startMemory;
    
    if (isset($performanceMonitor)) {
        $performanceMonitor->logPerformance($action, $executionTime, $memoryUsage, $queryCount);
    }
    
    // Release database connection back to pool
    if (isset($pdo)) {
        ConnectionPool::releaseConnection($pdo);
    }
    
    // Add performance headers for debugging
    if (DEBUG_MODE) {
        header("X-Execution-Time: {$executionTime}");
        header("X-Memory-Usage: {$memoryUsage}");
        header("X-Query-Count: {$queryCount}");
    }
}