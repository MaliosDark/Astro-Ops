/*
  # Add ship purchase options

  1. Changes
    - Add support for purchasing ships with either SOL or BR tokens
    - Add transaction tracking for ship purchases
    - Add payment_method column to ships table
  
  2. Security
    - No security changes needed
*/

-- Add payment_method column to ships table
ALTER TABLE ships 
ADD COLUMN payment_method ENUM('sol', 'br', 'test') NOT NULL DEFAULT 'sol',
ADD COLUMN purchase_tx_hash VARCHAR(128) NULL;

-- Add index for transaction hash lookups
CREATE INDEX idx_purchase_tx_hash ON ships(purchase_tx_hash);

-- Add ship_purchase type to token_transactions table if not already present
-- This is done using a safe procedure that checks if the value exists first
DELIMITER //
CREATE PROCEDURE add_ship_purchase_type_if_not_exists()
BEGIN
    -- Check if 'ship_purchase' exists in the ENUM
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.COLUMNS 
        WHERE 
            TABLE_SCHEMA = DATABASE() AND 
            TABLE_NAME = 'token_transactions' AND 
            COLUMN_NAME = 'tx_type' AND 
            COLUMN_TYPE LIKE '%ship_purchase%'
    ) THEN
        -- Add 'ship_purchase' to the ENUM
        -- Note: This is MySQL-specific syntax
        ALTER TABLE token_transactions 
        MODIFY COLUMN tx_type ENUM('mission_reward','raid_reward','claim','withdraw','upgrade_cost','burn','ship_purchase') NOT NULL;
    END IF;
END //
DELIMITER ;

-- Run the procedure
CALL add_ship_purchase_type_if_not_exists();

-- Drop the procedure
DROP PROCEDURE IF EXISTS add_ship_purchase_type_if_not_exists;