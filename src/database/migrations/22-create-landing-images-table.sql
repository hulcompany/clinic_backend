-- Create landing_images table
CREATE TABLE landing_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    image VARCHAR(255) NOT NULL,
    section ENUM('hero', 'about', 'story') NOT NULL,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create index for section and display_order for efficient querying
CREATE INDEX idx_landing_images_section_order ON landing_images(section, display_order);

-- Create index for is_active for filtering
CREATE INDEX idx_landing_images_active ON landing_images(is_active);