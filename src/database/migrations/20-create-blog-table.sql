-- Migration to create blog table
CREATE TABLE blog (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title JSON NOT NULL COMMENT 'Blog title in different languages {"ar": "العنوان", "en": "Title"}',
  slug VARCHAR(255) NOT NULL COMMENT 'URL-friendly version of the title',
  content JSON NOT NULL COMMENT 'Blog content in different languages {"ar": "المحتوى", "en": "Content"}',
  excerpt JSON NOT NULL COMMENT 'Blog excerpt in different languages {"ar": "المقتطف", "en": "Excerpt"}',
  featured_image VARCHAR(255) COMMENT 'Featured image filename',
  author_id INT NOT NULL COMMENT 'ID of the author (doctor or doctor\'s secretary)',
  status ENUM('draft', 'published') DEFAULT 'draft' COMMENT 'Status of the blog post',
  published_at TIMESTAMP NULL COMMENT 'Timestamp when the post was published',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign key constraint
  FOREIGN KEY (author_id) REFERENCES admins(user_id) ON DELETE CASCADE,

  -- Indexes for performance
  INDEX idx_slug (slug),
  INDEX idx_status (status),
  INDEX idx_author_id (author_id),
  INDEX idx_published_at (published_at)
);