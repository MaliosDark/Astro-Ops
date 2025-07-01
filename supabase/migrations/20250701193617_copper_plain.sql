/*
  # Add claim transaction history support
  
  This migration documents the API changes needed to support claim transaction history.
  No schema changes are required as the token_transactions table already exists.
  
  API Changes:
  - The withdraw_tokens endpoint now accepts a tx_type parameter
  - When tx_type is 'claim', it records the transaction as a claim in the history
  - This allows the frontend to distinguish between claims and withdrawals
  
  Frontend Changes:
  - ClaimModal now uses the withdrawTokens API with tx_type='claim'
  - WalletBalanceModal displays both claim and withdraw transactions
  - Transaction history shows the correct icon and color for each type
*/

-- No schema changes needed