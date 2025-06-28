// src/services/sessionManager.js
// Dedicated session management service that delegates API calls to apiService

import ENV from '../config/environment.js';
import apiService from './apiService.js';

/**
 * Session Manager - Handles session persistence and user authentication
 * Delegates all API calls to apiService for consistent error handling
 */
class SessionManager {
  constructor() {
    this.userProfile = null;
    this.sessionKey = 'bonkraiders_session';
    this.profileKey = 'bonkraiders_profile';
  }

  /**
   * Initialize session manager and check for existing session
   */
  async initialize() {
    try {
      // Try to restore session from storage
      const storedSession = this.getStoredSession();
      if (storedSession && !apiService.isTokenExpired(storedSession.token)) {
        apiService.setToken(storedSession.token);
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

      // Clear any existing token before authentication
      apiService.clearToken();
      
      // Step 1: Get nonce using apiService
      const nonceResponse = await apiService.getNonce(publicKey);
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
      
      // Step 4: Login with signature using apiService
      const loginResponse = await apiService.login(publicKey, nonce, signatureB64);

      if (!loginResponse.token) {
        throw new Error('Authentication failed - no token received');
      }

      // Ensure token is set before making profile request
      if (ENV.DEBUG_MODE) {
        console.log('🔑 Token received, length:', loginResponse.token.length);
      }
      
      // Step 5: Get user profile using apiService
      await this.loadUserProfile();

      // Step 6: Store session
      this.storeSession();

      if (ENV.DEBUG_MODE) {
        console.log('✅ Authentication successful for:', publicKey);
      }

      return {
        token: apiService.getToken(),
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
   * Load user profile from server using apiService
   */
  async loadUserProfile() {
    try {
      const profile = await apiService.getUserProfile();
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
   * Store session in localStorage
   */
  storeSession() {
    try {
      const sessionData = {
        token: apiService.getToken(),
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
    this.userProfile = null;
    apiService.clearToken();
    
    try {
      localStorage.removeItem(this.sessionKey);
      localStorage.removeItem(this.profileKey);
      
      if (ENV.DEBUG_MODE) {
        console.log('🗑️ Session cleared');
      }
    } catch (error) {
      console.warn('Failed to clear session storage:', error);
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
    return this.userProfile?.public_key || apiService.getCurrentUserPublicKey();
  }

  /**
   * Get current JWT token
   */
  getToken() {
    return apiService.getToken();
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
    const token = apiService.getToken();
    return !!(token && this.userProfile && !apiService.isTokenExpired(token));
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
   * Game-specific methods - delegate to apiService
   */

  /**
   * Buy ship
   */
  async buyShip() {
    const result = await apiService.buyShip();
    
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
    const result = await apiService.sendMission(type, mode, signedBurnTx);
    
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
    const result = await apiService.upgradeShip(level);
    
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
    const result = await apiService.raidMission(missionId);
    
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
    const result = await apiService.getPlayerEnergy();
    
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
    const result = await apiService.scanForRaids();
    
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
    return await apiService.getMissions();
  }

  /**
   * Get pending rewards
   */
  async getPendingRewards() {
    return await apiService.getPendingRewards();
  }

  /**
   * Claim rewards
   */
  async claimRewards() {
    const result = await apiService.claimRewards();
    
    // Update cached balance
    if (result.claimable_AT !== undefined && this.userProfile?.ship) {
      this.userProfile.ship.balance = result.claimable_AT;
      this.storeSession();
    }
    
    return result;
  }

  /**
   * Get player stats
   */
  async getPlayerStats() {
    return await apiService.getPlayerStats();
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard() {
    return await apiService.getLeaderboard();
  }
}

// Create singleton instance
const sessionManager = new SessionManager();

export default sessionManager;