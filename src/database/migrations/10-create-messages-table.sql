-- Migration to create messages table
CREATE TABLE messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  chat_id INT NOT NULL,
  sender_id INT NOT NULL,
  message_type ENUM('text', 'image', 'video', 'audio') DEFAULT 'text',
  content TEXT,
  file VARCHAR(500),
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign key constraints
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);