-- Migration to create services table
CREATE TABLE services (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name JSON NOT NULL COMMENT 'Service name in different languages {"ar": "الاسم", "en": "Name"}',
  description JSON NOT NULL COMMENT 'Service description in different languages {"ar": "الوصف", "en": "Description"}',
  image VARCHAR(500) NULL COMMENT 'Service image filename',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);