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
  }

  /**
   * Connect to WebSocket server
   */
  connect(userId, token) {
    if (this.isConnected) {
      return Promise.resolve();
    }

    this.userId = userId;
    
    // Use real WebSocket client if available
    if (window.BonkRaidersWebSocketClient) {
      return this._connectWithClient(userId, token);
    }
    
    return new Promise((resolve, reject) => {
      try {
        // Use mock WebSocket for development
        let wsUrl;
        
        if (ENV.IS_DEVELOPMENT || ENV.DEBUG_MODE) {
          // In development, use a mock WebSocket that doesn't actually connect
          this.mockWebSocketConnection(userId, token);
          resolve();
          return;
        } else {
          // In production, use the real WebSocket URL
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const apiHost = ENV.API_BASE_URL.replace(/^https?:\/\//, '');
          wsUrl = `${protocol}//${apiHost}/ws?user_id=${userId}&token=${encodeURIComponent(token)}`;
        }
        
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
        reject(error);
      }
    });
  }

  /**
   * Connect using the BonkRaidersWebSocketClient
   */
  _connectWithClient(userId, token) {
    return new Promise((resolve, reject) => {
      try {
        // Create WebSocket URL
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const apiHost = ENV.API_BASE_URL.replace(/^https?:\/\//, '');
        const wsUrl = `${protocol}//${apiHost}/ws`;
        
        // Create client
        const client = new window.BonkRaidersWebSocketClient(wsUrl);
        
        // Set up event handlers
        client.on('connected', () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this._emit('connected');
        });
        
        client.on('authenticated', (data) => {
          console.log('WebSocket authenticated:', data);
          this._setupClientEventHandlers(client);
          resolve();
        });
        
        client.on('auth_failed', (data) => {
          console.error('WebSocket authentication failed:', data);
          reject(new Error(data.message || 'Authentication failed'));
        });
        
        client.on('error', (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        });
        
        client.on('disconnected', (data) => {
          console.log('WebSocket disconnected:', data);
          this.isConnected = false;
          this._emit('disconnected', data);
        });
        
        // Connect and authenticate
        client.connect()
          .then(() => client.authenticate(token))
          .catch(reject);
        
        // Store client
        this.ws = client;
      } catch (error) {
        console.error('Failed to connect with WebSocket client:', error);
        reject(error);
      }
    });
  }

  /**
   * Set up event handlers for the WebSocket client
   */
  _setupClientEventHandlers(client) {
    // Forward relevant events
    const events = [
      'user_status_update',
      'chat_message',
      'raid_incoming',
      'raid_completed',
      'battle_action',
      'leaderboard',
      'online_users'
    ];
    
    events.forEach(event => {
      client.on(event, (data) => {
        this._emit(event, data);
      });
    });
  }

  /**
   * Create a mock WebSocket connection for development
   */
  mockWebSocketConnection(userId, token) {
    if (ENV.DEBUG_MODE) {
      console.log('🔌 Creating mock WebSocket connection for development');
    }
    
    // Create a mock WebSocket object
    this.ws = {
      send: (message) => {
        if (ENV.DEBUG_MODE) {
          console.log('📤 Mock WebSocket message sent:', message);
        }
      },
      close: () => {
        if (ENV.DEBUG_MODE) {
          console.log('🔌 Mock WebSocket closed');
        }
      }
    };
    
    // Simulate successful connection
    setTimeout(() => {
      this.isConnected = true;
      this._emit('connected');
      
      // Simulate periodic user status updates
      this.mockStatusInterval = setInterval(() => {
        this._emit('user_status_update', {
          userId: Math.floor(Math.random() * 100) + 1,
          status: ['online', 'in_mission', 'offline'][Math.floor(Math.random() * 3)],
          lastSeen: Date.now()
        });
      }, 30000);
    }, 500);
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.isConnected = false;
    this.stopHeartbeat();
    
    // Clear mock intervals if they exist
    if (this.mockStatusInterval) {
      clearInterval(this.mockStatusInterval);
      this.mockStatusInterval = null;
    }
  }

  /**
   * Send message to server
   */
  send(type, data = {}) {
    // In development mode with mock WebSocket, always allow sending
    if (ENV.IS_DEVELOPMENT || ENV.DEBUG_MODE) {
      if (this.ws && typeof this.ws.send === 'function') {
        try {
          const message = {
            type,
            data,
            timestamp: Date.now(),
            userId: this.userId
          };
          
          this.ws.send(JSON.stringify(message));
          return true;
        } catch (error) {
          console.warn('⚠️ Error sending to mock WebSocket:', error);
          return false;
        }
      }
    }
    
    // For production, check connection status
    if (!this.isConnected || !this.ws || typeof this.ws.send !== 'function') {
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
      window.AstroUI.setStatus(`🚨 INCOMING RAID from ${attackerName}!`);
    }

    // Trigger defense battle animation
    if (window.startDefenseBattle) {
      setTimeout(() => {
        window.startDefenseBattle();
      }, 2000);
    }

    this._emit('raid_incoming', data);
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
      } else {
        if (window.AstroUI) {
          window.AstroUI.setStatus(`🛡️ Raid repelled! Base defended successfully!`);
        }
      }
    }

    this._emit('raid_completed', data);
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
    // Don't attempt reconnection in development mode
    if (ENV.IS_DEVELOPMENT || ENV.DEBUG_MODE) {
      this.mockWebSocketConnection(this.userId, null);
      return;
    }
    
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
    // In development, always report as connected
    if (ENV.IS_DEVELOPMENT || ENV.DEBUG_MODE) {
      return {
        isConnected: true,
        reconnectAttempts: 0,
        userId: this.userId,
        isMock: true
      };
    }
    
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      userId: this.userId,
      isMock: false
    };
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;