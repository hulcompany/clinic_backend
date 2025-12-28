-- Migration to create consultations table
CREATE TABLE consultations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  admin_id INT NOT NULL,
  initial_issue VARCHAR(500),
  status ENUM('requested', 'active', 'closed') DEFAULT 'requested',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign key constraints
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES admins(user_id) ON DELETE CASCADE
);