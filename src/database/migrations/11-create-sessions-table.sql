-- Migration to create sessions table for storing meeting links
CREATE TABLE sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  admin_id INT NOT NULL,
  link VARCHAR(500) NOT NULL,
  link_type ENUM('google_meet', 'whatsapp', 'zoom', 'teams', 'other') NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign key constraints
  FOREIGN KEY (admin_id) REFERENCES admins(user_id) ON DELETE CASCADE
);