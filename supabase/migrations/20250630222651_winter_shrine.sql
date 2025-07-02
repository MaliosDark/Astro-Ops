@@ .. @@
 INSERT IGNORE INTO reputation (user_id, rep)
 SELECT id, 100 FROM users;
+
+-- 12) Token Transactions (for transaction history and claims)
+CREATE TABLE IF NOT EXISTS token_transactions (
+  id INT AUTO_INCREMENT PRIMARY KEY,
+  user_id INT NOT NULL,
+  tx_type ENUM('mission_reward','raid_reward','claim','withdraw','upgrade_cost','burn','ship_purchase') NOT NULL,
+  amount BIGINT NOT NULL,
+  mission_id INT NULL,
+  ship_id INT NULL,
+  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
+  status ENUM('pending','completed','failed') NOT NULL DEFAULT 'completed',
+  tx_hash VARCHAR(128) NULL,
+  notes TEXT NULL,
+  FOREIGN KEY(user_id) REFERENCES users(id),
+  FOREIGN KEY(mission_id) REFERENCES missions(id),
+  FOREIGN KEY(ship_id) REFERENCES ships(id),
+  INDEX idx_user_id (user_id),
+  INDEX idx_tx_type (tx_type),
+  INDEX idx_created_at (created_at),
+  INDEX idx_status (status)
+);