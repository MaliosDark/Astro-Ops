-- migrations.sql - Compatible with MariaDB/MySQL

-- 1) Users (stores wallet public keys + basic stats)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  public_key VARCHAR(64) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_missions INT NOT NULL DEFAULT 0,
  total_raids_won INT NOT NULL DEFAULT 0,
  total_kills INT NOT NULL DEFAULT 0,
  INDEX idx_public_key (public_key)
);

-- 2) Nonces (for login challenges)
CREATE TABLE IF NOT EXISTS nonces (
  public_key VARCHAR(64) NOT NULL PRIMARY KEY,
  nonce CHAR(32) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3) Ships (with purchase tracking)
CREATE TABLE IF NOT EXISTS ships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  level TINYINT NOT NULL DEFAULT 1,
  last_mission_ts INT NOT NULL DEFAULT 0,
  br_balance BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active TINYINT NOT NULL DEFAULT 1,
  FOREIGN KEY(user_id) REFERENCES users(id),
  INDEX idx_user_id (user_id),
  INDEX idx_is_active (is_active)
);

-- 4) Missions (with completion tracking)
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
  FOREIGN KEY(ship_id) REFERENCES ships(id),
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(raided_by) REFERENCES users(id),
  INDEX idx_user_id (user_id),
  INDEX idx_ts_start (ts_start),
  INDEX idx_raided (raided),
  INDEX idx_mission_type (mission_type)
);

-- 5) API Logs (for rate-limiting)
CREATE TABLE IF NOT EXISTS api_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ip VARCHAR(45) NOT NULL,
  endpoint VARCHAR(64) NOT NULL,
  ts INT NOT NULL,
  INDEX idx_ip_ts (ip, ts),
  INDEX idx_ts (ts)
);

-- 6) Energy (per user with max energy for upgrades)
CREATE TABLE IF NOT EXISTS energy (
  user_id INT NOT NULL PRIMARY KEY,
  energy INT NOT NULL DEFAULT 10,
  last_refill INT NOT NULL DEFAULT 0,
  max_energy INT NOT NULL DEFAULT 10,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Add max_energy column if it doesn't exist (for existing energy tables)
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'energy' 
   AND COLUMN_NAME = 'max_energy') = 0,
  'ALTER TABLE energy ADD COLUMN max_energy INT NOT NULL DEFAULT 10',
  'SELECT "max_energy column already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 7) Reputation (for penalties)
CREATE TABLE IF NOT EXISTS reputation (
  user_id INT NOT NULL PRIMARY KEY,
  rep INT NOT NULL DEFAULT 100,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- 8) User Settings (simple key-value for user preferences)
CREATE TABLE IF NOT EXISTS user_settings (
  user_id INT NOT NULL,
  setting_key VARCHAR(50) NOT NULL,
  setting_value VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, setting_key),
  FOREIGN KEY(user_id) REFERENCES users(id),
  INDEX idx_user_setting (user_id, setting_key)
);

-- 9) User Cache (simple key-value for frequently changing data)
CREATE TABLE IF NOT EXISTS user_cache (
  user_id INT NOT NULL,
  cache_key VARCHAR(50) NOT NULL,
  cache_value TEXT,
  expires_at INT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, cache_key),
  FOREIGN KEY(user_id) REFERENCES users(id),
  INDEX idx_expires (expires_at)
);

-- 10) Achievements (simple achievement tracking)
CREATE TABLE IF NOT EXISTS achievements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  achievement_type VARCHAR(50) NOT NULL,
  achievement_value INT NOT NULL DEFAULT 1,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id),
  UNIQUE KEY unique_user_achievement (user_id, achievement_type),
  INDEX idx_user_achievements (user_id),
  INDEX idx_achievement_type (achievement_type)
);

-- 11) Session Tokens (for JWT persistence)
CREATE TABLE IF NOT EXISTS user_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash VARCHAR(64) NOT NULL,
  expires_at INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id),
  INDEX idx_token_hash (token_hash),
  INDEX idx_expires (expires_at),
  INDEX idx_user_id (user_id)
);

-- Insert default settings for existing users
INSERT IGNORE INTO user_settings (user_id, setting_key, setting_value)
SELECT id, 'preferred_mode', 'Unshielded' FROM users;

INSERT IGNORE INTO user_settings (user_id, setting_key, setting_value)
SELECT id, 'auto_claim', '0' FROM users;

INSERT IGNORE INTO user_settings (user_id, setting_key, setting_value)
SELECT id, 'notifications', '1' FROM users;

-- Initialize energy for existing users (now safe to reference max_energy)
INSERT IGNORE INTO energy (user_id, energy, last_refill, max_energy)
SELECT id, 10, UNIX_TIMESTAMP(), 10 FROM users;

-- Initialize reputation for existing users
INSERT IGNORE INTO reputation (user_id, rep)
SELECT id, 100 FROM users;