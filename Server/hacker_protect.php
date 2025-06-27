<?php
/**
 * hacker_protect.php
 * Global error/exception/shutdown handlers + basic request hardening
 */

// ——— CORS HEADERS ———
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, Accept');
header('Access-Control-Max-Age: 86400'); // 24 hours

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ——— 1) SECURITY HEADERS ———
// Note: CORS headers are now handled in api.php before this file is included
header('Content-Security-Policy: '
     . "default-src 'self'; "
     . "img-src 'self' data: https://pbs.twimg.com https://bonkraiders.com; "
     . "script-src 'self' 'unsafe-inline'; "
     . "style-src 'self' 'unsafe-inline'; "
     . "connect-src 'self' https://api.bonkraiders.com https://verify.bonkraiders.com https://api.devnet.solana.com https://papaya-cassata-c1174a.netlify.app; "
     . "object-src 'none'; "
     . "frame-ancestors 'none'; "
     . "base-uri 'self';");
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: no-referrer');
header('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');

// ——— 2) BASIC BOT / INJECTION FILTERS ———
function inspectPayload(array $data, string $context = 'INPUT') {
    static $badPatterns = [
        'eval(', 'base64_decode', 'gzinflate', 'shell_exec',
        'passthru', '<?php', '--', '/*', '*/', 'union select'
    ];

    foreach ($data as $k => $v) {
        if (is_array($v)) {
            inspectPayload($v, $context);
            continue;
        }
        $low = strtolower((string)$v);
        // block control chars
        if (preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', $low)) {
            error_log("HackerProtect: control chars in $context[$k]");
            http_response_code(400);
            exit(json_encode(['error'=>'Invalid characters']));
        }
        // block suspicious keywords
        foreach ($badPatterns as $pat) {
            if (strpos($low, $pat) !== false) {
                error_log("HackerProtect: blocked $context[$k] => $v");
                http_response_code(400);
                exit(json_encode(['error'=>'Invalid request']));
            }
        }
    }
}

// inspect superglobals
inspectPayload($_GET,   'GET');
inspectPayload($_POST,  'POST');
inspectPayload($_COOKIE,'COOKIE');
// inspect raw JSON body if present
if (in_array($_SERVER['REQUEST_METHOD'], ['POST','PUT','PATCH'])) {
    $raw = file_get_contents('php://input');
    if ($raw && strlen($raw) < 1024*1024) {
        $json = json_decode($raw, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            inspectPayload($json, 'JSON');
        }
    }
}

// ——— 3) ERROR & EXCEPTION HANDLERS ———
function handleException(Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    // log full context
    $ip = $_SERVER['REMOTE_ADDR']    ?? 'unknown';
    $ua = $_SERVER['HTTP_USER_AGENT']?? 'unknown';
    error_log(sprintf(
        "[%s] EXCEPTION %s:%d by %s %s\nMessage: %s\nTrace:\n%s\n",
        date('c'), $e->getFile(), $e->getLine(),
        $ip, $ua, $e->getMessage(), $e->getTraceAsString()
    ));
    echo json_encode(['error'=>'Internal Server Error']);
    exit;
}

function handleError($errno, $errstr, $errfile, $errline) {
    throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
}

function handleShutdown() {
    $err = error_get_last();
    if ($err && in_array($err['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        http_response_code(500);
        // decide JSON vs HTML
        $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
        if (stripos($accept, 'application/json') !== false) {
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['error'=>'Internal Server Error']);
        } else {
            header('Content-Type: text/html; charset=utf-8');
            require __DIR__ . '/error.php';
        }
        // final log
        error_log(sprintf(
            "[%s] SHUTDOWN_ERROR %s:%d type %d — %s",
            date('c'), $err['file'], $err['line'], $err['type'], $err['message']
        ));
        exit;
    }
}

set_exception_handler('handleException');
set_error_handler('handleError');
register_shutdown_function('handleShutdown');
