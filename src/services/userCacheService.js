// src/services/userCacheService.js
// Local cache service for user data persistence

import ENV from '../config/environment.js';

/**
 * User Cache Service - Manages local storage of user data
 */
class UserCacheService {
  constructor() {
    this.cachePrefix = 'bonkraiders_';
    this.cacheVersion = '1.0';
  }

  /**
   * Get cache key for user
   */
  getCacheKey(publicKey, dataType) {
    return `${this.cachePrefix}${dataType}_${publicKey}`;
  }

  /**
   * Store user data in local cache
   */
  setUserData(publicKey, dataType, data) {
    try {
      const cacheKey = this.getCacheKey(publicKey, dataType);
      const cacheData = {
        data,
        timestamp: Date.now(),
        version: this.cacheVersion
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      
      if (ENV.DEBUG_MODE) {
        console.log(`💾 Cached ${dataType} for user:`, publicKey);
      }
    } catch (error) {
      console.warn('Failed to cache user data:', error);
    }
  }

  /**
   * Get user data from local cache
   */
  getUserData(publicKey, dataType, maxAge = 5 * 60 * 1000) { // 5 minutes default
    try {
      const cacheKey = this.getCacheKey(publicKey, dataType);
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) {
        return null;
      }

      const cacheData = JSON.parse(cached);
      
      // Check version compatibility
      if (cacheData.version !== this.cacheVersion) {
        this.clearUserData(publicKey, dataType);
        return null;
      }

      // Check if cache is still valid
      const age = Date.now() - cacheData.timestamp;
      if (age > maxAge) {
        this.clearUserData(publicKey, dataType);
        return null;
      }

      if (ENV.DEBUG_MODE) {
        console.log(`💾 Retrieved cached ${dataType} for user:`, publicKey);
      }

      return cacheData.data;
    } catch (error) {
      console.warn('Failed to retrieve cached data:', error);
      return null;
    }
  }

  /**
   * Clear specific user data from cache
   */
  clearUserData(publicKey, dataType) {
    try {
      const cacheKey = this.getCacheKey(publicKey, dataType);
      localStorage.removeItem(cacheKey);
      
      if (ENV.DEBUG_MODE) {
        console.log(`💾 Cleared cached ${dataType} for user:`, publicKey);
      }
    } catch (error) {
      console.warn('Failed to clear cached data:', error);
    }
  }

  /**
   * Clear all user data from cache
   */
  clearAllUserData(publicKey) {
    try {
      const keys = Object.keys(localStorage);
      const userKeys = keys.filter(key => key.startsWith(`${this.cachePrefix}`) && key.includes(publicKey));
      
      userKeys.forEach(key => localStorage.removeItem(key));
      
      if (ENV.DEBUG_MODE) {
        console.log(`💾 Cleared all cached data for user:`, publicKey);
      }
    } catch (error) {
      console.warn('Failed to clear all cached data:', error);
    }
  }

  /**
   * Cache user profile data
   */
  cacheUserProfile(publicKey, profile) {
    this.setUserData(publicKey, 'profile', profile);
  }

  /**
   * Get cached user profile
   */
  getCachedUserProfile(publicKey) {
    return this.getUserData(publicKey, 'profile', 10 * 60 * 1000); // 10 minutes
  }

  /**
   * Cache user ships
   */
  cacheUserShips(publicKey, ships) {
    this.setUserData(publicKey, 'ships', ships);
  }

  /**
   * Get cached user ships
   */
  getCachedUserShips(publicKey) {
    return this.getUserData(publicKey, 'ships', 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Cache user stats
   */
  cacheUserStats(publicKey, stats) {
    this.setUserData(publicKey, 'stats', stats);
  }

  /**
   * Get cached user stats
   */
  getCachedUserStats(publicKey) {
    return this.getUserData(publicKey, 'stats', 2 * 60 * 1000); // 2 minutes
  }

  /**
   * Cache user settings
   */
  cacheUserSettings(publicKey, settings) {
    this.setUserData(publicKey, 'settings', settings);
  }

  /**
   * Get cached user settings
   */
  getCachedUserSettings(publicKey) {
    return this.getUserData(publicKey, 'settings', 30 * 60 * 1000); // 30 minutes
  }

  /**
   * Cache game state
   */
  cacheGameState(publicKey, gameState) {
    this.setUserData(publicKey, 'gamestate', gameState);
  }

  /**
   * Get cached game state
   */
  getCachedGameState(publicKey) {
    return this.getUserData(publicKey, 'gamestate', 1 * 60 * 1000); // 1 minute
  }

  /**
   * Update cached balance
   */
  updateCachedBalance(publicKey, balance) {
    const cached = this.getCachedUserStats(publicKey);
    if (cached) {
      cached.balance = balance;
      this.cacheUserStats(publicKey, cached);
    }
  }

  /**
   * Update cached energy
   */
  updateCachedEnergy(publicKey, energy) {
    const cached = this.getCachedUserStats(publicKey);
    if (cached) {
      cached.energy = energy;
      this.cacheUserStats(publicKey, cached);
    }
  }

  /**
   * Get cache size info
   */
  getCacheInfo() {
    try {
      const keys = Object.keys(localStorage);
      const bonkKeys = keys.filter(key => key.startsWith(this.cachePrefix));
      
      let totalSize = 0;
      bonkKeys.forEach(key => {
        totalSize += localStorage.getItem(key).length;
      });

      return {
        keys: bonkKeys.length,
        sizeBytes: totalSize,
        sizeKB: Math.round(totalSize / 1024 * 100) / 100
      };
    } catch (error) {
      return { keys: 0, sizeBytes: 0, sizeKB: 0 };
    }
  }

  /**
   * Clean old cache entries
   */
  cleanOldCache() {
    try {
      const keys = Object.keys(localStorage);
      const bonkKeys = keys.filter(key => key.startsWith(this.cachePrefix));
      
      bonkKeys.forEach(key => {
        try {
          const cached = JSON.parse(localStorage.getItem(key));
          const age = Date.now() - cached.timestamp;
          
          // Remove cache older than 1 hour
          if (age > 60 * 60 * 1000) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          // Remove corrupted cache entries
          localStorage.removeItem(key);
        }
      });
      
      if (ENV.DEBUG_MODE) {
        console.log('💾 Cleaned old cache entries');
      }
    } catch (error) {
      console.warn('Failed to clean old cache:', error);
    }
  }
}

// Create singleton instance
const userCacheService = new UserCacheService();

export default userCacheService;