-- migrations.sql

-- 1) Users (stores wallet public keys)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  public_key VARCHAR(64) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_missions INT NOT NULL DEFAULT 0,
  total_raids_won INT NOT NULL DEFAULT 0,
  total_kills INT NOT NULL DEFAULT 0
);

-- 2) Nonces (for login challenges)
CREATE TABLE IF NOT EXISTS nonces (
  public_key VARCHAR(64) NOT NULL PRIMARY KEY,
  nonce CHAR(32) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3) Ships
CREATE TABLE IF NOT EXISTS ships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  level TINYINT NOT NULL DEFAULT 1,
  last_mission_ts INT NOT NULL DEFAULT 0,
  br_balance BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active TINYINT NOT NULL DEFAULT 1,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- 4) Missions
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
  FOREIGN KEY(raided_by) REFERENCES users(id)
);

-- 5) API Logs (for simple rate-limiting)
CREATE TABLE IF NOT EXISTS api_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ip VARCHAR(45) NOT NULL,
  endpoint VARCHAR(64) NOT NULL,
  ts INT NOT NULL
);

-- Energy (por usuario)
CREATE TABLE IF NOT EXISTS energy (
  user_id     INT         NOT NULL PRIMARY KEY,
  energy      INT         NOT NULL DEFAULT 10,
  last_refill INT         NOT NULL DEFAULT 0,
  max_energy  INT         NOT NULL DEFAULT 10,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Reputation (para penalizaciones)
CREATE TABLE IF NOT EXISTS reputation (
  user_id INT   NOT NULL PRIMARY KEY,
  rep     INT   NOT NULL DEFAULT 100,  -- e.g. empieza en 100 puntos
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- User Settings (configuraciones del usuario)
CREATE TABLE IF NOT EXISTS user_settings (
  user_id INT NOT NULL PRIMARY KEY,
  preferred_mode ENUM('Shielded','Unshielded') NOT NULL DEFAULT 'Unshielded',
  auto_claim TINYINT NOT NULL DEFAULT 0,
  notifications TINYINT NOT NULL DEFAULT 1,
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- User Cache (para datos que cambian frecuentemente)
CREATE TABLE IF NOT EXISTS user_cache (
  user_id INT NOT NULL PRIMARY KEY,
  cache_data JSON,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Achievements (logros del usuario)
CREATE TABLE IF NOT EXISTS achievements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  achievement_type VARCHAR(50) NOT NULL,
  achievement_data JSON,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id),
  UNIQUE KEY unique_user_achievement (user_id, achievement_type)
);

-- Indexes para mejor performance
CREATE INDEX IF NOT EXISTS idx_missions_user_id ON missions(user_id);
CREATE INDEX IF NOT EXISTS idx_missions_ts_start ON missions(ts_start);
CREATE INDEX IF NOT EXISTS idx_missions_raided ON missions(raided);
CREATE INDEX IF NOT EXISTS idx_ships_user_id ON ships(user_id);
CREATE INDEX IF NOT EXISTS idx_users_public_key ON users(public_key);
CREATE INDEX IF NOT EXISTS idx_api_logs_ts ON api_logs(ts);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);