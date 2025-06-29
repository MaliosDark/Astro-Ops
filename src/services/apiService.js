// src/services/apiService.js
// Dedicated API service for all server communications

import ENV from '../config/environment.js';
import userCacheService from './userCacheService.js';

/**
 * API Service - Handles all communication with bonkraiders.com APIs
 */
class ApiService {
  constructor() {
    this.jwt = null;
    this.isRefreshing = false;
    this.refreshPromise = null;
    this.baseURL = ENV.API_BASE_URL;
    this.verifyURL = ENV.VERIFY_API_URL;
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
    // Ensure endpoint starts with /
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    let url = `${this.baseURL}${cleanEndpoint}`;
    
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

    const requestOptions = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    };

    // Strategy: Send token in body for POST/PUT/PATCH, in query string for GET
    const method = options.method || 'GET';
    
    if (currentToken && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      let bodyData = {};
      
      // Parse existing body if present
      if (options.body) {
        try {
          bodyData = JSON.parse(options.body);
        } catch (e) {
          bodyData = {};
        }
      }
      
      // Add token to body
      bodyData._auth_token = currentToken.trim();
      requestOptions.body = JSON.stringify(bodyData);
      
      if (ENV.DEBUG_MODE) {
        console.log('🔑 Adding token to request body, length:', currentToken.length);
      }
    } else if (currentToken && method === 'GET') {
      // For GET requests, add token as query parameter
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}_auth_token=${encodeURIComponent(currentToken.trim())}`;
      
      if (ENV.DEBUG_MODE) {
        console.log('🔑 Adding token to query string');
      }
    }
    
    if (ENV.DEBUG_MODE) {
      console.log('📡 API Request:', {
        url,
        method: method,
        hasAuth: !!currentToken,
        authMethod: currentToken ? 'body/query' : 'none',
        headers: Object.keys(requestOptions.headers)
      });
    }

    return await this._makeRequest(url, requestOptions, currentToken);
  }

  /**
   * Internal method to make the actual request
   */
  async _makeRequest(url, requestOptions, currentToken) {
    try {
      const response = await fetch(url, requestOptions);
      
      if (ENV.DEBUG_MODE) {
        console.log('📡 API Response:', {
          url,
          status: response.status,
          ok: response.ok,
          sentAuthToken: !!currentToken,
          responseHeaders: Object.fromEntries(response.headers.entries())
        });
      }

      // Handle JWT expiration (401 Unauthorized)
      if (response.status === 401 && currentToken) {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = 'Could not read error response';
        }
        
        if (ENV.DEBUG_MODE) {
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
            // Update the request with new token
            if (requestOptions.body) {
              const bodyData = JSON.parse(requestOptions.body);
              bodyData._auth_token = newToken;
              requestOptions.body = JSON.stringify(bodyData);
            }
            
            const retryResponse = await fetch(url, requestOptions);
            
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
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = `HTTP ${response.status} ${response.statusText}`;
        }
        
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

      let data;
      try {
        data = await response.json();
      } catch (e) {
        if (ENV.DEBUG_MODE) {
          console.error('❌ Failed to parse JSON response:', e);
        }
        throw new Error('Invalid JSON response from server');
      }
      
      return data;
    } catch (error) {
      if (ENV.DEBUG_MODE) {
        console.error('❌ API Request failed:', error);
      }
      
      // Handle network errors specifically
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network connection failed. Please check your internet connection.');
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
    return await this.request('api.php?action=auth/nonce', {
      method: 'POST',
      body: JSON.stringify({ publicKey })
    });
  }

  /**
   * Login with signed nonce
   */
  async login(publicKey, nonce, signature) {
    const response = await this.request('api.php?action=auth/login', {
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
    const result = await this.request('api.php?action=buy_ship', {
      method: 'POST'
    });
    
    // Update cache to reflect ship purchase
    if (result.ship_id) {
      const publicKey = this.getCurrentUserPublicKey();
      if (publicKey) {
        userCacheService.clearUserData(publicKey, 'ships');
        userCacheService.clearUserData(publicKey, 'profile');
      }
    }
    
    return result;
  }

  /**
   * Get user profile (REAL DATA FROM SERVER)
   */
  async getUserProfile() {
    // REAL API CALL - Get actual user data from database
    const result = await this.request('api.php?action=user_profile', {
      method: 'POST'
    });
    
    // Cache the real profile data
    const publicKey = this.getCurrentUserPublicKey();
    if (publicKey && result) {
      userCacheService.cacheUserProfile(publicKey, result);
    }
    
    return result;
  }

  /**
   * Get current user's public key from JWT
   */
  getCurrentUserPublicKey() {
    const token = this.getToken();
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.publicKey;
    } catch (error) {
      return null;
    }
  }

  /**
   * Send mission
   */
  async sendMission(type, mode, signedBurnTx) {
    const result = await this.request('api.php?action=send_mission', {
      method: 'POST',
      body: JSON.stringify({
        type,
        mode,
        signedBurnTx
      })
    });
    
    // Update cached balance
    if (result.br_balance !== undefined) {
      const publicKey = this.getCurrentUserPublicKey();
      if (publicKey) {
        userCacheService.updateCachedBalance(publicKey, result.br_balance);
      }
    }
    
    return result;
  }

  /**
   * Upgrade ship
   */
  async upgradeShip(level) {
    const result = await this.request('api.php?action=upgrade_ship', {
      method: 'POST',
      body: JSON.stringify({ level })
    });
    
    // Clear ship cache to force refresh
    const publicKey = this.getCurrentUserPublicKey();
    if (publicKey) {
      userCacheService.clearUserData(publicKey, 'ships');
      userCacheService.updateCachedBalance(publicKey, result.br_balance);
    }
    
    return result;
  }

  /**
   * Raid mission
   */
  async raidMission(missionId) {
    const result = await this.request('api.php?action=raid_mission', {
      method: 'POST',
      body: JSON.stringify({ mission_id: missionId })
    });
    
    // Update cached balance
    if (result.br_balance !== undefined) {
      const publicKey = this.getCurrentUserPublicKey();
      if (publicKey) {
        userCacheService.updateCachedBalance(publicKey, result.br_balance);
      }
    }
    
    return result;
  }

  /**
   * Claim rewards
   */
  async claimRewards() {
    const result = await this.request('api.php?action=claim_rewards', {
      method: 'POST'
    });
    
    // Update cached balance
    if (result.claimable_AT !== undefined) {
      const publicKey = this.getCurrentUserPublicKey();
      if (publicKey) {
        userCacheService.updateCachedBalance(publicKey, result.claimable_AT);
      }
    }
    
    return result;
  }

  /**
   * Get missions for raid
   */
  async getMissions() {
    return await this.request('api.php?action=list_missions');
  }

  /**
   * Get pending rewards
   */
  async getPendingRewards() {
    return await this.request('api.php?action=pending_missions');
  }

  /**
   * Get player energy
   */
  async getPlayerEnergy() {
    const publicKey = this.getCurrentUserPublicKey();
    
    // Try cache first for energy
    if (publicKey) {
      const cached = userCacheService.getCachedUserStats(publicKey);
      if (cached && cached.energy !== undefined) {
        return { energy: cached.energy };
      }
    }
    
    const result = await this.request('api.php?action=player_energy');
    
    // Cache the energy
    if (publicKey && result.energy !== undefined) {
      userCacheService.updateCachedEnergy(publicKey, result.energy);
    }
    
    return result;
  }

  /**
   * Scan for raidable missions (costs 1 energy)
   */
  async scanForRaids() {
    const result = await this.request('api.php?action=raid/scan', {
      method: 'POST'
    });
    
    // Update cached energy
    if (result.remainingEnergy !== undefined) {
      const publicKey = this.getCurrentUserPublicKey();
      if (publicKey) {
        userCacheService.updateCachedEnergy(publicKey, result.remainingEnergy);
      }
    }
    
    return result;
  }

  /**
   * Get player stats
   */
  async getPlayerStats() {
    return await this.request('api.php?action=player_stats');
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard() {
    return await this.request('api.php?action=leaderboard');
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;