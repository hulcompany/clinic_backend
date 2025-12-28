-- Migration to create admins table
CREATE TABLE admins (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  full_name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'doctor',
  image VARCHAR(255),
  is_active TINYINT(1) DEFAULT 0 COMMENT 'Account activation status',
  supervisor_id INT NULL COMMENT 'Foreign key to reference the supervising doctor this secretary is assigned to',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Add constraint to ensure either email or phone is provided
  CONSTRAINT chk_admin_contact CHECK (
    (email IS NOT NULL AND email != '') OR 
    (phone IS NOT NULL AND phone != '')
  ),
  
  -- Add constraint to ensure role is either 'doctor' or 'secretary'
  CONSTRAINT chk_admin_role CHECK (
    role IN ('doctor', 'secretary')
  ),
  
  -- Foreign key constraint for supervisor relationship
  CONSTRAINT fk_admin_supervisor 
  FOREIGN KEY (supervisor_id) REFERENCES admins(user_id) 
  ON DELETE SET NULL
);

-- Index for faster lookups on supervisor_id
CREATE INDEX idx_admin_supervisor ON admins(supervisor_id);