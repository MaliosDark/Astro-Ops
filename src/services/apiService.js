// src/services/apiService.js
// Dedicated API service for all server communications

import ENV from '../config/environment.js';

/**
 * API Service - Handles all communication with bonkraiders.com APIs
 */
class ApiService {
  constructor() {
    this.jwt = null;
    this.isRefreshing = false;
    this.refreshPromise = null;
    this.baseURL = 'https://api.bonkraiders.com';
    this.verifyURL = 'https://verify.bonkraiders.com';
  }

  /**
   * Set JWT token for authenticated requests
   */
  setToken(token) {
    this.jwt = token;
    // Store token in sessionStorage for persistence
    if (token) {
      sessionStorage.setItem('bonkraiders_jwt', token);
    } else {
      sessionStorage.removeItem('bonkraiders_jwt');
    }
    if (ENV.DEBUG_MODE) {
      console.log('🔑 JWT token set');
    }
  }

  /**
   * Get current JWT token
   */
  getToken() {
    // Try to get from memory first, then from sessionStorage
    if (!this.jwt) {
      this.jwt = sessionStorage.getItem('bonkraiders_jwt');
    }
    return this.jwt;
  }

  /**
   * Clear JWT token
   */
  clearToken() {
    this.jwt = null;
    sessionStorage.removeItem('bonkraiders_jwt');
    if (ENV.DEBUG_MODE) {
      console.log('🔑 JWT token cleared');
    }
  }

  /**
   * Check if JWT is expired or about to expire
   */
  isTokenExpired(token) {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      // Consider token expired if it expires in the next 5 minutes
      return payload.exp < (now + 300);
    } catch (error) {
      return true;
    }
  }

  /**
   * Automatically refresh JWT token
   */
  async refreshToken() {
    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshing) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this._performTokenRefresh();
    
    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Internal method to perform token refresh
   */
  async _performTokenRefresh() {
    try {
      if (ENV.DEBUG_MODE) {
        console.log('🔄 Auto-refreshing JWT token...');
      }

      // Trigger re-authentication if available
      if (window.triggerReAuthentication) {
        await window.triggerReAuthentication();
        return this.jwt;
      } else {
        throw new Error('No re-authentication method available');
      }
    } catch (error) {
      if (ENV.DEBUG_MODE) {
        console.error('❌ Token refresh failed:', error);
      }
      this.clearToken();
      throw error;
    }
  }

  /**
   * Make authenticated API request
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Check if we need to refresh the token before making the request
    let currentToken = this.getToken();
    if (currentToken && this.isTokenExpired(currentToken)) {
      if (ENV.DEBUG_MODE) {
        console.log('🔄 Token expired, auto-refreshing...');
      }
      try {
        currentToken = await this.refreshToken();
      } catch (error) {
        if (ENV.DEBUG_MODE) {
          console.error('❌ Auto-refresh failed:', error);
        }
        // Continue with expired token, let the server handle it
      }
    }
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': `BonkRaiders/${ENV.APP_VERSION}`,
    };

    // Add authorization header if JWT is available
    if (currentToken) {
      defaultHeaders['Authorization'] = `Bearer ${currentToken}`;
    }

    const requestOptions = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    };

    if (ENV.DEBUG_MODE) {
      console.log('📡 API Request:', {
        url,
        method: requestOptions.method || 'GET',
        hasAuth: !!currentToken
      });
    }

    try {
      const response = await fetch(url, requestOptions);
      
      if (ENV.DEBUG_MODE) {
        console.log('📡 API Response:', {
          url,
          status: response.status,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        });
      }

      // Handle JWT expiration (401 Unauthorized)
      if (response.status === 401 && currentToken) {
        if (ENV.DEBUG_MODE) {
          const errorText = await response.text();
          console.log('🔑 JWT validation failed:', errorText);
          console.log('🔑 Current JWT:', currentToken);
        }
        
        // Try to refresh token and retry the request
        try {
          if (ENV.DEBUG_MODE) {
            console.log('🔄 401 error, attempting token refresh...');
          }
          
          const newToken = await this.refreshToken();
          
          if (newToken) {
            // Retry the original request with new token
            const retryHeaders = {
              ...requestOptions.headers,
              'Authorization': `Bearer ${newToken}`
            };
            const retryResponse = await fetch(url, {
              ...requestOptions,
              headers: retryHeaders
            });
            
            if (retryResponse.ok) {
              return await retryResponse.json();
            }
          }
        } catch (reAuthError) {
          if (ENV.DEBUG_MODE) {
            console.error('❌ Auto re-authentication failed:', reAuthError);
          }
        }
        
        // If auto-refresh failed, clear token and throw error
        this.clearToken();
        throw new Error('Session expired. Please reconnect your wallet.');
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorText;
        } catch {
          errorMessage = errorText;
        }
        
        if (ENV.DEBUG_MODE) {
          console.error('❌ API Error Response:', errorMessage);
        }
        
        throw new Error(`API Error ${response.status}: ${errorMessage}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (ENV.DEBUG_MODE) {
        console.error('❌ API Request failed:', error);
      }
      throw error;
    }
  }

  /**
   * Make request to verify API
   */
  async verifyRequest(endpoint, options = {}) {
    const url = `${this.verifyURL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': `BonkRaiders/${ENV.APP_VERSION}`,
    };

    const requestOptions = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    };

    if (ENV.DEBUG_MODE) {
      console.log('🔍 Verify Request:', {
        url,
        method: requestOptions.method || 'GET'
      });
    }

    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Verify API Error ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      if (ENV.DEBUG_MODE) {
        console.error('❌ Verify Request failed:', error);
      }
      throw error;
    }
  }

  // ===== Authentication Methods =====

  /**
   * Get authentication nonce
   */
  async getNonce(publicKey) {
    return await this.request('/api.php?action=auth/nonce', {
      method: 'POST',
      body: JSON.stringify({ publicKey })
    });
  }

  /**
   * Login with signed nonce
   */
  async login(publicKey, nonce, signature) {
    const response = await this.request('/api.php?action=auth/login', {
      method: 'POST',
      body: JSON.stringify({
        publicKey,
        nonce,
        signature
      })
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  /**
   * Verify wallet signature
   */
  async verifySignature(publicKey, message, signature) {
    return await this.verifyRequest('/verify', {
      method: 'POST',
      body: JSON.stringify({
        publicKey,
        message,
        signature
      })
    });
  }

  // ===== Game Methods =====

  /**
   * Buy ship
   */
  async buyShip() {
    return await this.request('/api.php?action=buy_ship', {
      method: 'POST'
    });
  }

  /**
   * Send mission
   */
  async sendMission(type, mode, signedBurnTx) {
    return await this.request('/api.php?action=send_mission', {
      method: 'POST',
      body: JSON.stringify({
        type,
        mode,
        signedBurnTx
      })
    });
  }

  /**
   * Upgrade ship
   */
  async upgradeShip(level) {
    return await this.request('/api.php?action=upgrade_ship', {
      method: 'POST',
      body: JSON.stringify({ level })
    });
  }

  /**
   * Raid mission
   */
  async raidMission(missionId) {
    return await this.request('/api.php?action=raid_mission', {
      method: 'POST',
      body: JSON.stringify({ mission_id: missionId })
    });
  }

  /**
   * Claim rewards
   */
  async claimRewards() {
    return await this.request('/api.php?action=claim_rewards', {
      method: 'POST'
    });
  }

  /**
   * Get missions for raid
   */
  async getMissions() {
    return await this.request('/api.php?action=list_missions');
  }

  /**
   * Get pending rewards
   */
  async getPendingRewards() {
    return await this.request('/api.php?action=pending_missions');
  }

  /**
   * Get player energy
   */
  async getPlayerEnergy() {
    return await this.request('/api.php?action=player_energy');
  }

  /**
   * Scan for raidable missions (costs 1 energy)
   */
  async scanForRaids() {
    return await this.request('/api.php?action=raid/scan', {
      method: 'POST'
    });
  }

  /**
   * Get player stats
   */
  async getPlayerStats() {
    return await this.request('/api.php?action=player_stats');
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard() {
    return await this.request('/api.php?action=leaderboard');
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;