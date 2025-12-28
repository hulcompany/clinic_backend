-- Seed data for availability table
-- This file contains sample availability slots for testing purposes

-- Sample availability slots for admin_id = 6 (Dr. Sami Alhasan)
INSERT INTO `availability` (`admin_id`, `date`, `start_time`, `end_time`, `is_booked`, `booked_by_user_id`, `status`, `created_at`, `updated_at`) VALUES
-- Past slots (should be marked as unavailable)
(6, '2025-12-15', '09:00:00', '10:00:00', 0, NULL, 'unavailable', NOW(), NOW()),
(6, '2025-12-16', '14:00:00', '15:00:00', 1, 2, 'unavailable', NOW(), NOW()),

-- Future available slots
(6, '2025-12-25', '09:00:00', '10:00:00', 0, NULL, 'available', NOW(), NOW()),
(6, '2025-12-25', '10:30:00', '11:30:00', 0, NULL, 'available', NOW(), NOW()),
(6, '2025-12-26', '14:00:00', '15:00:00', 0, NULL, 'available', NOW(), NOW()),
(6, '2025-12-27', '11:00:00', '12:00:00', 0, NULL, 'available', NOW(), NOW()),

-- Future booked slots
(6, '2025-12-28', '09:00:00', '10:00:00', 1, 3, 'available', NOW(), NOW()),
(6, '2025-12-29', '15:00:00', '16:00:00', 1, 4, 'available', NOW(), NOW()),

-- Sample availability slots for admin_id = 20 (Adnan bk)
(20, '2025-12-25', '10:00:00', '11:00:00', 0, NULL, 'available', NOW(), NOW()),
(20, '2025-12-26', '16:00:00', '17:00:00', 0, NULL, 'available', NOW(), NOW()),

-- Single time slots (end_time = NULL)
(6, '2025-12-30', '10:00:00', NULL, 0, NULL, 'available', NOW(), NOW()),
(20, '2025-12-31', '14:30:00', NULL, 0, NULL, 'available', NOW(), NOW());