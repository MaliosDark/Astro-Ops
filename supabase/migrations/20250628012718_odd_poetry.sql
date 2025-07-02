-- Fix missing columns in existing database
-- Run this SQL script in your cPanel phpMyAdmin or MySQL interface

-- First, let's check if we're using the right database
USE bonka_bonkartio;

-- Add missing columns to users table if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS total_missions INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_raids_won INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_kills INT NOT NULL DEFAULT 0;

-- Add index for public_key if it doesn't exist
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_public_key (public_key);

-- Check if energy table has max_energy column, add if missing
ALTER TABLE energy 
ADD COLUMN IF NOT EXISTS max_energy INT NOT NULL DEFAULT 10;

-- Create any missing tables that might not exist

-- Nonces table
CREATE TABLE IF NOT EXISTS nonces (
  public_key VARCHAR(64) NOT NULL PRIMARY KEY,
  nonce CHAR(32) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ships table
CREATE TABLE IF NOT EXISTS ships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  level TINYINT NOT NULL DEFAULT 1,
  last_mission_ts INT NOT NULL DEFAULT 0,
  br_balance BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active TINYINT NOT NULL DEFAULT 1,
  INDEX idx_user_id (user_id),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Missions table
CREATE TABLE IF NOT EXISTS missions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ship_id INT NOT NULL,
  user_id INT NOT NULL,
  mission_type ENUM('MiningRun','BlackMarket','ArtifactHunt') NOT NULL,
  mode ENUM('Shielded','Unshielded') NOT NULL,
  ts_start INT NOT NULL,
  ts_complete INT NULL,
  success TINYINT NOT NULL,
  reward BIGINT NOT NULL,
  raided TINYINT NOT NULL DEFAULT 0,
  raided_by INT NULL,
  ts_raid INT NULL,
  claimed TINYINT NOT NULL DEFAULT 0,
  INDEX idx_user_id (user_id),
  INDEX idx_ship_id (ship_id),
  INDEX idx_ts_start (ts_start),
  INDEX idx_raided (raided),
  INDEX idx_mission_type (mission_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- API Logs table
CREATE TABLE IF NOT EXISTS api_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ip VARCHAR(45) NOT NULL,
  endpoint VARCHAR(64) NOT NULL,
  ts INT NOT NULL,
  INDEX idx_ip_ts (ip, ts),
  INDEX idx_ts (ts)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Energy table
CREATE TABLE IF NOT EXISTS energy (
  user_id INT NOT NULL PRIMARY KEY,
  energy INT NOT NULL DEFAULT 10,
  last_refill INT NOT NULL DEFAULT 0,
  max_energy INT NOT NULL DEFAULT 10
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reputation table
CREATE TABLE IF NOT EXISTS reputation (
  user_id INT NOT NULL PRIMARY KEY,
  rep INT NOT NULL DEFAULT 100
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Settings table
CREATE TABLE IF NOT EXISTS user_settings (
  user_id INT NOT NULL,
  setting_key VARCHAR(50) NOT NULL,
  setting_value VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, setting_key),
  INDEX idx_user_setting (user_id, setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Cache table
CREATE TABLE IF NOT EXISTS user_cache (
  user_id INT NOT NULL,
  cache_key VARCHAR(50) NOT NULL,
  cache_value TEXT,
  expires_at INT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, cache_key),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  achievement_type VARCHAR(50) NOT NULL,
  achievement_value INT NOT NULL DEFAULT 1,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_achievement (user_id, achievement_type),
  INDEX idx_user_achievements (user_id),
  INDEX idx_achievement_type (achievement_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash VARCHAR(64) NOT NULL,
  expires_at INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_token_hash (token_hash),
  INDEX idx_expires (expires_at),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initialize data for existing users
INSERT IGNORE INTO energy (user_id, energy, last_refill, max_energy)
SELECT id, 10, UNIX_TIMESTAMP(), 10 FROM users;

INSERT IGNORE INTO reputation (user_id, rep)
SELECT id, 100 FROM users;

-- Add some demo stats to existing users that have zero stats
UPDATE users 
SET total_missions = FLOOR(5 + RAND() * 15),
    total_raids_won = FLOOR(1 + RAND() * 5),
    total_kills = FLOOR(10 + RAND() * 30)
WHERE total_missions = 0 AND total_raids_won = 0 AND total_kills = 0;