const { notificationService } = require('../services');
const { Admin, Consultation } = require('../models');
const { hasPermission } = require('../config/roles');
const AppError = require('../utils/AppError');
const { successResponse, createdResponse, failureResponse } = require('../utils/responseHandler');

// Helper function to validate doctor/admin/super_admin permissions
const validateProfessionalPermission = (user) => {
  return user.role === 'doctor' || user.role === 'admin' || user.role === 'super_admin';
};

// Helper function to validate if user is a secretary for the same doctor
const validateSecretaryPermission = async (user, doctorId) => {
  if (user.role !== 'secretary') {
    return false;
  }
  
  // Check if the secretary is supervised by the specified doctor
  const secretary = await Admin.findByPk(user.user_id, { attributes: ['user_id', 'supervisor_id'] });
  return secretary && secretary.supervisor_id === doctorId;
};

// Helper function to validate notification creation permissions
const validateNotificationCreationPermission = async (user, targetUserId) => {
  // Admins and super admins can create notifications for anyone
  if (user.role === 'admin' || user.role === 'super_admin') {
    return true;
  }
  
  // Doctors can create notifications for their patients
  if (user.role === 'doctor') {
    if (targetUserId === user.user_id) {
      return true; // Doctor can create for themselves
    }
    
    // Check if the target user is a patient of this doctor
    const consultation = await Consultation.findOne({ 
      where: { 
        user_id: targetUserId, 
        admin_id: user.user_id 
      } 
    });
    return !!consultation;
  }
  
  // Secretary can create notifications if they're assigned to the doctor
  if (user.role === 'secretary' && hasPermission(user.role, 'manage_notifications_for_assigned_doctor')) {
    const doctor = await Admin.findByPk(targetUserId, { attributes: ['user_id', 'supervisor_id'] });
    return doctor && doctor.supervisor_id === user.user_id;
  }
  
  return false;
};

// Helper function to validate notification update permissions
const validateNotificationUpdatePermission = async (user, notification) => {
  // Admins and super admins can update any notification
  if (user.role === 'admin' || user.role === 'super_admin') {
    return true;
  }
  
  // Users can update their own notifications
  if (notification.user_id === user.user_id) {
    return true;
  }
  
  // Doctors can update notifications for their patients
  if (user.role === 'doctor') {
    const consultation = await Consultation.findOne({ 
      where: { 
        user_id: notification.user_id, 
        admin_id: user.user_id 
      } 
    });
    return !!consultation;
  }
  
  // Secretary can update notifications for patients of their assigned doctor
  if (user.role === 'secretary' && hasPermission(user.role, 'manage_notifications_for_assigned_doctor')) {
    const consultation = await Consultation.findOne({ 
      where: { 
        user_id: notification.user_id 
      } 
    });
    return consultation && consultation.admin_id === user.supervisor_id;
  }
  
  return false;
};

// Helper function to validate admin/super admin permissions
const validateAdminPermission = (user) => {
  return user.role === 'admin' || user.role === 'super_admin';
};

// Helper function to validate admin/super admin/doctor permissions
const validateAdminDoctorPermission = (user) => {
  return user.role === 'admin' || user.role === 'super_admin' || user.role === 'doctor';
};

/**
 * @desc    Get all notifications for the authenticated user
 * @route   GET /api/v1/notifications
 * @access  Private (User must be authenticated)
 */
const getUserNotifications = async (req, res, next) => {
  try {
    // Get pagination parameters from query, with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    // Get filter parameters
    const filters = {};
    
    // Type filter
    if (req.query.type) {
      filters.type = req.query.type;
    }
    
    // Read status filter
    if (req.query.is_read !== undefined) {
      filters.is_read = req.query.is_read === 'true';
    }
    
    // Only authenticated user can get their own notifications
    const userId = req.user.user_id;
    
    const result = await notificationService.getUserNotifications(userId, page, limit, filters);
    
    successResponse(res, result, 'Notifications retrieved successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Get notification by ID
 * @route   GET /api/v1/notifications/:id
 * @access  Private (User must be authenticated and own the notification)
 */
const getNotificationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;
    
    // Check if notification belongs to the user
    const notification = await notificationService.getNotificationById(id);
    
    if (notification.user_id !== userId) {
      return failureResponse(res, 'Not authorized to access this notification', 403);
    }
    
    successResponse(res, notification, 'Notification retrieved successfully');
  } catch (error) {
    if (error.statusCode === 404) {
      return failureResponse(res, error.message, 404);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Create a new notification (typically for internal use)
 * @route   POST /api/v1/notifications
 * @access  Private (Admin/Super Admin only)
 */
const createNotification = async (req, res, next) => {
  try {
    const { user_id, title, message, type, related_id, target_route } = req.body;
    
    // Validate required fields
    if (!user_id || !title || !message) {
      return failureResponse(res, 'User ID, title, and message are required', 400);
    }
    
    // Only admins, super admins, and doctors can create notifications
    if (!validateAdminDoctorPermission(req.user)) {
      return failureResponse(res, 'Not authorized to create notifications', 403);
    }
    
    const notificationData = {
      user_id,
      title,
      message,
      type,
      related_id,
      target_route
    };
    
    const notification = await notificationService.createNotification(notificationData);
    
    createdResponse(res, notification, 'Notification created successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Update notification (typically to mark as read)
 * @route   PUT /api/v1/notifications/:id
 * @access  Private (User must be authenticated and own the notification)
 */
const updateNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_read } = req.body;
    
    // Only admins and super admins can update notifications
    if (!validateAdminPermission(req.user)) {
      return failureResponse(res, 'Not authorized to update this notification', 403);
    }
    
    const notification = await notificationService.getNotificationById(id);
    
    const updateData = {};
    if (is_read !== undefined) updateData.is_read = is_read;
    
    const updatedNotification = await notificationService.updateNotification(id, updateData);
    
    successResponse(res, updatedNotification, 'Notification updated successfully');
  } catch (error) {
    if (error.statusCode === 404) {
      return failureResponse(res, error.message, 404);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Mark notification as read
 * @route   PUT /api/v1/notifications/:id/read
 * @access  Private (User must be authenticated and own the notification)
 */
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Only admins and super admins can mark notifications as read
    if (!validateAdminPermission(req.user)) {
      return failureResponse(res, 'Not authorized to update this notification', 403);
    }
    
    const notification = await notificationService.getNotificationById(id);
    
    const updatedNotification = await notificationService.markAsRead(id);
    
    successResponse(res, updatedNotification, 'Notification marked as read successfully');
  } catch (error) {
    if (error.statusCode === 404) {
      return failureResponse(res, error.message, 404);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Mark all notifications as read for the authenticated user
 * @route   PUT /api/v1/notifications/mark-all-read
 * @access  Private (User must be authenticated)
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    
    const result = await notificationService.markAllAsRead(userId);
    
    successResponse(res, result, 'All notifications marked as read successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Get count of unread notifications for the authenticated user
 * @route   GET /api/v1/notifications/unread-count
 * @access  Private (User must be authenticated)
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    
    const count = await notificationService.getUnreadCount(userId);
    
    successResponse(res, { count }, 'Unread notifications count retrieved successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Delete notification
 * @route   DELETE /api/v1/notifications/:id
 * @access  Private (User can delete their own notifications, Admin/Super Admin can delete any)
 */
const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;
    
    // Get the notification to check ownership
    const notification = await notificationService.getNotificationById(id);
    
    // Check if user owns this notification or is admin/super admin
    const isAdmin = validateAdminPermission(req.user);
    const isOwner = notification.user_id === userId;
    
    if (!isAdmin && !isOwner) {
      return failureResponse(res, 'Not authorized to delete this notification', 403);
    }
    
    await notificationService.deleteNotification(id);
    
    successResponse(res, null, 'Notification deleted successfully');
  } catch (error) {
    if (error.statusCode === 404) {
      return failureResponse(res, error.message, 404);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Create a broadcast notification for all users
 * @route   POST /api/v1/notifications/broadcast
 * @access  Private (Admin/Super Admin only)
 */
const createBroadcastNotification = async (req, res, next) => {
  try {
    const { title, message, type, target_route } = req.body;
    
    // Validate required fields
    if (!title || !message) {
      return failureResponse(res, 'Title and message are required', 400);
    }
    
    // Only admins and super admins can create broadcast notifications
    if (!validateAdminPermission(req.user)) {
      return failureResponse(res, 'Not authorized to create broadcast notifications', 403);
    }
    
    const result = await notificationService.createBroadcastNotification(title, message, type, target_route);
    
    successResponse(res, result, 'Broadcast notification created successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

module.exports = {
  getUserNotifications,
  getNotificationById,
  createNotification,
  updateNotification,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
  createBroadcastNotification
};
