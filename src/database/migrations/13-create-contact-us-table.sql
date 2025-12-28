-- Migration to create contact_us table
CREATE TABLE contact_us (
  id INT PRIMARY KEY AUTO_INCREMENT,
  phone_numbers JSON NOT NULL COMMENT 'Phone numbers in different formats [{"type": "mobile", "number": "+1234567890"}, {"type": "landline", "number": "+1234567891"}]',
  social_media JSON NOT NULL COMMENT 'Social media links [{"platform": "facebook", "url": "https://facebook.com/example"}, {"platform": "twitter", "url": "https://twitter.com/example"}]',
  email VARCHAR(100) NOT NULL,
  address JSON NULL COMMENT 'Address in different languages {"ar": "العنوان", "en": "Address"}',
  image VARCHAR(500) NULL COMMENT 'Contact image filename',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);