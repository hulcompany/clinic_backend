-- Migration to create otp_codes table
CREATE TABLE otp_codes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  admin_id INT,
  user_type ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  otp_code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES admins(user_id) ON DELETE CASCADE,
  -- Ensure either user_id or admin_id is set, but not both
  CONSTRAINT chk_user_or_admin CHECK (
    (user_id IS NOT NULL AND admin_id IS NULL) OR 
    (user_id IS NULL AND admin_id IS NOT NULL)
  )
);