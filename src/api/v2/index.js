/**
 * API v2 Index File
 * 
 * This file exports all v2 routes and controllers, making it easy to manage
 * and switch between API versions.
 */

// Import v2 routes
const authRoutes = require('./routes/auth.routes');
// For other routes that don't have v2 implementations yet, fall back to v1
const userRoutes = require('../../routes/authentication/user.routes');
const adminRoutes = require('../../routes/authentication/admin.routes');
const consultationRoutes = require('../../routes/consultation.routes');
const chatRoutes = require('../../routes/chat/chat.routes');
const contactUsRoutes = require('../../routes/contactUs.routes');
const messageRoutes = require('../../routes/chat/message.routes');
const reviewRoutes = require('../../routes/review.routes');
const serviceRoutes = require('../../routes/service.routes');
const availabilityRoutes = require('../../routes/availability.routes');
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
  reviewRoutes,
  serviceRoutes,
  availabilityRoutes,
  blogRoutes,
  notificationRoutes,
  landingImageRoutes
};