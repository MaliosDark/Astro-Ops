/*
  # Add transaction hash to missions table

  1. Changes
    - Add `tx_hash` column to missions table to track on-chain transactions
    - Add `claimed_tx_hash` column to missions table to track claim transactions
  
  2. Security
    - No security changes needed
*/

-- Add transaction hash columns to missions table
ALTER TABLE missions 
ADD COLUMN tx_hash VARCHAR(128) NULL,
ADD COLUMN claimed_tx_hash VARCHAR(128) NULL;

-- Add index for transaction hash lookups
CREATE INDEX idx_tx_hash ON missions(tx_hash);
CREATE INDEX idx_claimed_tx_hash ON missions(claimed_tx_hash);