<?php
// Basic security & input hardening
// ================= CORS Headers (MUST be first) =================
// Allow all origins for development/testing
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, Accept');
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
header('Access-Control-Allow-Headers: Content-Type, Authorization');
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
  [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

function runMigrations(PDO $pdo) {
  // create database if missing
  $pdo->exec("CREATE DATABASE IF NOT EXISTS `".DB_NAME."`");
  $pdo->exec("USE `".DB_NAME."`");
  // if no users table, run migrations.sql
  $has = $pdo->query("SHOW TABLES LIKE 'users'")->fetch();
  if (!$has) {
    $sql = file_get_contents(__DIR__ . '/migrations.sql');
    $pdo->exec($sql);
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
  
  // Debug JWT validation
  error_log("JWT Debug - Header: $h64");
  error_log("JWT Debug - Payload: $p64");
  error_log("JWT Debug - Signature: $s64");
  
  $sig = base64url_decode($s64);
  $valid = hash_hmac('sha256', "$h64.$p64", $secret, true);
  
  error_log("JWT Debug - Expected signature: " . base64url_encode($valid));
  error_log("JWT Debug - Received signature: $s64");
  
  if (!hash_equals($valid, $sig)) {
    error_log("JWT Debug - Signature mismatch!");
    throw new Exception('Invalid JWT signature');
  }
  
  $payload = json_decode(base64url_decode($p64), true);
  
  // Check expiration
  if (isset($payload['exp']) && time() > $payload['exp']) {
    error_log("JWT Debug - Token expired. Current time: " . time() . ", Exp: " . $payload['exp']);
    throw new Exception('JWT token expired');
  }
  
  error_log("JWT Debug - Token valid. Payload: " . json_encode($payload));
  return $payload;
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
  if (!preg_match('/Bearer\s+(.+)$/', $_SERVER['HTTP_AUTHORIZATION'] ?? '', $m)) {
    error_log("Auth Debug - No Bearer token found in: " . ($_SERVER['HTTP_AUTHORIZATION'] ?? 'null'));
    jsonErr('Missing token', 401);
  }
  
  error_log("Auth Debug - Received token: " . $m[1]);
  
  try {
    $data = jwt_decode($m[1], JWT_SECRET);
  } catch (Exception $e) {
    error_log("Auth Debug - JWT decode failed: " . $e->getMessage());
    jsonErr('Invalid token', 401);
  }
  
  error_log("Auth Debug - JWT decoded successfully: " . json_encode($data));
  
  $stmt = $pdo->prepare("SELECT id FROM users WHERE public_key = ?");
  $stmt->execute([$data['publicKey']]);
  $user = $stmt->fetch(PDO::FETCH_ASSOC);
  if (!$user) {
    error_log("Auth Debug - User not found for public key: " . $data['publicKey']);
    jsonErr('User not found', 401);
  }
  
  error_log("Auth Debug - User found: " . json_encode($user));
  return ['publicKey' => $data['publicKey'], 'userId' => (int)$user['id']];
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

    switch ($action) {

      // BUY SHIP
      case 'buy_ship':
        AntiCheat::validateRequestOrigin();
        $pdo->beginTransaction();
          $stmt = $pdo->prepare("SELECT id FROM ships WHERE user_id = ?");
          $stmt->execute([$me['userId']]);
          if ($stmt->fetch()) {
            $pdo->commit();
            echo json_encode(['ship_id' => null]);
            exit;
          }
          $pdo->prepare("INSERT INTO ships(user_id) VALUES (?)")
              ->execute([$me['userId']]);
        $pdo->commit();
        echo json_encode(['ship_id' => $pdo->lastInsertId()]);
        exit;


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
        $raidType = $b['raid_type'] ?? 'Quick'; // Quick, Stealth, Assault
        if (!$mid) jsonErr('mission_id required', 400);

        $pdo->beginTransaction();
          // lock mission
          $stmt = $pdo->prepare("
            SELECT m.*, s.level as ship_level, s.attack_power, s.defense_power,
                   ps.overall_rating as defender_rating, ps.raids_defended
            FROM missions m
            JOIN ships s ON m.ship_id = s.id
            LEFT JOIN player_stats ps ON m.user_id = ps.user_id
            WHERE m.id = ? FOR UPDATE
          ");
          $stmt->execute([$mid]);
          $m = $stmt->fetch(PDO::FETCH_ASSOC);
          if (!$m) jsonErr('Mission not found', 404);
          if ($m['raided']) jsonErr('Already raided', 400);
          if ($m['user_id'] == $me['userId']) jsonErr('Cannot raid yourself', 400);
          
          // Get attacker stats
          $attackerStats = $pdo->prepare("
            SELECT ps.overall_rating, ps.raid_rating, s.level, s.attack_power, s.defense_power
            FROM player_stats ps
            JOIN ships s ON ps.user_id = s.user_id
            WHERE ps.user_id = ?
          ");
          $attackerStats->execute([$me['userId']]);
          $attacker = $attackerStats->fetch(PDO::FETCH_ASSOC);
          
          $attackerRating = $attacker['overall_rating'] ?? 1000;
          $defenderRating = $m['defender_rating'] ?? 1000;
          
          if ($m['mode'] === 'Shielded') {
            // penalize
            $pdo->prepare("UPDATE reputation SET rep = GREATEST(rep-10,0) WHERE user_id = ?")
                ->execute([$me['userId']]);
            
            // Update failed raid stats
            $pdo->prepare("
              INSERT INTO player_stats (user_id, raids_initiated) VALUES (?, 1)
              ON DUPLICATE KEY UPDATE raids_initiated = raids_initiated + 1
            ")->execute([$me['userId']]);
            
            jsonErr('Shielded: cannot raid (–10 rep)', 400);
          }
          
          // Simulate battle based on ship stats and raid type
          $battleResult = simulateRaidBattle(
            $attacker, 
            ['rating' => $defenderRating, 'ship_level' => $m['ship_level'], 'defense_power' => $m['defense_power']], 
            $raidType
          );
          
          if (!$battleResult['success']) {
            // Raid failed - defender wins
            $pdo->prepare("
              INSERT INTO player_stats (user_id, raids_initiated) VALUES (?, 1)
              ON DUPLICATE KEY UPDATE raids_initiated = raids_initiated + 1
            ")->execute([$me['userId']]);
            
            $pdo->prepare("
              INSERT INTO player_stats (user_id, raids_defended) VALUES (?, 1)
              ON DUPLICATE KEY UPDATE raids_defended = raids_defended + 1
            ")->execute([$m['user_id']]);
            
            // Record raid history
            $pdo->prepare("
              INSERT INTO raid_history (
                attacker_id, defender_id, mission_id, raid_type, success,
                damage_dealt, damage_received, battle_duration,
                attacker_rating_before, attacker_rating_after,
                defender_rating_before, defender_rating_after
              ) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)
            ")->execute([
              $me['userId'], $m['user_id'], $mid, $raidType,
              $battleResult['damage_dealt'], $battleResult['damage_received'],
              $battleResult['duration'], $attackerRating, $attackerRating - 25,
              $defenderRating, $defenderRating + 15
            ]);
            
            // Update ratings
            updatePlayerRating($pdo, $me['userId'], -25);
            updatePlayerRating($pdo, $m['user_id'], 15);
            
            $pdo->commit();
            jsonErr('Raid failed! Defender repelled the attack.', 400);
          }

          // Raid successful - calculate loot
          $baseLoot = $m['actual_reward'] ?? $m['base_reward'];
          $lootMultiplier = $battleResult['loot_multiplier'];
          $stolen = floor($baseLoot * $lootMultiplier);
          
          $stmt = $pdo->prepare("SELECT * FROM ships WHERE user_id = ? FOR UPDATE");
          $stmt->execute([$me['userId']]);
          $ship = $stmt->fetch(PDO::FETCH_ASSOC);
          if (!$ship) jsonErr('No ship', 400);
          $newBR = $ship['br_balance'] + $stolen;

          // Update balances & mark raided
          $pdo->prepare("UPDATE ships SET br_balance = ? WHERE id = ?")
              ->execute([$newBR, $ship['id']]);
          $pdo->prepare("
            UPDATE missions
               SET raided = 1, raided_by = ?, ts_raid = ?, raid_damage = ?
             WHERE id = ?
          ")->execute([$me['userId'], time(), $battleResult['damage_dealt'], $mid]);
          
          // Update player stats
          $pdo->prepare("
            INSERT INTO player_stats (user_id, raids_initiated, raids_successful, total_br_earned)
            VALUES (?, 1, 1, ?)
            ON DUPLICATE KEY UPDATE 
              raids_initiated = raids_initiated + 1,
              raids_successful = raids_successful + 1,
              total_br_earned = total_br_earned + ?
          ")->execute([$me['userId'], $stolen, $stolen]);
          
          $pdo->prepare("
            INSERT INTO player_stats (user_id, raids_lost_defense)
            VALUES (?, 1)
            ON DUPLICATE KEY UPDATE raids_lost_defense = raids_lost_defense + 1
          ")->execute([$m['user_id']]);
          
          // Record successful raid history
          $pdo->prepare("
            INSERT INTO raid_history (
              attacker_id, defender_id, mission_id, raid_type, success, loot_stolen,
              damage_dealt, damage_received, battle_duration,
              attacker_rating_before, attacker_rating_after,
              defender_rating_before, defender_rating_after
            ) VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)
          ")->execute([
            $me['userId'], $m['user_id'], $mid, $raidType, $stolen,
            $battleResult['damage_dealt'], $battleResult['damage_received'],
            $battleResult['duration'], $attackerRating, $attackerRating + 30,
            $defenderRating, $defenderRating - 20
          ]);
          
          // Update ratings
          updatePlayerRating($pdo, $me['userId'], 30);
          updatePlayerRating($pdo, $m['user_id'], -20);
          
          // Remove from raid pool
          $pdo->prepare("UPDATE raid_pool SET is_active = 0 WHERE mission_id = ?")
              ->execute([$mid]);
          
          // Create notification for defender
          $pdo->prepare("
            INSERT INTO game_events (user_id, event_type, title, message, related_user_id, reward_amount)
            VALUES (?, 'raid_incoming', 'Your mission was raided!', 
                    'Your mission was successfully raided. You lost ? BR.', ?, ?)
          ")->execute([$m['user_id'], $stolen, $me['userId'], $stolen]);
          
          // Trigger defense battle for the target player
          // This would be handled by real-time notifications in a production game
          
        $pdo->commit();

        echo json_encode([
          'stolen' => $stolen,
          'br_balance' => $newBR,
          'battle_result' => $battleResult,
          'rating_change' => 30
        ]);
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
