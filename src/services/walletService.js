// src/services/walletService.js
// Dedicated wallet service for all wallet-related operations

import ENV from '../config/environment.js';

/**
 * Wallet Service - Handles all wallet detection, connection, and management
 */
class WalletService {
  constructor() {
    this.connectedWallet = null;
    this.isConnecting = false;
    this.eventListeners = new Map();
  }

  /**
   * Get all available Solana wallet providers
   */
  getAllProviders() {
    const providers = [];
    
    // Check for Phantom specifically
    if (window.phantom?.solana) {
      const walletInfo = this._getWalletInfo(window.phantom.solana);
      if (walletInfo) {
        providers.push(walletInfo);
      }
    }
    
    // Check for Solflare
    if (window.solflare) {
      const walletInfo = this._getWalletInfo(window.solflare);
      if (walletInfo) {
        providers.push(walletInfo);
      }
    }
    
    // Check for Glow
    if (window.glow) {
      const walletInfo = this._getWalletInfo(window.glow);
      if (walletInfo) {
        providers.push(walletInfo);
      }
    }
    
    // Check for Backpack
    if (window.backpack) {
      const walletInfo = this._getWalletInfo(window.backpack);
      if (walletInfo) {
        providers.push(walletInfo);
      }
    }
    
    // Check for Coin98
    if (window.coin98?.sol) {
      const walletInfo = this._getWalletInfo(window.coin98.sol);
      if (walletInfo) {
        providers.push(walletInfo);
      }
    }
    
    // Check window.solana (fallback for other wallets)
    if (window.solana && !providers.some(p => p.provider === window.solana)) {
      if (Array.isArray(window.solana.providers)) {
        window.solana.providers.forEach(provider => {
          const walletInfo = this._getWalletInfo(provider);
          if (walletInfo && !providers.some(p => p.provider === provider)) {
            providers.push(walletInfo);
          }
        });
      } else {
        const walletInfo = this._getWalletInfo(window.solana);
        if (walletInfo && !providers.some(p => p.provider === window.solana)) {
          providers.push(walletInfo);
        }
      }
    }
    
    if (ENV.DEBUG_MODE) {
      console.log('🔍 Found wallet providers:', providers.map(p => p.name));
    }
    
    return providers;
  }

  /**
   * Wait for wallets to load
   */
  async waitForWallets(timeout = 3000) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let lastProviderCount = 0;
      
      const checkInterval = setInterval(() => {
        const providers = this.getAllProviders();
        const elapsed = Date.now() - startTime;
        
        // If we found providers or timeout reached
        if (providers.length > 0 || elapsed >= timeout) {
          clearInterval(checkInterval);
          resolve(providers);
          return;
        }
        
        // If provider count changed, reset timer a bit to allow more wallets to load
        if (providers.length > lastProviderCount) {
          lastProviderCount = providers.length;
        }
      }, 100);
      
      // Also listen for wallet events
      const handleWalletEvent = () => {
        const providers = this.getAllProviders();
        if (providers.length > 0) {
          clearInterval(checkInterval);
          resolve(providers);
        }
      };
      
      window.addEventListener('solana#initialized', handleWalletEvent);
      window.addEventListener('phantom#initialized', handleWalletEvent);
      
      // Cleanup listeners after timeout
      setTimeout(() => {
        window.removeEventListener('solana#initialized', handleWalletEvent);
        window.removeEventListener('phantom#initialized', handleWalletEvent);
      }, timeout);
    });
  }

  /**
   * Connect to a specific wallet provider
   */
  async connect(provider, options = {}) {
    if (this.isConnecting) {
      throw new Error('Connection already in progress');
    }

    try {
      this.isConnecting = true;
      
      if (ENV.DEBUG_MODE) {
        console.log('🔗 Connecting to wallet...', options.silent ? '(silent)' : '');
      }

      const connectOptions = options.silent ? { onlyIfTrusted: true } : {};
      const response = await provider.connect(connectOptions);
      
      if (!response || !response.publicKey) {
        throw new Error('Wallet connection was cancelled or failed');
      }

      const publicKey = response.publicKey.toString();
      
      this.connectedWallet = {
        provider,
        publicKey,
        name: this._getWalletInfo(provider)?.name || 'Unknown'
      };

      // Set up disconnect handler
      if (provider.on) {
        provider.on('disconnect', () => {
          this._handleDisconnect();
        });
      }

      if (ENV.DEBUG_MODE) {
        console.log('✅ Wallet connected:', this.connectedWallet.name, publicKey, options.silent ? '(silent)' : '');
      }

      this._emit('connect', this.connectedWallet);
      
      return this.connectedWallet;
    } catch (error) {
      if (ENV.DEBUG_MODE) {
        console.error('❌ Wallet connection failed:', error, options.silent ? '(silent)' : '');
      }
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Try to auto-connect to a previously connected wallet silently
   */
  async tryAutoConnect() {
    if (this.isConnecting || this.connectedWallet) {
      return this.connectedWallet;
    }

    try {
      if (ENV.DEBUG_MODE) {
        console.log('🔄 Attempting silent wallet reconnection...');
      }

      const providers = this.getAllProviders();
      
      for (const walletInfo of providers) {
        try {
          // Try to connect silently (only if previously trusted)
          const wallet = await this.connect(walletInfo.provider, { silent: true });
          
          if (ENV.DEBUG_MODE) {
            console.log('✅ Silent reconnection successful:', wallet.name);
          }
          
          return wallet;
        } catch (error) {
          // Silent connection failed for this wallet, try next one
          if (ENV.DEBUG_MODE) {
            console.log('⚠️ Silent connection failed for', walletInfo.name, '- trying next wallet');
          }
          continue;
        }
      }
      
      if (ENV.DEBUG_MODE) {
        console.log('❌ No wallet could be silently reconnected');
      }
      
      return null;
    } catch (error) {
      if (ENV.DEBUG_MODE) {
        console.error('❌ Auto-connect failed:', error);
      }
      return null;
    }
  }

  /**
   * Disconnect from current wallet
   */
  async disconnect() {
    if (this.connectedWallet?.provider) {
      try {
        if (this.connectedWallet.provider.disconnect) {
          await this.connectedWallet.provider.disconnect();
        }
      } catch (error) {
        console.warn('Error during wallet disconnect:', error);
      }
    }
    this._handleDisconnect();
  }

  /**
   * Sign a message with the connected wallet - improved version
   */
  async signMessage(message) {
    if (!this.connectedWallet?.provider) {
      throw new Error('No wallet connected');
    }

    if (!this.connectedWallet.provider.signMessage) {
      throw new Error('Wallet does not support message signing');
    }

    try {
      if (ENV.DEBUG_MODE) {
        console.log('🔏 Signing message with wallet:', this.connectedWallet.name);
        console.log('🔏 Message type:', typeof message, 'length:', message?.length);
      }

      // Ensure message is Uint8Array
      let messageToSign = message;
      if (typeof message === 'string') {
        messageToSign = new TextEncoder().encode(message);
      } else if (!(message instanceof Uint8Array)) {
        messageToSign = new Uint8Array(message);
      }

      if (ENV.DEBUG_MODE) {
        console.log('🔏 Message to sign length:', messageToSign.length);
      }

      const signature = await this.connectedWallet.provider.signMessage(messageToSign);
      
      if (ENV.DEBUG_MODE) {
        console.log('✅ Message signed successfully');
        console.log('🔏 Signature type:', typeof signature);
        console.log('🔏 Signature:', signature);
      }
      
      return signature;
    } catch (error) {
      if (ENV.DEBUG_MODE) {
        console.error('❌ Message signing failed:', error);
      }
      
      // Provide more specific error messages
      if (error.message?.includes('User rejected')) {
        throw new Error('User rejected the signature request');
      } else if (error.message?.includes('not supported')) {
        throw new Error('This wallet does not support message signing');
      } else {
        throw new Error(`Signature failed: ${error.message || 'Unknown error'}`);
      }
    }
  }

  /**
   * Sign a transaction with the connected wallet
   */
  async signTransaction(transaction) {
    if (!this.connectedWallet?.provider) {
      throw new Error('No wallet connected');
    }

    if (!this.connectedWallet.provider.signTransaction) {
      throw new Error('Wallet does not support transaction signing');
    }

    try {
      if (ENV.DEBUG_MODE) {
        console.log('🔏 Signing transaction with wallet:', this.connectedWallet.name);
      }

      const signedTransaction = await this.connectedWallet.provider.signTransaction(transaction);
      
      if (ENV.DEBUG_MODE) {
        console.log('✅ Transaction signed successfully');
      }
      
      return signedTransaction;
    } catch (error) {
      if (ENV.DEBUG_MODE) {
        console.error('❌ Transaction signing failed:', error);
      }
      
      // Provide more specific error messages
      if (error.message?.includes('User rejected')) {
        throw new Error('User rejected the transaction');
      } else {
        throw new Error(`Transaction signing failed: ${error.message || 'Unknown error'}`);
      }
    }
  }

  /**
   * Get current connected wallet info
   */
  getConnectedWallet() {
    return this.connectedWallet;
  }

  /**
   * Check if wallet is connected
   */
  isConnected() {
    return !!this.connectedWallet;
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
   * Private: Get wallet information from provider
   */
  _getWalletInfo(provider) {
    if (!provider) return null;

    let name = 'Unknown Wallet';
    let icon = null;

    // Detect wallet type
    if (provider.isPhantom || provider._phantom || window.phantom?.solana === provider) {
      name = 'Phantom';
      icon = 'https://phantom.app/img/phantom-logo.png';
    } else if (provider.isSolflare) {
      name = 'Solflare';
      icon = 'https://solflare.com/img/logo.svg';
    } else if (provider.isGlow) {
      name = 'Glow';
      icon = 'https://glow.app/img/logo.svg';
    } else if (provider.isTorus) {
      name = 'Torus';
      icon = 'https://tor.us/images/torus-logo-blue.svg';
    } else if (provider.isBackpack) {
      name = 'Backpack';
      icon = 'https://backpack.app/logo192.png';
    } else if (provider.isCoin98) {
      name = 'Coin98';
      icon = 'https://coin98.com/images/coin98-logo.png';
    } else if (provider.isMathWallet) {
      name = 'MathWallet';
      icon = 'https://mathwallet.org/images/logo.png';
    } else if (provider.isSollet) {
      name = 'Sollet';
      icon = 'https://www.sollet.io/logo192.png';
    } else if (provider.isExodus) {
      name = 'Exodus';
      icon = 'https://www.exodus.com/img/logo/exodus-logo.svg';
    } else if (provider.isSlope) {
      name = 'Slope';
      icon = 'https://slope.finance/img/logo.svg';
    }

    return { name, provider, icon };
  }

  /**
   * Private: Handle wallet disconnect
   */
  _handleDisconnect() {
    const wasConnected = !!this.connectedWallet;
    this.connectedWallet = null;
    
    if (wasConnected) {
      if (ENV.DEBUG_MODE) {
        console.log('🔌 Wallet disconnected');
      }
      this._emit('disconnect');
    }
  }

  /**
   * Private: Emit event to listeners
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
}

// Create singleton instance
const walletService = new WalletService();

export default walletService;