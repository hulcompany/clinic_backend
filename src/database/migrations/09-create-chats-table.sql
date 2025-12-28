-- Migration to create chats table
CREATE TABLE chats (
  id INT PRIMARY KEY AUTO_INCREMENT,
  consultation_id INT NOT NULL,
  last_message_at TIMESTAMP NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign key constraints
  FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE
);