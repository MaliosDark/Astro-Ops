// src/services/apiService.js
// Dedicated API service for all server communications

import ENV from '../config/environment.js';

/**
 * API Service - Handles all communication with bonkraiders.com APIs
 */
class ApiService {
  constructor() {
    this.jwt = null;
    this.baseURL = ENV.API_BASE_URL;
    this.verifyURL = ENV.VERIFY_API_URL;
  }

  /**
   * Set JWT token for authenticated requests
   */
  setToken(token) {
    this.jwt = token;
    if (ENV.DEBUG_MODE) {
      console.log('🔑 JWT token set');
    }
  }

  /**
   * Get current JWT token
   */
  getToken() {
    return this.jwt;
  }

  /**
   * Clear JWT token
   */
  clearToken() {
    this.jwt = null;
    if (ENV.DEBUG_MODE) {
      console.log('🔑 JWT token cleared');
    }
  }

  /**
   * Make authenticated API request
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': `BonkRaiders/${ENV.APP_VERSION}`,
    };

    // Add authorization header if JWT is available
    if (this.jwt) {
      defaultHeaders['Authorization'] = `Bearer ${this.jwt}`;
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
        hasAuth: !!this.jwt
      });
    }

    try {
      const response = await fetch(url, requestOptions);
      
      if (ENV.DEBUG_MODE) {
        console.log('📡 API Response:', {
          url,
          status: response.status,
          ok: response.ok
        });
      }

      // Handle JWT expiration (401 Unauthorized)
      if (response.status === 401 && this.jwt) {
        if (ENV.DEBUG_MODE) {
          console.log('🔑 JWT expired, clearing token and triggering re-authentication');
        }
        this.clearToken();
        
        // Trigger re-authentication if available
        if (window.triggerReAuthentication) {
          try {
            await window.triggerReAuthentication();
            // Retry the original request with new token
            if (this.jwt) {
              const retryHeaders = {
                ...requestOptions.headers,
                'Authorization': `Bearer ${this.jwt}`
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
              console.error('❌ Re-authentication failed:', reAuthError);
            }
          }
        }
        
        throw new Error('Authentication required. Please reconnect your wallet.');
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