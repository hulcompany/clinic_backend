-- Seed data for consultations table
INSERT INTO consultations (user_id, admin_id, initial_issue, status, created_at, updated_at) VALUES
(2, 6, 'Patient is experiencing headaches and dizziness for the past week', 'active', NOW(), NOW()),
(3, 6, 'Regular checkup and consultation for ongoing treatment', 'requested', NOW(), NOW()),
(4, 7, 'Need advice on medication dosage adjustments', 'closed', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(32, 7, 'Follow-up consultation for previous treatment', 'active', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(2, 6, 'Initial consultation for new patient registration', 'requested', NOW(), NOW());