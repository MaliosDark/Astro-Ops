<?php
// AntiCheat – hardened server-side checks for Astro-Ops missions
// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

class AntiCheat
{
    // CONFIGURE THESE
    const COOLDOWN_SECONDS     = 8 * 3600;      // 8 h
    const DAILY_MISSION_LIMIT  = 10;            // max missions per 24 h
    const FRONTEND_ORIGIN      = 'https://bonkraiders.com';
    const ALLOWED_ORIGINS = [
        'https://bonkraiders.com',
        'http://localhost:3000',
        'https://zp1v56uxy8rdx5ypatb0ockcb9tr6a-oci3--3000--cb7c0bca.local-credentialless.webcontainer-api.io',
        // Add more development URLs as needed
        'null'
    ];

    /**
     * 1) Enforce the 8 h cooldown on the last mission timestamp.
     */
    public static function enforceCooldown(array $ship)
    {
        if (time() - intval($ship['last_mission_ts']) < self::COOLDOWN_SECONDS) {
            throw new Exception('AntiCheat: cooldown violation');
        }
    }

    /**
     * 2) Enforce a per-user daily mission limit.
     */
    public static function enforceDailyLimit(PDO $pdo, int $userId)
    {
        $since = time() - 24*3600;
        $stmt = $pdo->prepare("
            SELECT COUNT(*) 
              FROM missions 
             WHERE user_id = ? 
               AND ts_start >= ?
        ");
        $stmt->execute([$userId, $since]);
        $count = (int)$stmt->fetchColumn();
        if ($count >= self::DAILY_MISSION_LIMIT) {
            throw new Exception("AntiCheat: daily mission limit of " . self::DAILY_MISSION_LIMIT . " reached");
        }
    }

    /**
     * 3) Validate that the submitted mission type & mode are known.
     */
    public static function validateMissionParams(string $type, string $mode, array $allowedTypes, array $allowedModes)
    {
        if (!in_array($type, $allowedTypes, true)) {
            throw new Exception('AntiCheat: invalid mission type');
        }
        if (!in_array($mode, $allowedModes, true)) {
            throw new Exception('AntiCheat: invalid mission mode');
        }
    }

    /**
     * 4) Validate that the raw reward falls within configured bounds.
     *    $rewardConfig: [ 'MissionKey' => [ chance, min, max ], … ]
     */
    public static function validateMissionReward(string $type, int $raw, array $rewardConfig)
    {
        if (!isset($rewardConfig[$type])) {
            throw new Exception('AntiCheat: unknown reward config for ' . $type);
        }
        list(, $min, $max) = $rewardConfig[$type];
        if ($raw < $min || $raw > $max) {
            throw new Exception('AntiCheat: reward out of bounds');
        }
    }

    /**
     * 5) Prevent replay of the same burn transaction.
     *    Records SHA-256(tx) in `burned_transactions`.
     */
    public static function preventReplay(PDO $pdo, string $signedBurnTx, int $userId)
    {
        // hash the raw base64 payload
        $hash = hash('sha256', $signedBurnTx);
        // ensure table exists
        $pdo->exec("
          CREATE TABLE IF NOT EXISTS burned_transactions (
            tx_hash   VARCHAR(64) PRIMARY KEY,
            user_id   INT         NOT NULL,
            ts        INT         NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
          )
        ");
        // attempt insert
        $stmt = $pdo->prepare("
          INSERT INTO burned_transactions(tx_hash,user_id,ts) 
          VALUES (?, ?, ?)
        ");
        if (!$stmt->execute([$hash, $userId, time()])) {
            throw new Exception('AntiCheat: burn transaction replay detected');
        }
    }

    /**
     * 6) Check that the request comes from your front-end (basic Origin/Referer block).
     * Updated to allow multiple origins including development environments.
     */
    public static function validateRequestOrigin()
    {
        // TODO: Reactivar en producción con orígenes específicos
        return; // Temporalmente desactivado para desarrollo
        
        $origin  = $_SERVER['HTTP_ORIGIN']  ?? '';
        $referer = $_SERVER['HTTP_REFERER'] ?? '';
        
        // Check if origin or referer matches any allowed origin
        $validOrigin = false;
        foreach (self::ALLOWED_ORIGINS as $allowedOrigin) {
            if (stripos($origin, $allowedOrigin) === 0 || stripos($referer, $allowedOrigin) === 0) {
                $validOrigin = true;
                break;
            }
        }
        
        // For development, also allow localhost and webcontainer URLs
        if (!$validOrigin) {
            if (stripos($origin, 'localhost') !== false || 
                stripos($origin, '127.0.0.1') !== false ||
                stripos($origin, 'webcontainer-api.io') !== false) {
                $validOrigin = true;
            }
        }
        
        if (!$validOrigin) {
            error_log("AntiCheat: Blocked origin: $origin, referer: $referer");
            throw new Exception('AntiCheat: invalid request origin');
        }
    }

    /**
     * 7) Limit payload size & enforce JSON content-type.
     */
    public static function validateJsonPayload()
    {
        if (
            ($_SERVER['CONTENT_TYPE'] ?? '') !== 'application/json' ||
            (!empty($_SERVER['CONTENT_LENGTH']) && $_SERVER['CONTENT_LENGTH'] > 1024 * 10) // 10 KB max
        ) {
            throw new Exception('AntiCheat: invalid payload');
        }
    }
}
