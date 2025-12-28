/*
يُعدّ ملف routes/index.js بمثابة مركز رئيسي يجمع جميع ملفات المسارات الفردية في وحدة توجيه واحدة.
 يُمكّن هذا التطبيق من تنظيم المسارات بشكل منظم، 
ويُسهّل إدارة استيراد المسارات في أجزاء أخرى من التطبيق. فبدلاً من استيراد كل ملف مسار على حدة،
 يُمكن للوحدات الأخرى ببساطة استيراد ملف index هذا للوصول إلى جميع المسارات.
*/
const express = require('express');
const router = express.Router();

// Import route files
const authRoutes = require('./authentication/auth.routes');
const userRoutes = require('./authentication/user.routes');
const adminRoutes = require('./authentication/admin.routes');
const consultationRoutes = require('./consultation.routes');
const chatRoutes = require('./chat/chat.routes');
const contactUsRoutes = require('./contactUs.routes');
const messageRoutes = require('./chat/message.routes');
const reviewRoutes = require('./review.routes');
const serviceRoutes = require('./service.routes');
const availabilityRoutes = require('./availability.routes');
const medicalRecordRoutes = require('./medicalRecord.routes');
const blogRoutes = require('./blog.routes');
const landingImageRoutes = require('./landingImage.routes');

// Use routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/consultations', consultationRoutes);
router.use('/contact-us', contactUsRoutes);
router.use('/chats', chatRoutes);
router.use('/messages', messageRoutes);
router.use('/reviews', reviewRoutes);
router.use('/services', serviceRoutes);
router.use('/availability', availabilityRoutes);
router.use('/medical-records', medicalRecordRoutes);
router.use('/blogs', blogRoutes);
router.use('/landing-images', landingImageRoutes);

module.exports = router;