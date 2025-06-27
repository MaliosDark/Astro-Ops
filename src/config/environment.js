// src/config/environment.js
// Centralized environment configuration

export const ENV = {
  // API Configuration - NEVER use localhost
  API_BASE_URL: 'https://api.bonkraiders.com',
  VERIFY_API_URL: 'https://verify.bonkraiders.com',
  
  // Solana Configuration
  SOLANA_RPC_URL: 'https://api.devnet.solana.com',
  SOLANA_NETWORK: 'devnet',
  
  // Game Token Configuration
  GAME_TOKEN_MINT: 'CCmGDrD9jZarDEz1vrjKcE9rrJjL8VecDYjAWxhwhGPo',
  PARTICIPATION_FEE: 0,
  
  // Ship Purchase (in SOL equivalent to 15 USDC)
  SHIP_PRICE_SOL: 0.01, // Reduced for devnet
  
  // Asset URLs
  ASSETS_BASE_URL: 'https://bonkraiders.com/assets',
  
  // Development Settings
  DEBUG_MODE: true, // Keep debug on for now
  MOCK_API: false,
  
  // Security
  APP_VERSION: '1.0.0',
  
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