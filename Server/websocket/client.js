/**
 * Bonk Raiders WebSocket Client
 * Simple client for connecting to the Bonk Raiders WebSocket server
 */

class BonkRaidersWebSocketClient {
  constructor(url) {
    this.url = url;
    this.socket = null;
    this.connected = false;
    this.authenticated = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.heartbeatInterval = null;
    this.eventListeners = new Map();
    this.userId = null;
  }

  /**
   * Connect to WebSocket server
   */
  connect() {
    if (this.socket && this.connected) {
      console.log('WebSocket already connected');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        console.log(`Connecting to WebSocket server: ${this.url}`);
        this.socket = new WebSocket(this.url);

        this.socket.onopen = () => {
          console.log('WebSocket connection established');
          this.connected = true;
          this.reconnectAttempts = 0;
          this._startHeartbeat();
          this._emit('connected');
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this._handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.socket.onclose = (event) => {
          this.connected = false;
          this._stopHeartbeat();
          console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
          this._emit('disconnected', { code: event.code, reason: event.reason });

          // Attempt to reconnect if not a clean close
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this._attemptReconnect();
          }
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this._emit('error', error);
          reject(error);
        };
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        reject(error);
      }
    });
  }

  /**
   * Authenticate with the server
   */
  authenticate(token) {
    if (!this.connected) {
      console.error('Cannot authenticate: WebSocket not connected');
      return Promise.reject(new Error('WebSocket not connected'));
    }

    return new Promise((resolve, reject) => {
      // Set up one-time event listeners for authentication response
      const authSuccessListener = (data) => {
        this.off('authenticated', authSuccessListener);
        this.off('auth_failed', authFailedListener);
        resolve(data);
      };
      
      const authFailedListener = (data) => {
        this.off('authenticated', authSuccessListener);
        this.off('auth_failed', authFailedListener);
        reject(new Error(data.message || 'Authentication failed'));
      };
      
      this.on('authenticated', authSuccessListener);
      this.on('auth_failed', authFailedListener);
      
      // Send authentication request
      this.send('auth', { token });
      
      // Set timeout for authentication
      setTimeout(() => {
        if (!this.authenticated) {
          this.off('authenticated', authSuccessListener);
          this.off('auth_failed', authFailedListener);
          reject(new Error('Authentication timeout'));
        }
      }, 5000);
    });
  }

  /**
   * Disconnect from the server
   */
  disconnect() {
    if (this.socket) {
      this.socket.close(1000, 'Client disconnect');
      this.socket = null;
    }
    
    this.connected = false;
    this.authenticated = false;
    this._stopHeartbeat();
  }

  /**
   * Send message to server
   */
  send(type, data = {}) {
    if (!this.connected || !this.socket) {
      console.error('Cannot send message: WebSocket not connected');
      return false;
    }

    try {
      const message = {
        type,
        data,
        timestamp: Date.now()
      };

      this.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      return false;
    }
  }

  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
    return this; // For chaining
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
    return this; // For chaining
  }

  /**
   * Handle incoming messages
   */
  _handleMessage(message) {
    const { type, data } = message;

    switch (type) {
      case 'auth_success':
        this.authenticated = true;
        this.userId = data.userId;
        this._emit('authenticated', data);
        break;

      case 'auth_failed':
        this.authenticated = false;
        this._emit('auth_failed', data);
        break;

      case 'heartbeat':
        // Server heartbeat response
        break;

      case 'error':
        console.error('WebSocket error from server:', data.message);
        this._emit('server_error', data);
        break;

      default:
        // Forward all other messages to event listeners
        this._emit(type, data);
        this._emit('message', message);
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  _startHeartbeat() {
    this._stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.connected) {
        this.send('heartbeat', { timestamp: Date.now() });
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  _stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Attempt to reconnect
   */
  _attemptReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);

    setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
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
   * Send chat message
   */
  sendChatMessage(message, channel = 'global') {
    return this.send('chat_message', { message, channel });
  }

  /**
   * Update player status
   */
  updateStatus(status, details = null) {
    return this.send('status_update', { status, details });
  }

  /**
   * Notify raid initiated
   */
  notifyRaidInitiated(targetMissionId) {
    return this.send('raid_initiated', { targetMissionId });
  }

  /**
   * Notify raid completed
   */
  notifyRaidCompleted(missionId, success, stolen) {
    return this.send('raid_completed', { missionId, success, stolen });
  }
}

// Export for use in browser
if (typeof window !== 'undefined') {
  window.BonkRaidersWebSocketClient = BonkRaidersWebSocketClient;
}