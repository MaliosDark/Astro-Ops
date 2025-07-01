/*
  # Add tx_type parameter to withdraw_tokens endpoint

  1. Changes
    - Add tx_type parameter to withdraw_tokens API endpoint
    - Allow specifying 'claim' or 'withdraw' transaction types
    - Update token_transactions table to record the correct transaction type
    - Ensure transaction history shows both claims and withdrawals properly
*/

-- No schema changes needed, just API implementation changes
-- This migration is for documentation purposes only