/**
 * WebSocket Client for Bonk Raiders
 * This file provides a client-side implementation for connecting to the WebSocket server
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
    this.token = null;
  }

  /**
   * Connect to WebSocket server
   */
  connect(token) {
    if (this.socket && this.connected) {
      console.log('WebSocket already connected');
      return Promise.resolve();
    }

    this.token = token;

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
          
          // Authenticate after connection
          if (token) {
            this.authenticate(token);
          }
          
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
      return false;
    }

    this.token = token;
    
    this.send('auth', { token });
    return true;
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
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.connected,
      authenticated: this.authenticated,
      userId: this.userId,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * Handle incoming messages
   */
  _handleMessage(message) {
    const { type, data } = message;

    console.log('WebSocket message received:', type);

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
      this.connect(this.token);
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
   * Join a chat channel
   */
  joinChannel(channel) {
    return this.send('join_channel', { channel });
  }

  /**
   * Leave a chat channel
   */
  leaveChannel(channel) {
    return this.send('leave_channel', { channel });
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
   * Request leaderboard data
   */
  requestLeaderboard() {
    return this.send('request_leaderboard');
  }

  /**
   * Request chat history
   */
  requestChatHistory(channel = 'global') {
    return this.send('request_chat_history', { channel });
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

  /**
   * Send battle action
   */
  sendBattleAction(battleId, action, actionData = {}) {
    return this.send('battle_action', { battleId, action, actionData });
  }
}

// Export for use in browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BonkRaidersWebSocketClient;
} else {
  window.BonkRaidersWebSocketClient = BonkRaidersWebSocketClient;
}