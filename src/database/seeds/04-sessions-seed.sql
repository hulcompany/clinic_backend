-- Seed data for sessions table
INSERT INTO sessions (doctor_id, link, link_type, is_active) VALUES
(20, 'https://meet.google.com/abc-defg-hij', 'google_meet', 1),
(20, 'https://wa.me/1234567890', 'whatsapp', 1),
(20, 'https://zoom.us/j/1234567890', 'zoom', 1),
(20, 'https://teams.microsoft.com/l/meetup-join/1234567890', 'teams', 1),
(20, 'https://meet.google.com/xyz-wert-uio', 'google_meet', 0);
