// src/services/sessionManager.js
// Dedicated JWT and session management service

import ENV from '../config/environment.js';

/**
 * Session Manager - Handles JWT tokens, session persistence, and user authentication
 */
class SessionManager {
  constructor() {
    this.jwt = null;
    this.userProfile = null;
    this.sessionKey = 'bonkraiders_session';
    this.profileKey = 'bonkraiders_profile';
    this.baseURL = ENV.API_BASE_URL;
  }

  /**
   * Initialize session manager and check for existing session
   */
  async initialize() {
    try {
      // Try to restore session from storage
      const storedSession = this.getStoredSession();
      if (storedSession && !this.isTokenExpired(storedSession.token)) {
        this.jwt = storedSession.token;
        this.userProfile = storedSession.profile;
        
        if (ENV.DEBUG_MODE) {
          console.log('🔄 Restored session for user:', this.userProfile?.public_key);
        }
        
        return true;
      } else {
        this.clearSession();
        return false;
      }
    } catch (error) {
      if (ENV.DEBUG_MODE) {
        console.error('❌ Session initialization failed:', error);
      }
      this.clearSession();
      return false;
    }
  }

  /**
   * Authenticate user with wallet signature
   */
  async authenticateUser(publicKey, signMessageFn) {
    try {
      if (ENV.DEBUG_MODE) {
        console.log('🔐 Starting authentication for:', publicKey);
      }

      // Step 1: Get nonce
      const nonceResponse = await this.makeRequest('/api.php?action=auth/nonce', {
        method: 'POST',
        body: JSON.stringify({ publicKey })
      });

      const { nonce } = nonceResponse;
      if (!nonce) {
        throw new Error('Failed to get authentication nonce');
      }

      // Step 2: Sign nonce
      const encoder = new TextEncoder();
      const encoded = encoder.encode(nonce);
      const rawSignature = await signMessageFn(encoded);
      
      if (!rawSignature) {
        throw new Error('Wallet returned empty signature');
      }

      // Step 3: Convert signature to base64
      const signatureB64 = this.signatureToBase64(rawSignature);
      
      // Step 4: Login with signature
      const loginResponse = await this.makeRequest('/api.php?action=auth/login', {
        method: 'POST',
        body: JSON.stringify({
          publicKey,
          nonce,
          signature: signatureB64
        })
      });

      if (!loginResponse.token) {
        throw new Error('Authentication failed - no token received');
      }

      // Step 5: Set token and get user profile
      this.jwt = loginResponse.token;
      await this.loadUserProfile();

      // Step 6: Store session
      this.storeSession();

      if (ENV.DEBUG_MODE) {
        console.log('✅ Authentication successful for:', publicKey);
      }

      return {
        token: this.jwt,
        profile: this.userProfile
      };
    } catch (error) {
      if (ENV.DEBUG_MODE) {
        console.error('❌ Authentication failed:', error);
      }
      this.clearSession();
      throw error;
    }
  }

  /**
   * Load user profile from server
   */
  async loadUserProfile() {
    try {
      const profile = await this.makeAuthenticatedRequest('/api.php?action=user_profile');
      this.userProfile = profile;
      
      if (ENV.DEBUG_MODE) {
        console.log('✅ User profile loaded:', profile.public_key);
      }
      
      return profile;
    } catch (error) {
      if (ENV.DEBUG_MODE) {
        console.error('❌ Failed to load user profile:', error);
      }
      throw error;
    }
  }

  /**
   * Make authenticated API request with automatic token refresh
   */
  async makeAuthenticatedRequest(endpoint, options = {}) {
    // Check if token needs refresh
    if (this.jwt && this.isTokenExpired(this.jwt)) {
      if (ENV.DEBUG_MODE) {
        console.log('🔄 Token expired, clearing session');
      }
      this.clearSession();
      throw new Error('Session expired. Please reconnect your wallet.');
    }

    if (!this.jwt) {
      throw new Error('No authentication token available');
    }

    return await this.makeRequest(endpoint, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.jwt}`,
        'X-Authorization': `Bearer ${this.jwt}`,
        ...options.headers
      }
    });
  }

  /**
   * Make basic API request
   */
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
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
      console.log('📡 API Request:', {
        url,
        method: requestOptions.method || 'GET',
        hasAuth: !!requestOptions.headers.Authorization
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

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorText;
        } catch {
          errorMessage = errorText;
        }
        
        // Handle authentication errors
        if (response.status === 401) {
          this.clearSession();
          throw new Error('Session expired. Please reconnect your wallet.');
        }
        
        throw new Error(`API Error ${response.status}: ${errorMessage}`);
      }

      return await response.json();
    } catch (error) {
      if (ENV.DEBUG_MODE) {
        console.error('❌ API Request failed:', error);
      }
      throw error;
    }
  }

  /**
   * Store session in localStorage
   */
  storeSession() {
    try {
      const sessionData = {
        token: this.jwt,
        profile: this.userProfile,
        timestamp: Date.now()
      };
      
      localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
      
      if (ENV.DEBUG_MODE) {
        console.log('💾 Session stored');
      }
    } catch (error) {
      console.warn('Failed to store session:', error);
    }
  }

  /**
   * Get stored session from localStorage
   */
  getStoredSession() {
    try {
      const stored = localStorage.getItem(this.sessionKey);
      if (!stored) return null;
      
      const sessionData = JSON.parse(stored);
      
      // Check if session is too old (24 hours)
      const age = Date.now() - sessionData.timestamp;
      if (age > 24 * 60 * 60 * 1000) {
        this.clearSession();
        return null;
      }
      
      return sessionData;
    } catch (error) {
      console.warn('Failed to get stored session:', error);
      return null;
    }
  }

  /**
   * Clear session data
   */
  clearSession() {
    this.jwt = null;
    this.userProfile = null;
    
    try {
      localStorage.removeItem(this.sessionKey);
      localStorage.removeItem(this.profileKey);
      sessionStorage.removeItem('bonkraiders_jwt');
      
      if (ENV.DEBUG_MODE) {
        console.log('🗑️ Session cleared');
      }
    } catch (error) {
      console.warn('Failed to clear session storage:', error);
    }
  }

  /**
   * Check if JWT token is expired
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
   * Convert signature to base64
   */
  signatureToBase64(signature) {
    try {
      // If already string, assume it's base64
      if (typeof signature === 'string') {
        try {
          atob(signature);
          return signature;
        } catch {
          // If not base64, try to convert from hex
          if (signature.match(/^[0-9a-fA-F]+$/)) {
            const bytes = new Uint8Array(signature.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
            return this.uint8ArrayToBase64(bytes);
          }
          throw new Error('Invalid signature format');
        }
      }
      
      // If Uint8Array or similar
      if (signature instanceof Uint8Array) {
        return this.uint8ArrayToBase64(signature);
      }
      
      // If ArrayBuffer
      if (signature instanceof ArrayBuffer) {
        return this.uint8ArrayToBase64(new Uint8Array(signature));
      }
      
      // If Array
      if (Array.isArray(signature)) {
        return this.uint8ArrayToBase64(new Uint8Array(signature));
      }
      
      // If has signature property
      if (signature.signature) {
        return this.signatureToBase64(signature.signature);
      }
      
      throw new Error('Unsupported signature format');
    } catch (error) {
      console.error('Error converting signature:', error);
      throw new Error(`Failed to convert signature: ${error.message}`);
    }
  }

  /**
   * Convert Uint8Array to base64
   */
  uint8ArrayToBase64(uint8Array) {
    if (!(uint8Array instanceof Uint8Array)) {
      uint8Array = new Uint8Array(uint8Array);
    }
    
    return btoa(String.fromCharCode.apply(null, uint8Array));
  }

  /**
   * Get current user's public key
   */
  getCurrentUserPublicKey() {
    return this.userProfile?.public_key || null;
  }

  /**
   * Get current JWT token
   */
  getToken() {
    return this.jwt;
  }

  /**
   * Get current user profile
   */
  getUserProfile() {
    return this.userProfile;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!(this.jwt && this.userProfile && !this.isTokenExpired(this.jwt));
  }

  /**
   * Update user profile data
   */
  updateUserProfile(updates) {
    if (this.userProfile) {
      this.userProfile = { ...this.userProfile, ...updates };
      this.storeSession();
    }
  }

  /**
   * Game-specific methods
   */

  /**
   * Buy ship
   */
  async buyShip() {
    const result = await this.makeAuthenticatedRequest('/api.php?action=buy_ship', {
      method: 'POST'
    });
    
    // Update profile to reflect ship purchase
    if (result.ship_id && this.userProfile) {
      this.userProfile.ship = {
        id: result.ship_id,
        level: 1,
        balance: 0,
        purchased_at: new Date().toISOString()
      };
      this.storeSession();
    }
    
    return result;
  }

  /**
   * Send mission
   */
  async sendMission(type, mode, signedBurnTx) {
    const result = await this.makeAuthenticatedRequest('/api.php?action=send_mission', {
      method: 'POST',
      body: JSON.stringify({ type, mode, signedBurnTx })
    });
    
    // Update cached balance
    if (result.br_balance !== undefined && this.userProfile?.ship) {
      this.userProfile.ship.balance = result.br_balance;
      this.storeSession();
    }
    
    return result;
  }

  /**
   * Upgrade ship
   */
  async upgradeShip(level) {
    const result = await this.makeAuthenticatedRequest('/api.php?action=upgrade_ship', {
      method: 'POST',
      body: JSON.stringify({ level })
    });
    
    // Update cached ship data
    if (this.userProfile?.ship) {
      this.userProfile.ship.level = result.level || level;
      this.userProfile.ship.balance = result.br_balance;
      this.storeSession();
    }
    
    return result;
  }

  /**
   * Raid mission
   */
  async raidMission(missionId) {
    const result = await this.makeAuthenticatedRequest('/api.php?action=raid_mission', {
      method: 'POST',
      body: JSON.stringify({ mission_id: missionId })
    });
    
    // Update cached balance
    if (result.br_balance !== undefined && this.userProfile?.ship) {
      this.userProfile.ship.balance = result.br_balance;
      this.storeSession();
    }
    
    return result;
  }

  /**
   * Get player energy
   */
  async getPlayerEnergy() {
    const result = await this.makeAuthenticatedRequest('/api.php?action=player_energy');
    
    // Update cached energy
    if (result.energy !== undefined && this.userProfile?.energy) {
      this.userProfile.energy.current = result.energy;
      this.storeSession();
    }
    
    return result;
  }

  /**
   * Scan for raids
   */
  async scanForRaids() {
    const result = await this.makeAuthenticatedRequest('/api.php?action=raid/scan', {
      method: 'POST'
    });
    
    // Update cached energy
    if (result.remainingEnergy !== undefined && this.userProfile?.energy) {
      this.userProfile.energy.current = result.remainingEnergy;
      this.storeSession();
    }
    
    return result;
  }

  /**
   * Get missions for raid
   */
  async getMissions() {
    return await this.makeAuthenticatedRequest('/api.php?action=list_missions');
  }

  /**
   * Get pending rewards
   */
  async getPendingRewards() {
    return await this.makeAuthenticatedRequest('/api.php?action=pending_missions');
  }

  /**
   * Claim rewards
   */
  async claimRewards() {
    const result = await this.makeAuthenticatedRequest('/api.php?action=claim_rewards', {
      method: 'POST'
    });
    
    // Update cached balance
    if (result.claimable_AT !== undefined && this.userProfile?.ship) {
      this.userProfile.ship.balance = result.claimable_AT;
      this.storeSession();
    }
    
    return result;
  }
}

// Create singleton instance
const sessionManager = new SessionManager();

export default sessionManager;