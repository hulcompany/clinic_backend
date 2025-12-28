CREATE TABLE users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  full_name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'user',
  is_restricted TINYINT(1) DEFAULT 0 COMMENT 'Restricted access - only doctors can view',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Add constraint to ensure either email or phone is provided
  CONSTRAINT chk_contact CHECK (
    (email IS NOT NULL AND email != '') OR 
    (phone IS NOT NULL AND phone != '')
  )
);