-- Migration to create availability table
-- Table: availability

CREATE TABLE IF NOT EXISTS `availability` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `admin_id` INT NOT NULL COMMENT 'Foreign key to admins table (doctor/secretary)',
  `date` DATE NOT NULL COMMENT 'Date of availability',
  `start_time` TIME NOT NULL COMMENT 'Start time of availability slot',
  `end_time` TIME NULL DEFAULT NULL COMMENT 'End time of availability slot (NULL for single time)',
  `is_booked` BOOLEAN DEFAULT FALSE COMMENT 'Whether this slot is booked',
  `booked_by_user_id` INT NULL DEFAULT NULL COMMENT 'User who booked this slot',
  `status` ENUM('available', 'unavailable', 'cancelled') DEFAULT 'available' COMMENT 'Status of the availability slot',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`admin_id`) REFERENCES `admins`(`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`booked_by_user_id`) REFERENCES `users`(`user_id`) ON DELETE SET NULL,
  
  INDEX `idx_admin_date` (`admin_id`, `date`),
  INDEX `idx_is_booked` (`is_booked`),
  INDEX `idx_status` (`status`),
  INDEX `idx_booked_by_user` (`booked_by_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Availability slots for doctors/secretaries';