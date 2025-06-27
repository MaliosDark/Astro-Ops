-- migrations.sql

-- 1) Users (stores wallet public keys)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  public_key VARCHAR(64) NOT NULL UNIQUE,
  username VARCHAR(50) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  total_login_time INT DEFAULT 0,
  is_online BOOLEAN DEFAULT FALSE,
  INDEX idx_public_key (public_key),
  INDEX idx_last_active (last_active),
  INDEX idx_online (is_online)
);

-- 2) Nonces (for login challenges)
CREATE TABLE IF NOT EXISTS nonces (
  public_key VARCHAR(64) NOT NULL PRIMARY KEY,
  nonce CHAR(32) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3) Ships (enhanced with combat stats)
CREATE TABLE IF NOT EXISTS ships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  level TINYINT NOT NULL DEFAULT 1,
  experience INT DEFAULT 0,
  last_mission_ts INT NOT NULL DEFAULT 0,
  last_raid_ts INT DEFAULT 0,
  br_balance BIGINT NOT NULL DEFAULT 0,
  
  -- Combat stats for raid calculations
  attack_power INT DEFAULT 100,
  defense_power INT DEFAULT 100,
  speed INT DEFAULT 100,
  
  -- Ship status
  is_in_mission BOOLEAN DEFAULT FALSE,
  is_in_raid BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id),
  INDEX idx_user_id (user_id),
  INDEX idx_level (level),
  INDEX idx_in_mission (is_in_mission)
);

-- 4) Missions (enhanced for raid pool)
CREATE TABLE IF NOT EXISTS missions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ship_id INT NOT NULL,
  user_id INT NOT NULL,
  mission_type ENUM('MiningRun','BlackMarket','ArtifactHunt') NOT NULL,
  mode ENUM('Shielded','Unshielded') NOT NULL,
  
  -- Mission details
  difficulty_level INT DEFAULT 1,
  base_reward INT NOT NULL,
  actual_reward INT DEFAULT 0,
  
  -- Timing
  ts_start INT NOT NULL,
  ts_complete INT DEFAULT NULL,
  duration_seconds INT DEFAULT 28800, -- 8 hours
  success TINYINT NOT NULL,
  claimed TINYINT NOT NULL DEFAULT 0,
  
  -- Raid status
  raided TINYINT NOT NULL DEFAULT 0,
  raided_by INT NULL,
  ts_raid INT NULL,
  raid_damage INT DEFAULT 0,
  
  -- Pool visibility
  is_visible_to_raids BOOLEAN DEFAULT TRUE,
  times_scanned INT DEFAULT 0,
  
  FOREIGN KEY(ship_id) REFERENCES ships(id),
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(raided_by) REFERENCES users(id),
  INDEX idx_user_id (user_id),
  INDEX idx_raided (raided),
  INDEX idx_mode (mode),
  INDEX idx_visible_raids (is_visible_to_raids),
  INDEX idx_ts_start (ts_start)
);

-- 5) Player stats for matchmaking
CREATE TABLE IF NOT EXISTS player_stats (
  user_id INT PRIMARY KEY,
  
  -- Combat stats
  total_kills INT DEFAULT 0,
  total_deaths INT DEFAULT 0,
  battles_won INT DEFAULT 0,
  battles_lost INT DEFAULT 0,
  
  -- Raid stats
  raids_initiated INT DEFAULT 0,
  raids_successful INT DEFAULT 0,
  raids_defended INT DEFAULT 0,
  raids_lost_defense INT DEFAULT 0,
  
  -- Mission stats
  missions_completed INT DEFAULT 0,
  missions_failed INT DEFAULT 0,
  total_br_earned BIGINT DEFAULT 0,
  
  -- Rating system (ELO-like)
  combat_rating INT DEFAULT 1000,
  raid_rating INT DEFAULT 1000,
  overall_rating INT DEFAULT 1000,
  
  -- Streaks and achievements
  current_win_streak INT DEFAULT 0,
  max_win_streak INT DEFAULT 0,
  
  -- Last activity
  last_battle TIMESTAMP NULL,
  last_raid TIMESTAMP NULL,
  last_mission TIMESTAMP NULL,
  
  FOREIGN KEY(user_id) REFERENCES users(id),
  INDEX idx_overall_rating (overall_rating),
  INDEX idx_raid_rating (raid_rating)
);

-- 6) Raid pool for matchmaking
CREATE TABLE IF NOT EXISTS raid_pool (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mission_id INT NOT NULL,
  user_id INT NOT NULL,
  
  -- Pool entry details
  entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  estimated_completion TIMESTAMP NOT NULL,
  loot_value INT NOT NULL,
  difficulty_score INT NOT NULL,
  
  -- Matchmaking factors
  player_rating INT NOT NULL,
  ship_level INT NOT NULL,
  risk_factor DECIMAL(3,2) NOT NULL,
  
  -- Targeting data
  is_active BOOLEAN DEFAULT TRUE,
  times_targeted INT DEFAULT 0,
  last_scan_time TIMESTAMP NULL,
  
  FOREIGN KEY(mission_id) REFERENCES missions(id) ON DELETE CASCADE,
  FOREIGN KEY(user_id) REFERENCES users(id),
  INDEX idx_active (is_active),
  INDEX idx_difficulty (difficulty_score),
  INDEX idx_loot_value (loot_value),
  INDEX idx_player_rating (player_rating),
  INDEX idx_completion (estimated_completion)
);

-- 7) Raid history for analytics
CREATE TABLE IF NOT EXISTS raid_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  attacker_id INT NOT NULL,
  defender_id INT NOT NULL,
  mission_id INT NOT NULL,
  
  -- Raid details
  raid_type ENUM('Quick','Stealth','Assault') DEFAULT 'Quick',
  success BOOLEAN NOT NULL,
  loot_stolen INT DEFAULT 0,
  damage_dealt INT DEFAULT 0,
  damage_received INT DEFAULT 0,
  
  -- Battle results
  battle_duration INT DEFAULT 0,
  attacker_rating_before INT NOT NULL,
  attacker_rating_after INT NOT NULL,
  defender_rating_before INT NOT NULL,
  defender_rating_after INT NOT NULL,
  
  raid_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY(attacker_id) REFERENCES users(id),
  FOREIGN KEY(defender_id) REFERENCES users(id),
  FOREIGN KEY(mission_id) REFERENCES missions(id),
  INDEX idx_attacker (attacker_id),
  INDEX idx_defender (defender_id),
  INDEX idx_success (success)
);

-- 8) API Logs (for simple rate-limiting)
CREATE TABLE IF NOT EXISTS api_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ip VARCHAR(45) NOT NULL,
  endpoint VARCHAR(64) NOT NULL,
  ts INT NOT NULL,
  user_id INT DEFAULT NULL,
  INDEX idx_ip_ts (ip, ts)
);

-- 9) Energy (por usuario)
CREATE TABLE IF NOT EXISTS energy (
  user_id INT NOT NULL PRIMARY KEY,
  energy INT NOT NULL DEFAULT 10,
  max_energy INT DEFAULT 10,
  last_refill INT NOT NULL DEFAULT 0,
  energy_spent_today INT DEFAULT 0,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- 10) Reputation (para penalizaciones)
CREATE TABLE IF NOT EXISTS reputation (
  user_id INT NOT NULL PRIMARY KEY,
  rep INT NOT NULL DEFAULT 100,
  honor_points INT DEFAULT 0,
  infamy_points INT DEFAULT 0,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- 11) Game events and notifications
CREATE TABLE IF NOT EXISTS game_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  event_type ENUM('raid_incoming','raid_completed','mission_complete','level_up') NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  related_user_id INT DEFAULT NULL,
  related_mission_id INT DEFAULT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(related_user_id) REFERENCES users(id),
  FOREIGN KEY(related_mission_id) REFERENCES missions(id),
  INDEX idx_user_unread (user_id, is_read)
);