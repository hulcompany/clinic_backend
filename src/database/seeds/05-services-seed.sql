-- Seed data for services table
-- Inserting 7 core cosmetic services with bilingual names and descriptions

INSERT INTO services (name, description, image, is_active, created_at, updated_at) VALUES
('{"ar": "تنحيف الأنف (جمالي ووظيفي)", "en": "Rhinoplasty (cosmetic & functional)"}', 
 '{"ar": "يحسن شكل الأنف والتنفس لتحقيق نتيجة وجهية طبيعية ومتوازنة.", "en": "Improves nose shape and breathing for a natural, balanced facial result."}', 
 'rhinoplasty-sample.jpg', 1, NOW(), NOW()),

('{"ar": "تنحيف الأنف بالموجات فوق الصوتية والحفظ", "en": "Ultrasonic & Preservation Rhinoplasty"}', 
 '{"ar": "تصنيع العظام بدقة مع تقليل الصدمة، والحفاظ على هيكل الأنف سليماً لتسريع الشفاء.", "en": "Accurate bone contouring with less trauma, keeping the nasal structure intact for faster healing."}', 
 'ultrasonic-rhinoplasty-sample.jpg', 1, NOW(), NOW()),

('{"ar": "شد الوجه والوجه المصغر", "en": "Facelift and Mini Facelift"}', 
 '{"ar": "يرفع ويضيق الوجه والرقبة لاستعادة خطوط الشباب مع نتائج طبيعية.", "en": "Lifts and tightens the face and neck to restore youthful contours with natural results."}', 
 'facelift-sample.jpg', 1, NOW(), NOW()),

('{"ar": "جراحة جفون العين (الجفون)", "en": "Blepharoplasty (Eyelids)"}', 
 '{"ar": "يزيل الجلد الزائد والدهون لإنعاش العيون وتقليل الانتفاخ.", "en": "Removes excess skin and fat to refresh the eyes and reduce puffiness."}', 
 'blepharoplasty-sample.jpg', 1, NOW(), NOW()),

('{"ar": "رفع الشفة وتحسينها", "en": "Lip Lift & Lip Enhancement"}', 
 '{"ar": "يعزز شكل الشفة وتعريفها بحجم طبيعي ومصقول.", "en": "Enhances lip shape and definition with natural, refined volume."}', 
 'lip-lift-sample.jpg', 1, NOW(), NOW()),

('{"ar": "الحقن المتقدمة", "en": "Advanced Injectables"}', 
 '{"ar": "مواد تجميل غير جراحية وعلاجات للتجاعيد لتنعيم الخطوط واستعادة الحجم.", "en": "Non-surgical fillers and wrinkle treatments to smooth lines and restore volume."}', 
 'injectables-sample.jpg', 1, NOW(), NOW()),

('{"ar": "تجديد البشرة بالليزر", "en": "Laser Skin Rejuvenation"}', 
 '{"ar": "يحسن نبرة البشرة وملمسها عن طريق علاج الصبغة والمسام والخطوط الدقيقة.", "en": "Improves skin tone and texture by treating pigmentation, pores, and fine lines."}', 
 'laser-rejuvenation-sample.jpg', 1, NOW(), NOW());