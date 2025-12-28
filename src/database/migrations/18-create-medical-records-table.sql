-- Create Medical Records Table Migration
-- This SQL file creates the medical_records table for storing patient medical records

CREATE TABLE IF NOT EXISTS medical_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    doctor_id INT NOT NULL,
    consultation_id INT,
    age INT,
    gender ENUM('male', 'female', 'other'),
    height DECIMAL(5,2),
    weight DECIMAL(5,2),
    chronic_diseases TEXT,
    allergies TEXT,
    previous_surgeries TEXT,
    notes TEXT,
    medical_attachments JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES admins(user_id) ON DELETE CASCADE,
    FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE SET NULL,
    
    -- Indexes for performance
    INDEX idx_user_id (user_id),
    INDEX idx_doctor_id (doctor_id),
    INDEX idx_consultation_id (consultation_id),
    INDEX idx_created_at (created_at)
);