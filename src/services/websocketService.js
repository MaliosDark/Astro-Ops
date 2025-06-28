// src/services/websocketService.js
// WebSocket service for real-time raid notifications and updates

import ENV from '../config/environment.js';

/**
 * WebSocket Service for real-time game events
 */
class WebSocketService {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.eventListeners = new Map();
    this.userId = null;
    this.heartbeatInterval = null;
    this.mockMode = ENV.DEBUG_MODE; // Use mock mode in development
  }

  /**
   * Connect to WebSocket server
   */
  connect(userId, token) {
    if (this.isConnected) {
      return Promise.resolve();
    }

    this.userId = userId;
    
    // If in mock mode, simulate connection
    if (this.mockMode) {
      return this._setupMockConnection();
    }
    
    return new Promise((resolve, reject) => {
      try {
        // Use secure WebSocket for production, regular for development
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//api.bonkraiders.com/ws?user_id=${userId}&token=${encodeURIComponent(token)}`;
        
        if (ENV.DEBUG_MODE) {
          console.log('🔌 Connecting to WebSocket:', wsUrl);
        }

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          if (ENV.DEBUG_MODE) {
            console.log('✅ WebSocket connected');
          }

          // Start heartbeat
          this.startHeartbeat();
          
          // Send authentication
          this.send('auth', { userId, token });
          
          this._emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('❌ Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          this.isConnected = false;
          this.stopHeartbeat();
          
          if (ENV.DEBUG_MODE) {
            console.log('🔌 WebSocket disconnected:', event.code, event.reason);
          }

          this._emit('disconnected', { code: event.code, reason: event.reason });

          // Attempt to reconnect if not a clean close
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this._emit('error', error);
          reject(error);
        };

      } catch (error) {
        console.error('❌ Failed to create WebSocket connection:', error);
        
        // Fall back to mock mode if connection fails
        if (ENV.DEBUG_MODE) {
          console.log('⚠️ Falling back to mock WebSocket mode');
          this.mockMode = true;
          this._setupMockConnection().then(resolve).catch(reject);
        } else {
          reject(error);
        }
      }
    });
  }

  /**
   * Set up mock connection for development
   */
  _setupMockConnection() {
    return new Promise((resolve) => {
      this.isConnected = true;
      
      if (ENV.DEBUG_MODE) {
        console.log('🔌 Mock WebSocket connected');
      }
      
      // Start mock heartbeat
      this.startHeartbeat();
      
      // Simulate connection event
      this._emit('connected');
      
      // Set up mock raid events
      this._setupMockEvents();
      
      resolve();
    });
  }

  /**
   * Set up mock events for development
   */
  _setupMockEvents() {
    // Simulate incoming raid after 30-60 seconds
    setTimeout(() => {
      if (!this.isConnected) return;
      
      this.handleMessage({
        type: 'raid_incoming',
        data: {
          attackerId: 123,
          attackerName: 'RaidMaster42',
          missionType: 'BlackMarket',
          estimatedReward: 8000
        }
      });
    }, 30000 + Math.random() * 30000);
    
    // Simulate user status updates every 15 seconds
    setInterval(() => {
      if (!this.isConnected) return;
      
      const statuses = ['online', 'in_mission', 'offline'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      this.handleMessage({
        type: 'user_status_update',
        data: {
          userId: 100 + Math.floor(Math.random() * 10),
          status: randomStatus,
          timestamp: Date.now()
        }
      });
    }, 15000);
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    if (this.mockMode) {
      this.isConnected = false;
      this.stopHeartbeat();
      this._emit('disconnected', { code: 1000, reason: 'Client disconnect' });
      return;
    }
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.isConnected = false;
    this.stopHeartbeat();
  }

  /**
   * Send message to server
   */
  send(type, data = {}) {
    if (!this.isConnected) {
      console.warn('⚠️ WebSocket not connected, cannot send message');
      return false;
    }

    try {
      const message = {
        type,
        data,
        timestamp: Date.now(),
        userId: this.userId
      };

      if (this.mockMode) {
        // In mock mode, just log the message
        if (ENV.DEBUG_MODE) {
          console.log('📤 Mock WebSocket message sent:', message);
        }
        
        // Simulate raid completion response
        if (type === 'raid_initiated') {
          setTimeout(() => {
            this.handleMessage({
              type: 'raid_completed',
              data: {
                success: Math.random() > 0.3, // 70% success rate
                stolenAmount: Math.floor(Math.random() * 5000) + 1000,
                defenderId: data.targetMissionId,
                attackerId: this.userId,
                timestamp: Date.now()
              }
            });
          }, 5000);
        }
        
        return true;
      }

      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('❌ Failed to send WebSocket message:', error);
      return false;
    }
  }

  /**
   * Handle incoming messages
   */
  handleMessage(message) {
    const { type, data } = message;

    if (ENV.DEBUG_MODE) {
      console.log('📨 WebSocket message received:', type, data);
    }

    switch (type) {
      case 'raid_incoming':
        this.handleIncomingRaid(data);
        break;
      case 'raid_completed':
        this.handleRaidCompleted(data);
        break;
      case 'user_status_update':
        this.handleUserStatusUpdate(data);
        break;
      case 'mission_completed':
        this.handleMissionCompleted(data);
        break;
      case 'heartbeat':
        // Server heartbeat response
        break;
      default:
        this._emit('message', message);
    }
  }

  /**
   * Handle incoming raid notification
   */
  handleIncomingRaid(data) {
    const { attackerId, attackerName, missionType, estimatedReward } = data;
    
    // Show notification to user
    if (window.AstroUI) {
      window.AstroUI.setStatus(`🚨 INCOMING RAID from ${attackerName || 'Unknown'}!`);
    }

    // Trigger defense battle animation
    if (window.startDefenseBattle) {
      setTimeout(() => {
        window.startDefenseBattle();
      }, 2000);
    }

    this._emit('raid_incoming', {
      type: 'raid_incoming',
      title: '🚨 INCOMING RAID!',
      message: `${attackerName || 'An enemy'} is attacking your base!`,
      details: `Mission type: ${missionType || 'Unknown'}, Potential loss: ${estimatedReward || '???'} BR`
    });
  }

  /**
   * Handle raid completion notification
   */
  handleRaidCompleted(data) {
    const { success, stolenAmount, defenderId, attackerId } = data;
    
    if (defenderId === this.userId) {
      // We were raided
      if (success) {
        if (window.AstroUI) {
          window.AstroUI.setStatus(`💔 Raid successful! Lost ${stolenAmount} BR`);
        }
        
        this._emit('raid_completed', {
          type: 'raid_failed',
          title: '💔 BASE RAIDED!',
          message: `Enemy forces have successfully raided your base!`,
          details: `You lost ${stolenAmount} BR in the attack.`
        });
      } else {
        if (window.AstroUI) {
          window.AstroUI.setStatus(`🛡️ Raid repelled! Base defended successfully!`);
        }
        
        this._emit('raid_completed', {
          type: 'raid_success',
          title: '🛡️ RAID REPELLED!',
          message: 'Your defenses successfully protected your base!',
          details: 'All resources are safe. Your troops fought valiantly.'
        });
      }
    } else if (attackerId === this.userId) {
      // We raided someone
      if (success) {
        if (window.AstroUI) {
          window.AstroUI.setStatus(`💰 Raid successful! Gained ${stolenAmount} BR`);
        }
        
        this._emit('raid_completed', {
          type: 'raid_success',
          title: '💰 RAID SUCCESSFUL!',
          message: `Your forces have successfully raided the enemy base!`,
          details: `You gained ${stolenAmount} BR from the raid.`
        });
      } else {
        if (window.AstroUI) {
          window.AstroUI.setStatus(`❌ Raid failed! Target was well defended.`);
        }
        
        this._emit('raid_completed', {
          type: 'raid_failed',
          title: '❌ RAID FAILED!',
          message: 'The enemy defenses were too strong!',
          details: 'Your forces were repelled. No resources gained.'
        });
      }
    }
  }

  /**
   * Handle user status updates
   */
  handleUserStatusUpdate(data) {
    this._emit('user_status_update', data);
  }

  /**
   * Handle mission completion notifications
   */
  handleMissionCompleted(data) {
    this._emit('mission_completed', data);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.send('heartbeat', { timestamp: Date.now() });
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Attempt to reconnect
   */
  attemptReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    if (ENV.DEBUG_MODE) {
      console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
    }

    setTimeout(() => {
      if (this.userId) {
        this.connect(this.userId, sessionStorage.getItem('bonkraiders_jwt'));
      }
    }, delay);
  }

  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  _emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} event listener:`, error);
        }
      });
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      userId: this.userId,
      mockMode: this.mockMode
    };
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;