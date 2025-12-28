-- Migration to create reviews table
CREATE TABLE reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  rating TINYINT NOT NULL COMMENT 'Rating from 1 to 5 stars',
  comment JSON NOT NULL COMMENT 'Review comment in different languages {"ar": "التعليق", "en": "Comment"}',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign key constraint
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- Add constraint to ensure rating is between 1 and 5
  CONSTRAINT chk_rating CHECK (
    rating >= 1 AND rating <= 5
  )
);