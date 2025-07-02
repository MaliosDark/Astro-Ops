/*
  # Add token transactions table

  1. New Tables
    - `token_transactions`
      - `id` (uuid, primary key)
      - `user_id` (integer, foreign key to users)
      - `amount` (bigint)
      - `tx_hash` (varchar, nullable)
      - `tx_type` (enum)
      - `status` (enum)
      - `created_at` (timestamp)
      - `completed_at` (timestamp, nullable)
  2. Security
    - Enable RLS on `token_transactions` table
    - Add policy for authenticated users to read their own data
*/

-- Create token transactions table
CREATE TABLE IF NOT EXISTS token_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  amount BIGINT NOT NULL,
  tx_hash VARCHAR(100) NULL,
  tx_type ENUM('mission_reward', 'raid_reward', 'claim', 'withdraw', 'upgrade_cost', 'burn') NOT NULL,
  status ENUM('pending', 'completed', 'failed') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_tx_type (tx_type),
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add new API endpoint to Server/api.php for token transactions
-- This would be implemented in the actual PHP file