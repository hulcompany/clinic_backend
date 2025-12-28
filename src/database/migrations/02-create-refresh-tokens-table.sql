-- Create Refresh Tokens Table Migration
-- This SQL file creates the refresh_tokens table for handling JWT refresh tokens

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(500) NOT NULL UNIQUE,
    user_id INT,
    admin_id INT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES admins(user_id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_id (user_id),
    INDEX idx_admin_id (admin_id),
    INDEX idx_expires_at (expires_at),
    -- Ensure either user_id or admin_id is set, but not both
    CONSTRAINT chk_token_user_or_admin CHECK (
      (user_id IS NOT NULL AND admin_id IS NULL) OR 
      (user_id IS NULL AND admin_id IS NOT NULL)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;