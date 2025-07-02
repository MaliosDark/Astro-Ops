/*
  # Add token withdrawals table

  1. New Tables
    - `token_withdrawals`
      - `id` (int, primary key)
      - `user_id` (int, foreign key to users)
      - `amount` (bigint)
      - `tx_hash` (varchar, nullable)
      - `status` (enum: pending, completed, failed)
      - `created_at` (timestamp)
      - `completed_at` (timestamp, nullable)
  2. Security
    - Add indexes for user_id and status
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
  INDEX idx_status (status)
);

-- Add foreign key constraint
ALTER TABLE token_withdrawals
ADD CONSTRAINT fk_withdrawals_user
FOREIGN KEY (user_id) REFERENCES users(id);