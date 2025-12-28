-- Seed data for messages table
INSERT INTO messages (chat_id, sender_id, message_type, content, file, read_at, created_at, updated_at) VALUES
(20, 2, 'text', 'Hello doctor, I''ve been having headaches for the past week. They seem to get worse in the afternoon.', NULL, NULL, DATE_SUB(NOW(), INTERVAL 1 HOUR), DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(20, 6, 'text', 'I see. Can you describe the intensity of the pain on a scale of 1 to 10?', NULL, DATE_SUB(NOW(), INTERVAL 50 MINUTE), DATE_SUB(NOW(), INTERVAL 50 MINUTE), DATE_SUB(NOW(), INTERVAL 50 MINUTE)),
(20, 2, 'text', 'It''s usually around 6 or 7, but yesterday it reached 9.', NULL, NULL, DATE_SUB(NOW(), INTERVAL 40 MINUTE), DATE_SUB(NOW(), INTERVAL 40 MINUTE)),
(20, 6, 'text', 'Have you noticed any triggers? Like certain foods, stress, or lack of sleep?', NULL, DATE_SUB(NOW(), INTERVAL 30 MINUTE), DATE_SUB(NOW(), INTERVAL 30 MINUTE), DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
(21, 6, 'text', 'Welcome to our clinic. How can I help you today?', NULL, NULL, DATE_SUB(NOW(), INTERVAL 10 MINUTE), DATE_SUB(NOW(), INTERVAL 10 MINUTE)),
(23, 32, 'text', 'Hi, this is a follow-up to my previous visit. How should I adjust my medication?', NULL, NULL, DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(23, 6, 'text', 'Let me check your records. I recommend reducing the dosage by 25% and monitoring your symptoms.', NULL, DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(23, 32, 'text', 'Thank you, doctor. I''ll follow your advice and report back in a week.', NULL, NULL, DATE_SUB(NOW(), INTERVAL 1 HOUR), DATE_SUB(NOW(), INTERVAL 1 HOUR));