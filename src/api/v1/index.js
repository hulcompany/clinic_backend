/**
 * API v1 Index File
 * 
 * This file exports all v1 routes and controllers, making it easy to manage
 * and switch between API versions.
 */

// Import v1 routes directly (since they're not version-specific yet)
const authRoutes = require('../../routes/authentication/auth.routes');
const userRoutes = require('../../routes/authentication/user.routes');
const adminRoutes = require('../../routes/authentication/admin.routes');
const consultationRoutes = require('../../routes/consultation.routes');
const chatRoutes = require('../../routes/chat/chat.routes');
const contactUsRoutes = require('../../routes/contactUs.routes');
const messageRoutes = require('../../routes/chat/message.routes');
const realtimeChatRoutes = require('../../routes/chat/realtime.chat.routes');
const reviewRoutes = require('../../routes/review.routes');
const serviceRoutes = require('../../routes/service.routes');
const sessionRoutes = require('../../routes/session.routes');
const availabilityRoutes = require('../../routes/availability.routes');
const medicalRecordRoutes = require('../../routes/medicalRecord.routes');
const blogRoutes = require('../../routes/blog.routes');
const notificationRoutes = require('../../routes/notification.routes');
const landingImageRoutes = require('../../routes/landingImage.routes');

module.exports = {
  authRoutes,
  userRoutes,
  adminRoutes,
  consultationRoutes,
  chatRoutes,
  contactUsRoutes,
  messageRoutes,
  realtimeChatRoutes,
  reviewRoutes,
  serviceRoutes,
  sessionRoutes,
  availabilityRoutes,
  medicalRecordRoutes,
  blogRoutes,
  notificationRoutes,
  landingImageRoutes
};