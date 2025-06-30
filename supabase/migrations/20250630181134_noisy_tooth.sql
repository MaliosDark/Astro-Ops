/*
  # Add token withdrawals table
  
  1. New Tables
    - `token_withdrawals` - Tracks token withdrawal requests and their status
      - `id` (int, primary key)
      - `user_id` (int, foreign key to users)
      - `amount` (bigint)
      - `tx_hash` (varchar, nullable)
      - `status` (enum: pending, completed, failed)
      - `created_at` (timestamp)
      - `completed_at` (timestamp, nullable)
  
  2. Security
    - Added foreign key constraint to users table
    - Added indexes for efficient querying
*/

-- Create token withdrawals table
CREATE TABLE IF NOT EXISTS token_withdrawals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  amount BIGINT NOT NULL,
  tx_hash VARCHAR(100) NULL,
  status ENUM('pending', 'completed', 'failed') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;