-- Seed data for reviews table
-- Inserting sample reviews for users with IDs 2, 3, 4, and 32

INSERT INTO reviews (user_id, rating, comment, is_active, created_at, updated_at) VALUES
(2, 5, '{"ar": "خدمة ممتازة جداً! الفريق طبي محترف ومرحب به.", "en": "Excellent service! Professional and welcoming medical team."}', 1, NOW(), NOW()),
(3, 4, '{"ar": "تجربة جيدة بشكل عام. أوصي بهذه العيادة لجميع أصدقائي.", "en": "Good experience overall. I recommend this clinic to all my friends."}', 1, NOW(), NOW()),
(4, 5, '{"ar": "نتائج مذهلة! أنصح بها بشدة لأي شخص يبحث عن حلول تجميلية عالية الجودة.", "en": "Amazing results! Highly recommend for anyone seeking high-quality cosmetic solutions."}', 1, NOW(), NOW()),
(32, 3, '{"ar": "الخدمة كانت مرضية، لكن أعتقد أنه يمكن تحسين أوقات الانتظار.", "en": "Service was satisfactory, but I think waiting times could be improved."}', 1, NOW(), NOW()),
(2, 4, '{"ar": "فريق العمل متعاون للغاية وكان لديهم اهتمام كبير بالتفاصيل.", "en": "Staff were very cooperative and had great attention to detail."}', 1, NOW(), NOW());