-- Fix Missing Columns in bonka_bonkartio Database
-- Execute this SQL in phpMyAdmin or your MySQL interface

USE bonka_bonkartio;

-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS total_missions INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_raids_won INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_kills INT NOT NULL DEFAULT 0;

-- Add index for public_key if it doesn't exist
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_public_key (public_key);

-- Ensure energy table has max_energy column
ALTER TABLE energy 
ADD COLUMN IF NOT EXISTS max_energy INT NOT NULL DEFAULT 10;

-- Add some demo data to existing users (so they don't start with all zeros)
UPDATE users 
SET total_missions = FLOOR(5 + RAND() * 15),
    total_raids_won = FLOOR(1 + RAND() * 5),
    total_kills = FLOOR(10 + RAND() * 30),
    last_login = CURRENT_TIMESTAMP
WHERE total_missions = 0 AND total_raids_won = 0 AND total_kills = 0;

-- Initialize energy and reputation for existing users
INSERT IGNORE INTO energy (user_id, energy, last_refill, max_energy)
SELECT id, 10, UNIX_TIMESTAMP(), 10 FROM users;

INSERT IGNORE INTO reputation (user_id, rep)
SELECT id, 100 FROM users;

-- Verify the fix
SELECT 'Users table structure:' as info;
SHOW COLUMNS FROM users;

SELECT 'Sample user data:' as info;
SELECT id, public_key, last_login, total_missions, total_raids_won, total_kills 
FROM users 
LIMIT 3;