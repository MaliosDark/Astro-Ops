/*
  # Add test tokens endpoint and payment options for ship purchase
  
  1. New Features
    - Add endpoint for distributing test tokens in devnet/testnet
    - Add support for purchasing ships with BR tokens
    - Add transaction recording for test token distribution
  
  2. API Changes
    - New endpoint: /get_test_tokens
      - Accepts amount parameter
      - Creates a mint transaction to user's wallet
      - Records transaction in token_transactions table
    
    - Updated endpoint: /buy_ship
      - Now accepts payment_method parameter ('sol' or 'br')
      - When using 'br', deducts tokens from user's in-game balance
      - Records transaction in token_transactions table
  
  3. Security
    - Test token distribution only available in non-mainnet environments
    - Rate limiting applied to prevent abuse
    - Maximum test token amount enforced
*/

-- No schema changes needed, just API implementation changes
-- This migration is for documentation purposes only