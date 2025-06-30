<?php
namespace BonkRaiders\WebSocket;

use Exception;

/**
 * Authentication handler for WebSocket server
 */
class Authentication
{
    private $jwtSecret;
    private $db;
    
    public function __construct(string $jwtSecret, Database $db)
    {
        $this->jwtSecret = $jwtSecret;
        $this->db = $db;
    }
    
    /**
     * Validate JWT token
     */
    public function validateToken(string $token)
    {
        // Remove Bearer prefix if present
        $token = str_replace('Bearer ', '', $token);
        
        try {
            $data = $this->jwtDecode($token, $this->jwtSecret);
            
            // Check if token is expired
            if (isset($data['exp']) && $data['exp'] < time()) {
                return false;
            }
            
            // Check if publicKey exists
            if (!isset($data['publicKey'])) {
                return false;
            }
            
            // Get user from database
            $user = $this->db->getUserByPublicKey($data['publicKey']);
            
            if (!$user) {
                return false;
            }
            
            return [
                'userId' => $user['id'],
                'publicKey' => $user['public_key']
            ];
        } catch (Exception $e) {
            return false;
        }
    }
    
    /**
     * Decode JWT token
     */
    private function jwtDecode(string $token, string $secret)
    {
        $parts = explode('.', $token);
        
        if (count($parts) !== 3) {
            throw new Exception('Invalid JWT format');
        }
        
        list($header64, $payload64, $signature64) = $parts;
        
        // Verify signature
        $signature = $this->base64UrlDecode($signature64);
        $signInput = "$header64.$payload64";
        $expectedSignature = hash_hmac('sha256', $signInput, $secret, true);
        
        if (!hash_equals($expectedSignature, $signature)) {
            throw new Exception('Invalid JWT signature');
        }
        
        // Decode payload
        $payload = $this->base64UrlDecode($payload64);
        $data = json_decode($payload, true);
        
        if (!is_array($data)) {
            throw new Exception('Invalid JWT payload');
        }
        
        return $data;
    }
    
    /**
     * Base64 URL decode
     */
    private function base64UrlDecode(string $input)
    {
        $remainder = strlen($input) % 4;
        if ($remainder) {
            $input .= str_repeat('=', 4 - $remainder);
        }
        
        return base64_decode(strtr($input, '-_', '+/'));
    }
}