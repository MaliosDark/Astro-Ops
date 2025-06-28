// src/services/healthMonitor.js
// Client-side health monitoring and auto-recovery

import ENV from '../config/environment.js';

/**
 * Health Monitor Service - Monitors API health and triggers recovery
 */
class HealthMonitorService {
  constructor() {
    this.isMonitoring = false;
    this.healthCheckInterval = null;
    this.lastHealthCheck = null;
    this.consecutiveFailures = 0;
    this.maxFailures = 3;
    this.healthCheckFrequency = 30000; // 30 seconds
    this.listeners = new Map();
  }

  /**
   * Start health monitoring
   */
  start() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.performHealthCheck(); // Initial check
    
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.healthCheckFrequency);
    
    if (ENV.DEBUG_MODE) {
      console.log('🏥 Health monitoring started');
    }
  }

  /**
   * Stop health monitoring
   */
  stop() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    if (ENV.DEBUG_MODE) {
      console.log('🏥 Health monitoring stopped');
    }
  }

  /**
   * Perform health check
   */
  async performHealthCheck() {
    try {
      const startTime = performance.now();
      
      const response = await fetch(`${ENV.API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        timeout: 10000 // 10 second timeout
      });

      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      let healthData;
      try {
        healthData = await response.json();
      } catch (e) {
        throw new Error('Invalid health check response');
      }

      const health = {
        status: response.ok ? healthData.status : 'critical',
        responseTime: Math.round(responseTime),
        timestamp: Date.now(),
        data: healthData,
        httpStatus: response.status
      };

      this.handleHealthResult(health);
      
    } catch (error) {
      if (ENV.DEBUG_MODE) {
        console.error('🏥 Health check failed:', error);
      }
      
      this.handleHealthResult({
        status: 'critical',
        responseTime: null,
        timestamp: Date.now(),
        error: error.message,
        httpStatus: 0
      });
    }
  }

  /**
   * Handle health check result
   */
  handleHealthResult(health) {
    this.lastHealthCheck = health;
    
    if (health.status === 'critical' || health.error) {
      this.consecutiveFailures++;
      
      if (ENV.DEBUG_MODE) {
        console.warn(`🏥 Health check failed (${this.consecutiveFailures}/${this.maxFailures}):`, health);
      }
      
      // Trigger recovery if too many failures
      if (this.consecutiveFailures >= this.maxFailures) {
        this.triggerRecovery(health);
      }
      
      this.emit('health_degraded', health);
      
    } else {
      // Reset failure counter on success
      if (this.consecutiveFailures > 0) {
        if (ENV.DEBUG_MODE) {
          console.log('🏥 Health recovered after', this.consecutiveFailures, 'failures');
        }
        this.emit('health_recovered', health);
      }
      
      this.consecutiveFailures = 0;
      this.emit('health_ok', health);
    }
    
    // Always emit the health update
    this.emit('health_update', health);
  }

  /**
   * Trigger recovery mechanisms
   */
  async triggerRecovery(health) {
    if (ENV.DEBUG_MODE) {
      console.log('🔧 Triggering auto-recovery mechanisms');
    }
    
    const recoveryActions = [];
    
    try {
      // 1. Clear local caches
      recoveryActions.push(await this.clearLocalCaches());
      
      // 2. Reset API connections
      recoveryActions.push(await this.resetApiConnections());
      
      // 3. Refresh authentication if needed
      recoveryActions.push(await this.refreshAuthentication());
      
      // 4. Notify user if still failing
      if (this.consecutiveFailures >= this.maxFailures) {
        this.notifyUserOfIssues(health);
      }
      
    } catch (error) {
      if (ENV.DEBUG_MODE) {
        console.error('🔧 Recovery action failed:', error);
      }
    }
    
    this.emit('recovery_attempted', {
      health,
      actions: recoveryActions,
      timestamp: Date.now()
    });
  }

  /**
   * Clear local caches
   */
  async clearLocalCaches() {
    try {
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear localStorage (except important data)
      const keysToKeep = ['bonkraiders_session', 'bonkraiders_profile'];
      const allKeys = Object.keys(localStorage);
      
      allKeys.forEach(key => {
        if (!keysToKeep.includes(key) && key.startsWith('bonkraiders_')) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear browser cache if possible
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      return {
        action: 'clear_local_caches',
        status: 'success',
        message: 'Local caches cleared'
      };
      
    } catch (error) {
      return {
        action: 'clear_local_caches',
        status: 'failed',
        message: error.message
      };
    }
  }

  /**
   * Reset API connections
   */
  async resetApiConnections() {
    try {
      // Reset any persistent connections
      if (window.apiService) {
        window.apiService.clearToken();
      }
      
      // Reset WebSocket connections
      if (window.websocketService) {
        window.websocketService.disconnect();
        // Try to reconnect after a short delay
        setTimeout(() => {
          try {
            if (window.websocketService && window.apiService) {
              const userId = 1; // Default user ID
              const token = window.apiService.getToken();
              if (token) {
                window.websocketService.connect(userId, token).catch(() => {
                  // Ignore reconnection errors
                });
              }
            }
          } catch (error) {
            // Ignore reconnection errors
          }
        }, 5000);
      }
      
      return {
        action: 'reset_api_connections',
        status: 'success',
        message: 'API connections reset'
      };
      
    } catch (error) {
      return {
        action: 'reset_api_connections',
        status: 'failed',
        message: error.message
      };
    }
  }

  /**
   * Refresh authentication
   */
  async refreshAuthentication() {
    try {
      // Trigger re-authentication if available
      if (window.triggerReAuthentication) {
        await window.triggerReAuthentication();
        
        return {
          action: 'refresh_authentication',
          status: 'success',
          message: 'Authentication refreshed'
        };
      }
      
      return {
        action: 'refresh_authentication',
        status: 'skipped',
        message: 'No re-authentication method available'
      };
      
    } catch (error) {
      return {
        action: 'refresh_authentication',
        status: 'failed',
        message: error.message
      };
    }
  }

  /**
   * Notify user of persistent issues
   */
  notifyUserOfIssues(health) {
    if (window.AstroUI) {
      if (health.error?.includes('network') || health.httpStatus === 0) {
        window.AstroUI.setStatus('🌐 Connection issues detected. Attempting to reconnect...');
      } else if (health.data?.status === 'critical') {
        window.AstroUI.setStatus('⚠️ Server maintenance in progress. Please wait...');
      } else {
        window.AstroUI.setStatus('🔧 System optimization in progress...');
      }
    }
  }

  /**
   * Get current health status
   */
  getHealthStatus() {
    return {
      isMonitoring: this.isMonitoring,
      lastCheck: this.lastHealthCheck,
      consecutiveFailures: this.consecutiveFailures,
      isHealthy: this.consecutiveFailures === 0
    };
  }

  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const listeners = this.listeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }
}

// Create singleton instance
const healthMonitorService = new HealthMonitorService();

export default healthMonitorService;