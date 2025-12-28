-- Seed data for contact_us table
-- Inserting initial contact information with phone numbers, social media links, email, and address

INSERT INTO contact_us (phone_numbers, social_media, email, address, image, is_active, created_at, updated_at) VALUES
('[
  {"type": "primary", "number": "+966123456789"},
  {"type": "whatsapp", "number": "+966123456790"},
  {"type": "emergency", "number": "+966123456791"}
]', 
'[
  {"platform": "facebook", "url": "https://facebook.com/clinic5"},
  {"platform": "twitter", "url": "https://twitter.com/clinic5"},
  {"platform": "instagram", "url": "https://instagram.com/clinic5"},
  {"platform": "linkedin", "url": "https://linkedin.com/company/clinic5"}
]', 
'info@clinic5.com', 
'{"ar": "شارع التخصصي، الرياض، المملكة العربية السعودية", "en": "Specialist Street, Riyadh, Saudi Arabia"}', 
'contact-us-sample.jpg', 1, NOW(), NOW());