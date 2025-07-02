-- COMPLETE DATABASE RESET
-- Use this if you want to start completely fresh
-- WARNING: This will delete ALL existing data!

USE bonka_bonkartio;

-- Drop all tables (in correct order to avoid foreign key issues)
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS achievements;
DROP TABLE IF EXISTS user_cache;
DROP TABLE IF EXISTS user_settings;
DROP TABLE IF EXISTS reputation;
DROP TABLE IF EXISTS energy;
DROP TABLE IF EXISTS api_logs;
DROP TABLE IF EXISTS missions;
DROP TABLE IF EXISTS ships;
DROP TABLE IF EXISTS nonces;
DROP TABLE IF EXISTS users;

-- Recreate all tables from scratch
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  public_key VARCHAR(64) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_missions INT NOT NULL DEFAULT 0,
  total_raids_won INT NOT NULL DEFAULT 0,
  total_kills INT NOT NULL DEFAULT 0,
  INDEX idx_public_key (public_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE nonces (
  public_key VARCHAR(64) NOT NULL PRIMARY KEY,
  nonce CHAR(32) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ships (
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

CREATE TABLE missions (
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

CREATE TABLE api_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ip VARCHAR(45) NOT NULL,
  endpoint VARCHAR(64) NOT NULL,
  ts INT NOT NULL,
  INDEX idx_ip_ts (ip, ts),
  INDEX idx_ts (ts)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE energy (
  user_id INT NOT NULL PRIMARY KEY,
  energy INT NOT NULL DEFAULT 10,
  last_refill INT NOT NULL DEFAULT 0,
  max_energy INT NOT NULL DEFAULT 10
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reputation (
  user_id INT NOT NULL PRIMARY KEY,
  rep INT NOT NULL DEFAULT 100
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_settings (
  user_id INT NOT NULL,
  setting_key VARCHAR(50) NOT NULL,
  setting_value VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, setting_key),
  INDEX idx_user_setting (user_id, setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_cache (
  user_id INT NOT NULL,
  cache_key VARCHAR(50) NOT NULL,
  cache_value TEXT,
  expires_at INT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, cache_key),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE achievements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  achievement_type VARCHAR(50) NOT NULL,
  achievement_value INT NOT NULL DEFAULT 1,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_achievement (user_id, achievement_type),
  INDEX idx_user_achievements (user_id),
  INDEX idx_achievement_type (achievement_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_sessions (
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