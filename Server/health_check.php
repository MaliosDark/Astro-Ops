<?php
/**
 * Health Check and Auto-Healing Endpoint
 * Monitors system health and triggers auto-healing when needed
 */

require_once 'performance_monitor.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

// Database configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'bonka_bonkartio');
define('DB_USER', 'bonka_bonusrtio');
define('DB_PASS', '*OxlUH49*69i');

class HealthChecker {
    private $pdo;
    private $cache;
    private $performanceMonitor;
    
    public function __construct() {
        try {
            $this->pdo = new PDO(
                "mysql:host=".DB_HOST.";dbname=".DB_NAME.";charset=utf8mb4",
                DB_USER, DB_PASS,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );
            $this->cache = new SmartCache();
            $this->performanceMonitor = new PerformanceMonitor($this->pdo);
        } catch (Exception $e) {
            $this->pdo = null;
        }
    }
    
    /**
     * Comprehensive health check
     */
    public function checkHealth() {
        $health = [
            'status' => 'healthy',
            'timestamp' => date('c'),
            'checks' => [],
            'auto_healing' => []
        ];
        
        // Database health
        $dbHealth = $this->checkDatabase();
        $health['checks']['database'] = $dbHealth;
        
        // Performance health
        $perfHealth = $this->checkPerformance();
        $health['checks']['performance'] = $perfHealth;
        
        // Cache health
        $cacheHealth = $this->checkCache();
        $health['checks']['cache'] = $cacheHealth;
        
        // Disk space health
        $diskHealth = $this->checkDiskSpace();
        $health['checks']['disk_space'] = $diskHealth;
        
        // Memory health
        $memoryHealth = $this->checkMemory();
        $health['checks']['memory'] = $memoryHealth;
        
        // Auto-healing actions
        $healingActions = $this->performAutoHealing($health['checks']);
        $health['auto_healing'] = $healingActions;
        
        // Overall status
        $health['status'] = $this->calculateOverallStatus($health['checks']);
        
        return $health;
    }
    
    /**
     * Check database health
     */
    private function checkDatabase() {
        if (!$this->pdo) {
            return [
                'status' => 'critical',
                'message' => 'Database connection failed',
                'response_time' => null
            ];
        }
        
        try {
            $start = microtime(true);
            $this->pdo->query("SELECT 1")->fetch();
            $responseTime = (microtime(true) - $start) * 1000;
            
            // Check table sizes
            $stmt = $this->pdo->query("
                SELECT table_name, table_rows, 
                       ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
                FROM information_schema.tables 
                WHERE table_schema = '".DB_NAME."'
                ORDER BY size_mb DESC
            ");
            $tables = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                'status' => $responseTime < 100 ? 'healthy' : ($responseTime < 500 ? 'warning' : 'critical'),
                'response_time' => round($responseTime, 2),
                'tables' => $tables,
                'connection_pool' => [
                    'active_connections' => ConnectionPool::$currentConnections ?? 0,
                    'max_connections' => 5
                ]
            ];
            
        } catch (Exception $e) {
            return [
                'status' => 'critical',
                'message' => $e->getMessage(),
                'response_time' => null
            ];
        }
    }
    
    /**
     * Check performance metrics
     */
    private function checkPerformance() {
        if (!$this->performanceMonitor) {
            return ['status' => 'unknown', 'message' => 'Performance monitor unavailable'];
        }
        
        $stats = $this->performanceMonitor->getStats();
        
        if ($stats['status'] === 'no_data') {
            return ['status' => 'healthy', 'message' => 'No performance data yet'];
        }
        
        $status = 'healthy';
        if ($stats['avg_response_time'] > 2.0) {
            $status = 'warning';
        }
        if ($stats['avg_response_time'] > 5.0 || $stats['slow_requests'] > 10) {
            $status = 'critical';
        }
        
        return [
            'status' => $status,
            'avg_response_time' => round($stats['avg_response_time'], 3),
            'slow_requests' => $stats['slow_requests'],
            'total_requests' => $stats['total_requests'],
            'avg_memory_usage' => round($stats['memory_usage'] / 1024 / 1024, 2) . ' MB'
        ];
    }
    
    /**
     * Check cache health
     */
    private function checkCache() {
        try {
            $testKey = 'health_check_' . time();
            $testData = ['test' => true, 'timestamp' => time()];
            
            $start = microtime(true);
            $this->cache->set($testKey, $testData);
            $retrieved = $this->cache->get($testKey);
            $this->cache->delete($testKey);
            $responseTime = (microtime(true) - $start) * 1000;
            
            $cacheDir = __DIR__ . '/cache';
            $cacheSize = 0;
            $fileCount = 0;
            
            if (is_dir($cacheDir)) {
                $files = glob($cacheDir . '/*');
                $fileCount = count($files);
                foreach ($files as $file) {
                    if (is_file($file)) {
                        $cacheSize += filesize($file);
                    }
                }
            }
            
            return [
                'status' => ($retrieved && $responseTime < 50) ? 'healthy' : 'warning',
                'response_time' => round($responseTime, 2),
                'cache_size' => round($cacheSize / 1024 / 1024, 2) . ' MB',
                'file_count' => $fileCount
            ];
            
        } catch (Exception $e) {
            return [
                'status' => 'critical',
                'message' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Check disk space
     */
    private function checkDiskSpace() {
        $freeBytes = disk_free_space(__DIR__);
        $totalBytes = disk_total_space(__DIR__);
        $usedPercent = (($totalBytes - $freeBytes) / $totalBytes) * 100;
        
        $status = 'healthy';
        if ($usedPercent > 80) $status = 'warning';
        if ($usedPercent > 90) $status = 'critical';
        
        return [
            'status' => $status,
            'used_percent' => round($usedPercent, 1),
            'free_space' => round($freeBytes / 1024 / 1024 / 1024, 2) . ' GB',
            'total_space' => round($totalBytes / 1024 / 1024 / 1024, 2) . ' GB'
        ];
    }
    
    /**
     * Check memory usage
     */
    private function checkMemory() {
        $memoryUsage = memory_get_usage(true);
        $memoryLimit = ini_get('memory_limit');
        $memoryLimitBytes = $this->parseMemoryLimit($memoryLimit);
        
        $usedPercent = ($memoryUsage / $memoryLimitBytes) * 100;
        
        $status = 'healthy';
        if ($usedPercent > 70) $status = 'warning';
        if ($usedPercent > 85) $status = 'critical';
        
        return [
            'status' => $status,
            'used_percent' => round($usedPercent, 1),
            'current_usage' => round($memoryUsage / 1024 / 1024, 2) . ' MB',
            'memory_limit' => $memoryLimit,
            'peak_usage' => round(memory_get_peak_usage(true) / 1024 / 1024, 2) . ' MB'
        ];
    }
    
    /**
     * Perform auto-healing actions
     */
    private function performAutoHealing($checks) {
        $actions = [];
        
        // Database healing
        if ($checks['database']['status'] === 'critical' || 
            (isset($checks['database']['response_time']) && $checks['database']['response_time'] > 1000)) {
            $actions[] = $this->healDatabase();
        }
        
        // Performance healing
        if ($checks['performance']['status'] === 'critical') {
            $actions[] = $this->healPerformance();
        }
        
        // Cache healing
        if ($checks['cache']['status'] === 'critical' || 
            (isset($checks['cache']['file_count']) && $checks['cache']['file_count'] > 1000)) {
            $actions[] = $this->healCache();
        }
        
        // Memory healing
        if ($checks['memory']['status'] === 'critical') {
            $actions[] = $this->healMemory();
        }
        
        return array_filter($actions);
    }
    
    /**
     * Database healing actions
     */
    private function healDatabase() {
        try {
            if (!$this->pdo) return null;
            
            // Clean old data
            $this->pdo->exec("DELETE FROM api_logs WHERE ts < " . (time() - 86400));
            $this->pdo->exec("DELETE FROM nonces WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)");
            
            // Optimize tables
            $this->pdo->exec("OPTIMIZE TABLE api_logs, nonces");
            
            return [
                'action' => 'database_cleanup',
                'status' => 'completed',
                'message' => 'Cleaned old data and optimized tables'
            ];
        } catch (Exception $e) {
            return [
                'action' => 'database_cleanup',
                'status' => 'failed',
                'message' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Performance healing actions
     */
    private function healPerformance() {
        try {
            // Clear performance logs
            $logFile = __DIR__ . '/logs/performance.log';
            if (file_exists($logFile) && filesize($logFile) > 5 * 1024 * 1024) {
                $lines = file($logFile);
                $lines = array_slice($lines, -500); // Keep last 500 lines
                file_put_contents($logFile, implode('', $lines));
            }
            
            return [
                'action' => 'performance_cleanup',
                'status' => 'completed',
                'message' => 'Cleaned performance logs'
            ];
        } catch (Exception $e) {
            return [
                'action' => 'performance_cleanup',
                'status' => 'failed',
                'message' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Cache healing actions
     */
    private function healCache() {
        try {
            $this->cache->clear();
            
            return [
                'action' => 'cache_clear',
                'status' => 'completed',
                'message' => 'Cleared all cache files'
            ];
        } catch (Exception $e) {
            return [
                'action' => 'cache_clear',
                'status' => 'failed',
                'message' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Memory healing actions
     */
    private function healMemory() {
        try {
            // Force garbage collection
            if (function_exists('gc_collect_cycles')) {
                $collected = gc_collect_cycles();
            }
            
            // Clear opcode cache if available
            if (function_exists('opcache_reset')) {
                opcache_reset();
            }
            
            return [
                'action' => 'memory_cleanup',
                'status' => 'completed',
                'message' => 'Performed garbage collection and cleared opcode cache'
            ];
        } catch (Exception $e) {
            return [
                'action' => 'memory_cleanup',
                'status' => 'failed',
                'message' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Calculate overall system status
     */
    private function calculateOverallStatus($checks) {
        $statuses = array_column($checks, 'status');
        
        if (in_array('critical', $statuses)) {
            return 'critical';
        }
        if (in_array('warning', $statuses)) {
            return 'warning';
        }
        return 'healthy';
    }
    
    /**
     * Parse memory limit string to bytes
     */
    private function parseMemoryLimit($limit) {
        $limit = trim($limit);
        $last = strtolower($limit[strlen($limit)-1]);
        $limit = (int) $limit;
        
        switch($last) {
            case 'g': $limit *= 1024;
            case 'm': $limit *= 1024;
            case 'k': $limit *= 1024;
        }
        
        return $limit;
    }
}

// Handle the health check request
try {
    $healthChecker = new HealthChecker();
    $health = $healthChecker->checkHealth();
    
    // Set appropriate HTTP status code
    switch ($health['status']) {
        case 'critical':
            http_response_code(503); // Service Unavailable
            break;
        case 'warning':
            http_response_code(200); // OK but with warnings
            break;
        default:
            http_response_code(200); // OK
    }
    
    echo json_encode($health, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'critical',
        'message' => 'Health check failed: ' . $e->getMessage(),
        'timestamp' => date('c')
    ]);
}