<?php
/**
 * Performance Monitor & Auto-Healing System
 * Monitors API performance and automatically optimizes slow operations
 */

class PerformanceMonitor {
    private $pdo;
    private $cacheDir;
    private $logFile;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->cacheDir = __DIR__ . '/cache';
        $this->logFile = __DIR__ . '/logs/performance.log';
        
        // Create directories if they don't exist
        if (!is_dir($this->cacheDir)) {
            mkdir($this->cacheDir, 0755, true);
        }
        if (!is_dir(dirname($this->logFile))) {
            mkdir(dirname($this->logFile), 0755, true);
        }
    }
    
    /**
     * Monitor and log API performance
     */
    public function logPerformance($endpoint, $executionTime, $memoryUsage, $queryCount = 0) {
        $logEntry = [
            'timestamp' => date('Y-m-d H:i:s'),
            'endpoint' => $endpoint,
            'execution_time' => $executionTime,
            'memory_usage' => $memoryUsage,
            'query_count' => $queryCount,
            'is_slow' => $executionTime > 2.0 // Flag slow requests
        ];
        
        // Log to file
        file_put_contents(
            $this->logFile, 
            json_encode($logEntry) . "\n", 
            FILE_APPEND | LOCK_EX
        );
        
        // Auto-heal if performance is degraded
        if ($executionTime > 3.0) {
            $this->autoHeal($endpoint, $executionTime);
        }
    }
    
    /**
     * Auto-healing mechanisms
     */
    private function autoHeal($endpoint, $executionTime) {
        error_log("🔧 Auto-healing triggered for $endpoint (${executionTime}s)");
        
        // 1. Clear old cache entries
        $this->clearOldCache();
        
        // 2. Optimize database connections
        $this->optimizeDatabase();
        
        // 3. Clean up old logs
        $this->cleanupLogs();
        
        // 4. Reset rate limiting if needed
        $this->resetRateLimiting();
    }
    
    /**
     * Clear old cache entries
     */
    private function clearOldCache() {
        $files = glob($this->cacheDir . '/*');
        $now = time();
        
        foreach ($files as $file) {
            if (is_file($file) && ($now - filemtime($file)) > 3600) { // 1 hour old
                unlink($file);
            }
        }
    }
    
    /**
     * Optimize database performance
     */
    private function optimizeDatabase() {
        try {
            // Clean up old API logs (keep only last 24 hours)
            $this->pdo->exec("DELETE FROM api_logs WHERE ts < " . (time() - 86400));
            
            // Clean up old nonces (keep only last hour)
            $this->pdo->exec("DELETE FROM nonces WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)");
            
            // Optimize tables if needed
            $this->pdo->exec("OPTIMIZE TABLE api_logs, nonces");
            
        } catch (Exception $e) {
            error_log("Database optimization error: " . $e->getMessage());
        }
    }
    
    /**
     * Clean up old log files
     */
    private function cleanupLogs() {
        if (file_exists($this->logFile) && filesize($this->logFile) > 10 * 1024 * 1024) { // 10MB
            // Keep only last 1000 lines
            $lines = file($this->logFile);
            $lines = array_slice($lines, -1000);
            file_put_contents($this->logFile, implode('', $lines));
        }
    }
    
    /**
     * Reset rate limiting for auto-healing
     */
    private function resetRateLimiting() {
        try {
            // Clear rate limiting for the last 5 minutes to allow recovery
            $this->pdo->exec("DELETE FROM api_logs WHERE ts > " . (time() - 300));
        } catch (Exception $e) {
            error_log("Rate limit reset error: " . $e->getMessage());
        }
    }
    
    /**
     * Get performance statistics
     */
    public function getStats() {
        if (!file_exists($this->logFile)) {
            return ['status' => 'no_data'];
        }
        
        $lines = array_slice(file($this->logFile), -100); // Last 100 requests
        $stats = [
            'total_requests' => count($lines),
            'avg_response_time' => 0,
            'slow_requests' => 0,
            'memory_usage' => 0
        ];
        
        foreach ($lines as $line) {
            $data = json_decode($line, true);
            if ($data) {
                $stats['avg_response_time'] += $data['execution_time'];
                $stats['memory_usage'] += $data['memory_usage'];
                if ($data['is_slow']) {
                    $stats['slow_requests']++;
                }
            }
        }
        
        if ($stats['total_requests'] > 0) {
            $stats['avg_response_time'] /= $stats['total_requests'];
            $stats['memory_usage'] /= $stats['total_requests'];
        }
        
        return $stats;
    }
}

/**
 * Smart Cache System
 */
class SmartCache {
    private $cacheDir;
    
    public function __construct($cacheDir = null) {
        $this->cacheDir = $cacheDir ?: __DIR__ . '/cache';
        if (!is_dir($this->cacheDir)) {
            mkdir($this->cacheDir, 0755, true);
        }
    }
    
    /**
     * Get cached data
     */
    public function get($key, $maxAge = 300) {
        $file = $this->cacheDir . '/' . md5($key) . '.cache';
        
        if (!file_exists($file)) {
            return null;
        }
        
        if ((time() - filemtime($file)) > $maxAge) {
            unlink($file);
            return null;
        }
        
        $data = file_get_contents($file);
        return $data ? json_decode($data, true) : null;
    }
    
    /**
     * Set cached data
     */
    public function set($key, $data, $compress = true) {
        $file = $this->cacheDir . '/' . md5($key) . '.cache';
        $json = json_encode($data);
        
        if ($compress && function_exists('gzcompress')) {
            $json = gzcompress($json);
        }
        
        return file_put_contents($file, $json, LOCK_EX) !== false;
    }
    
    /**
     * Delete cached data
     */
    public function delete($key) {
        $file = $this->cacheDir . '/' . md5($key) . '.cache';
        return file_exists($file) ? unlink($file) : true;
    }
    
    /**
     * Clear all cache
     */
    public function clear() {
        $files = glob($this->cacheDir . '/*.cache');
        foreach ($files as $file) {
            unlink($file);
        }
        return true;
    }
}

/**
 * Database Connection Pool
 */
class ConnectionPool {
    private static $connections = [];
    private static $maxConnections = 5;
    private static $currentConnections = 0;
    
    public static function getConnection() {
        // Reuse existing connection if available
        if (!empty(self::$connections)) {
            return array_pop(self::$connections);
        }
        
        // Create new connection if under limit
        if (self::$currentConnections < self::$maxConnections) {
            try {
                $pdo = new PDO(
                    "mysql:host=".DB_HOST.";dbname=".DB_NAME.";charset=utf8mb4",
                    DB_USER, DB_PASS,
                    [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4",
                        PDO::ATTR_PERSISTENT => true, // Use persistent connections
                        PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => false // Reduce memory usage
                    ]
                );
                self::$currentConnections++;
                return $pdo;
            } catch (Exception $e) {
                error_log("Connection pool error: " . $e->getMessage());
                throw $e;
            }
        }
        
        // Wait and retry if at connection limit
        usleep(100000); // Wait 100ms
        return self::getConnection();
    }
    
    public static function releaseConnection($pdo) {
        if (count(self::$connections) < self::$maxConnections) {
            self::$connections[] = $pdo;
        }
    }
}