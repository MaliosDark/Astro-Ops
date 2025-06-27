// src/config/environment.js
// Centralized environment configuration

export const ENV = {
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  VERIFY_API_URL: import.meta.env.VITE_VERIFY_API_URL || 'http://localhost:3070',
  
  // Solana Configuration
  SOLANA_RPC_URL: import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  SOLANA_NETWORK: import.meta.env.VITE_SOLANA_NETWORK || 'devnet',
  
  // Game Token Configuration
  GAME_TOKEN_MINT: import.meta.env.VITE_GAME_TOKEN_MINT || 'CCmGDrD9jZarDEz1vrjKcE9rrJjL8VecDYjAWxhwhGPo',
  PARTICIPATION_FEE: parseInt(import.meta.env.VITE_PARTICIPATION_FEE) || 0,
  
  // Ship Purchase (in SOL equivalent to 15 USDC)
  SHIP_PRICE_SOL: parseFloat(import.meta.env.VITE_SHIP_PRICE_SOL) || 0.01, // Reduced for devnet
  
  // Asset URLs
  ASSETS_BASE_URL: import.meta.env.VITE_ASSETS_BASE_URL || 'http://localhost:3000/assets',
  
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

// Validate required environment variables
const requiredVars = [
  'API_BASE_URL',
  'SOLANA_RPC_URL',
  'GAME_TOKEN_MINT'
];

const missingVars = requiredVars.filter(varName => !ENV[varName]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars);
  if (ENV.IS_PRODUCTION) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

export default ENV;