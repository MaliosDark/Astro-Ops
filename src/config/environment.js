// src/config/environment.js
// Centralized environment configuration

const ENV = {
  // API Configuration - Use environment variables with production fallbacks
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://api.bonkraiders.com', // Now Node.js server
  VERIFY_API_URL: import.meta.env.VITE_VERIFY_API_URL || 'https://api.bonkraiders.com', // Same server for verification
  
  // WebSocket Configuration - Derived from API_BASE_URL
  get WEBSOCKET_URL() {
    const apiUrl = this.API_BASE_URL;
    // Convert HTTP(S) to WS(S) protocol
    const wsProtocol = apiUrl.startsWith('https://') ? 'wss://' : 'ws://';
    // Extract hostname and port from API URL
    const urlParts = apiUrl.replace(/^https?:\/\//, '');
    return `${wsProtocol}${urlParts}/ws`;
  },
  
  // Solana Configuration
  SOLANA_RPC_URL: import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  SOLANA_NETWORK: import.meta.env.VITE_SOLANA_NETWORK || 'devnet',
  
  // Game Token Configuration
  GAME_TOKEN_MINT: import.meta.env.VITE_GAME_TOKEN_MINT || 'CCmGDrD9jZarDEz1vrjKcE9rrJjL8VecDYjAWxhwhGPo', 
  PARTICIPATION_FEE: parseInt(import.meta.env.VITE_PARTICIPATION_FEE) || 250, // Default to 250 as per server
  
  // Ship Purchase (in SOL equivalent to 15 USDC)
  SHIP_PRICE_SOL: parseFloat(import.meta.env.VITE_SHIP_PRICE_SOL) || 0.01,
  
  // Asset URLs
  ASSETS_BASE_URL: import.meta.env.VITE_ASSETS_BASE_URL || 'https://bonkraiders.com/assets',
  
  // Development Settings
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true' || import.meta.env.DEV,
  MOCK_API: import.meta.env.VITE_MOCK_API === 'true',
  
  // Security
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // Derived values
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD
};

// Validation
if (ENV.DEBUG_MODE) {
  console.log('🔧 Environment Configuration:', ENV);
}

export default ENV;