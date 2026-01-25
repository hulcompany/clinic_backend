const adminController = require('./authentication/adminController');
const authController = require('./authentication/authController');
const userController = require('./authentication/userController');

const availabilityController = require('./availability.controller');
const blogController = require('./blog.controller');
const consultationController = require('./consultationController');
const contactUsController = require('./contactUs.controller');
const medicalRecordController = require('./medicalRecord.controller');
const notificationController = require('./notification.controller');
const reviewController = require('./review.controller');
const serviceController = require('./service.controller');
const sessionController = require('./session.controller');
const landingImageController = require('./landingImage.controller');
const dashboardController = require('./dashboard.controller');

module.exports = {
  adminController,
  authController,
  userController,
  availabilityController,
  blogController,
  consultationController,
  contactUsController,
  medicalRecordController,
  notificationController,
  reviewController,
  serviceController,
  sessionController,
  landingImageController,
  dashboardController
};
