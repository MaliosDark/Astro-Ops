-- Bonk Raiders Database Schema
-- Complete game data storage with raid pool system

-- Users table (basic player info)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  public_key VARCHAR(44) UNIQUE NOT NULL,
  username VARCHAR(50) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  total_login_time INT DEFAULT 0,
  is_online BOOLEAN DEFAULT FALSE,
  INDEX idx_public_key (public_key),
  INDEX idx_last_active (last_active),
  INDEX idx_online (is_online)
);

-- Player stats and rating system
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
  total_br_spent BIGINT DEFAULT 0,
  
  -- Rating system (ELO-like)
  combat_rating INT DEFAULT 1000,
  raid_rating INT DEFAULT 1000,
  overall_rating INT DEFAULT 1000,
  
  -- Achievements
  max_streak INT DEFAULT 0,
  current_streak INT DEFAULT 0,
  
  -- Timestamps
  last_battle TIMESTAMP NULL,
  last_raid TIMESTAMP NULL,
  last_mission TIMESTAMP NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_combat_rating (combat_rating),
  INDEX idx_raid_rating (raid_rating),
  INDEX idx_overall_rating (overall_rating)
);

-- Ships table (enhanced with more stats)
CREATE TABLE IF NOT EXISTS ships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  level INT DEFAULT 1,
  experience INT DEFAULT 0,
  br_balance BIGINT DEFAULT 0,
  
  -- Ship stats
  attack_power INT DEFAULT 100,
  defense_power INT DEFAULT 100,
  speed INT DEFAULT 100,
  
  -- Upgrade costs and bonuses
  upgrade_cost INT DEFAULT 50,
  reward_multiplier DECIMAL(3,2) DEFAULT 1.00,
  
  -- Cooldowns and status
  last_mission_ts INT DEFAULT 0,
  last_raid_ts INT DEFAULT 0,
  is_in_mission BOOLEAN DEFAULT FALSE,
  is_in_raid BOOLEAN DEFAULT FALSE,
  
  -- Ship customization
  ship_name VARCHAR(100) DEFAULT 'Unnamed Ship',
  ship_color VARCHAR(7) DEFAULT '#0066FF',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_level (level),
  INDEX idx_last_mission (last_mission_ts),
  INDEX idx_in_mission (is_in_mission),
  INDEX idx_in_raid (is_in_raid)
);

-- Enhanced missions table
CREATE TABLE IF NOT EXISTS missions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ship_id INT NOT NULL,
  user_id INT NOT NULL,
  mission_type ENUM('MiningRun', 'BlackMarket', 'ArtifactHunt') NOT NULL,
  mode ENUM('Shielded', 'Unshielded', 'Decoy') NOT NULL,
  
  -- Mission details
  difficulty_level INT DEFAULT 1,
  base_reward INT NOT NULL,
  actual_reward INT DEFAULT 0,
  bonus_multiplier DECIMAL(3,2) DEFAULT 1.00,
  
  -- Status and timing
  ts_start INT NOT NULL,
  ts_complete INT DEFAULT NULL,
  duration_seconds INT DEFAULT 28800, -- 8 hours default
  success BOOLEAN DEFAULT 0,
  claimed BOOLEAN DEFAULT 0,
  
  -- Raid status
  raided BOOLEAN DEFAULT 0,
  raided_by INT DEFAULT NULL,
  ts_raid INT DEFAULT NULL,
  raid_damage INT DEFAULT 0,
  
  -- Location and visibility
  sector_x INT DEFAULT 0,
  sector_y INT DEFAULT 0,
  is_visible_to_raids BOOLEAN DEFAULT TRUE,
  
  -- Risk assessment
  risk_level ENUM('Low', 'Medium', 'High', 'Extreme') DEFAULT 'Medium',
  estimated_loot INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (ship_id) REFERENCES ships(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (raided_by) REFERENCES users(id) ON DELETE SET NULL,
  
  INDEX idx_user_id (user_id),
  INDEX idx_mission_type (mission_type),
  INDEX idx_mode (mode),
  INDEX idx_raided (raided),
  INDEX idx_ts_start (ts_start),
  INDEX idx_success (success),
  INDEX idx_visible_raids (is_visible_to_raids),
  INDEX idx_risk_level (risk_level),
  INDEX idx_sector (sector_x, sector_y)
);

-- Raid pool and matchmaking
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
  
  -- Visibility and targeting
  is_active BOOLEAN DEFAULT TRUE,
  times_targeted INT DEFAULT 0,
  last_scan_time TIMESTAMP NULL,
  
  -- Geographic clustering
  sector_x INT DEFAULT 0,
  sector_y INT DEFAULT 0,
  
  FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  INDEX idx_mission_id (mission_id),
  INDEX idx_user_id (user_id),
  INDEX idx_active (is_active),
  INDEX idx_difficulty (difficulty_score),
  INDEX idx_loot_value (loot_value),
  INDEX idx_player_rating (player_rating),
  INDEX idx_sector (sector_x, sector_y),
  INDEX idx_completion (estimated_completion)
);

-- Raid history and analytics
CREATE TABLE IF NOT EXISTS raid_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  attacker_id INT NOT NULL,
  defender_id INT NOT NULL,
  mission_id INT NOT NULL,
  
  -- Raid details
  raid_type ENUM('Quick', 'Stealth', 'Assault') DEFAULT 'Quick',
  success BOOLEAN NOT NULL,
  loot_stolen INT DEFAULT 0,
  damage_dealt INT DEFAULT 0,
  damage_received INT DEFAULT 0,
  
  -- Battle simulation results
  battle_duration INT DEFAULT 0, -- seconds
  attacker_losses INT DEFAULT 0,
  defender_losses INT DEFAULT 0,
  
  -- Rating changes
  attacker_rating_before INT NOT NULL,
  attacker_rating_after INT NOT NULL,
  defender_rating_before INT NOT NULL,
  defender_rating_after INT NOT NULL,
  
  -- Timestamps
  raid_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  raid_end TIMESTAMP NULL,
  
  FOREIGN KEY (attacker_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (defender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
  
  INDEX idx_attacker (attacker_id),
  INDEX idx_defender (defender_id),
  INDEX idx_mission (mission_id),
  INDEX idx_success (success),
  INDEX idx_raid_start (raid_start)
);

-- Player energy system
CREATE TABLE IF NOT EXISTS energy (
  user_id INT PRIMARY KEY,
  energy INT DEFAULT 10,
  max_energy INT DEFAULT 10,
  last_refill INT NOT NULL,
  energy_spent_today INT DEFAULT 0,
  last_daily_reset DATE DEFAULT (CURRENT_DATE),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Reputation and social features
CREATE TABLE IF NOT EXISTS reputation (
  user_id INT PRIMARY KEY,
  rep INT DEFAULT 100,
  honor_points INT DEFAULT 0,
  infamy_points INT DEFAULT 0,
  
  -- Social stats
  allies_count INT DEFAULT 0,
  enemies_count INT DEFAULT 0,
  
  -- Behavioral tracking
  betrayals_committed INT DEFAULT 0,
  betrayals_suffered INT DEFAULT 0,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Alliance and guild system
CREATE TABLE IF NOT EXISTS alliances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  tag VARCHAR(10) NOT NULL,
  leader_id INT NOT NULL,
  description TEXT,
  
  -- Alliance stats
  total_members INT DEFAULT 1,
  total_rating INT DEFAULT 0,
  alliance_level INT DEFAULT 1,
  
  -- Settings
  is_recruiting BOOLEAN DEFAULT TRUE,
  min_rating_requirement INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_name (name),
  UNIQUE KEY unique_tag (tag)
);

CREATE TABLE IF NOT EXISTS alliance_members (
  alliance_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('Leader', 'Officer', 'Member') DEFAULT 'Member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  contribution_points INT DEFAULT 0,
  
  PRIMARY KEY (alliance_id, user_id),
  FOREIGN KEY (alliance_id) REFERENCES alliances(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Game events and notifications
CREATE TABLE IF NOT EXISTS game_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  event_type ENUM('raid_incoming', 'raid_completed', 'mission_complete', 'level_up', 'achievement') NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  
  -- Event data
  related_user_id INT DEFAULT NULL,
  related_mission_id INT DEFAULT NULL,
  reward_amount INT DEFAULT 0,
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (related_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (related_mission_id) REFERENCES missions(id) ON DELETE SET NULL,
  
  INDEX idx_user_id (user_id),
  INDEX idx_event_type (event_type),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at)
);

-- Leaderboards and rankings
CREATE TABLE IF NOT EXISTS leaderboards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  category ENUM('overall_rating', 'raid_rating', 'total_br', 'missions_completed', 'raids_won') NOT NULL,
  score BIGINT NOT NULL,
  rank_position INT NOT NULL,
  season VARCHAR(20) DEFAULT 'current',
  
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_category_season (user_id, category, season),
  INDEX idx_category_season (category, season),
  INDEX idx_rank (rank_position),
  INDEX idx_score (score)
);

-- API rate limiting and security
CREATE TABLE IF NOT EXISTS api_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ip VARCHAR(45) NOT NULL,
  endpoint VARCHAR(200) NOT NULL,
  ts INT NOT NULL,
  user_id INT DEFAULT NULL,
  
  INDEX idx_ip_ts (ip, ts),
  INDEX idx_endpoint (endpoint),
  INDEX idx_user_id (user_id)
);

-- Nonces for authentication
CREATE TABLE IF NOT EXISTS nonces (
  public_key VARCHAR(44) PRIMARY KEY,
  nonce VARCHAR(32) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_created_at (created_at)
);

-- Transaction tracking
CREATE TABLE IF NOT EXISTS burned_transactions (
  tx_hash VARCHAR(64) PRIMARY KEY,
  user_id INT NOT NULL,
  ts INT NOT NULL,
  amount BIGINT DEFAULT 0,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_ts (ts)
);

-- Game configuration and settings
CREATE TABLE IF NOT EXISTS game_config (
  config_key VARCHAR(100) PRIMARY KEY,
  config_value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default game configuration
INSERT IGNORE INTO game_config (config_key, config_value, description) VALUES
('raid_pool_max_size', '50', 'Maximum number of missions in raid pool'),
('matchmaking_rating_range', '200', 'Rating difference for matchmaking'),
('energy_refill_rate', '3600', 'Seconds between energy refills'),
('max_daily_raids', '10', 'Maximum raids per player per day'),
('battle_simulation_enabled', 'true', 'Enable battle simulation for raids'),
('season_duration_days', '30', 'Length of each competitive season'),
('alliance_max_members', '50', 'Maximum members per alliance');

-- Create triggers for automatic stat updates
DELIMITER //

CREATE TRIGGER IF NOT EXISTS update_player_stats_after_mission
AFTER UPDATE ON missions
FOR EACH ROW
BEGIN
  IF NEW.success != OLD.success AND NEW.success = 1 THEN
    INSERT INTO player_stats (user_id, missions_completed, total_br_earned)
    VALUES (NEW.user_id, 1, NEW.actual_reward)
    ON DUPLICATE KEY UPDATE
      missions_completed = missions_completed + 1,
      total_br_earned = total_br_earned + NEW.actual_reward;
  ELSEIF NEW.success != OLD.success AND NEW.success = 0 THEN
    INSERT INTO player_stats (user_id, missions_failed)
    VALUES (NEW.user_id, 1)
    ON DUPLICATE KEY UPDATE
      missions_failed = missions_failed + 1;
  END IF;
END//

CREATE TRIGGER IF NOT EXISTS update_raid_pool_after_mission
AFTER INSERT ON missions
FOR EACH ROW
BEGIN
  IF NEW.mode = 'Unshielded' THEN
    INSERT INTO raid_pool (
      mission_id, user_id, estimated_completion, loot_value,
      difficulty_score, player_rating, ship_level, risk_factor,
      sector_x, sector_y
    )
    SELECT 
      NEW.id,
      NEW.user_id,
      FROM_UNIXTIME(NEW.ts_start + NEW.duration_seconds),
      NEW.base_reward,
      (NEW.difficulty_level * 10 + s.level * 5),
      COALESCE(ps.overall_rating, 1000),
      s.level,
      CASE NEW.mission_type
        WHEN 'MiningRun' THEN 1.0
        WHEN 'BlackMarket' THEN 1.5
        WHEN 'ArtifactHunt' THEN 2.0
      END,
      NEW.sector_x,
      NEW.sector_y
    FROM ships s
    LEFT JOIN player_stats ps ON s.user_id = ps.user_id
    WHERE s.id = NEW.ship_id;
  END IF;
END//

DELIMITER ;