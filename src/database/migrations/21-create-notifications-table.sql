-- Migration to create notifications table
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT 'ID of the user who receives the notification',
  title JSON NOT NULL COMMENT 'Title of the notification (multilingual)',
  message JSON NOT NULL COMMENT 'Content of the notification (multilingual)',
  type ENUM('appointment', 'message', 'system') DEFAULT 'system' COMMENT 'Type of notification',
  related_id INT COMMENT 'ID of related entity (appointment_id, chat_id, etc.)',
  target_route VARCHAR(255) COMMENT 'Route to navigate to when notification is clicked',
  is_read BOOLEAN DEFAULT FALSE COMMENT 'Whether the notification has been read',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key constraint
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- Indexes for performance
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at),
  INDEX idx_type (type)
);