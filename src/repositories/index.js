const adminRepository = require('./authentication/admin.repository');
const authRepository = require('./authentication/auth.repository');
const userRepository = require('./authentication/user.repository');
const otpRepository = require('./authentication/otp.repository');
const tokenRepository = require('./authentication/token.repository');

const chatRepository = require('./chat/chat.repository');
const messageRepository = require('./chat/message.repository');

const availabilityRepository = require('./availability.repository');
const blogRepository = require('./blog.repository');
const consultationRepository = require('./consultation.repository');
const contactUsRepository = require('./contactUs.repository');
const medicalRecordRepository = require('./medicalRecord.repository');
const notificationRepository = require('./notification.repository');
const reviewRepository = require('./review.repository');
const serviceRepository = require('./service.repository');
const sessionRepository = require('./session.repository');
const landingImageRepository = require('./landingImage.repository');

module.exports = {
  adminRepository,
  authRepository,
  userRepository,
  otpRepository,
  tokenRepository,
  chatRepository,
  messageRepository,
  availabilityRepository,
  blogRepository,
  consultationRepository,
  contactUsRepository,
  medicalRecordRepository,
  notificationRepository,
  reviewRepository,
  serviceRepository,
  sessionRepository,
  landingImageRepository
};