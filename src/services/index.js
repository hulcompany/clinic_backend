/*
Service Index File (index.js)
----------------------
Purpose:
- Loads all services
- Provides a centralized way to access services
- Avoids direct file imports throughout the application
*/

// Load services
const adminService = require('./authentication/adminService');
const authService = require('./authentication/authService');
const chatService = require('./chat/chat.service');
const consultationService = require('./consultation.service');
const contactUsService = require('./contactUs.service');
const emailService = require('./emailService');
const messageService = require('./chat/message.service');
const otpService = require('./authentication/otpService');
const reviewService = require('./review.service');
const sessionService = require('./session.service');
const serviceService = require('./service.service');
const tokenService = require('./authentication/token.service');
const userService = require('./authentication/userService');
const availabilityService = require('./availability.service');
const medicalRecordService = require('./medicalRecord.service');
const blogService = require('./blog.service');
const notificationService = require('./notification.service');
const autoNotificationService = require('./autoNotification.service');
const landingImageService = require('./landingImage.service');
const paymentService = require('./payment.service');
const paymentMethodService = require('./paymentMethod.service');

// Export services
module.exports = {
  adminService,
  authService,
  chatService,
  consultationService,
  contactUsService,
  emailService,
  messageService,
  otpService,
  reviewService,
  sessionService,
  serviceService,
  tokenService,
  userService,
  availabilityService,
  medicalRecordService,
  blogService,
  notificationService,
  autoNotificationService,
  landingImageService,
  paymentService,
  paymentMethodService
};
