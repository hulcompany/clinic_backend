const { chatService, consultationService } = require('../../services/index');
const { autoNotificationService } = require('../../services');
const AppError = require('../../utils/AppError');
const { successResponse, failureResponse } = require('../../utils/responseHandler');

// Helper function to validate admin permissions for viewing all chats
const validateAdminViewPermission = (user) => {
  return user.role === 'admin' || user.role === 'super_admin' || user.role === 'doctor';
};

// Helper function to validate user/doctor permissions for their own chats
const validateUserChatPermission = (user) => {
  return user.role === 'user' || user.role === 'doctor';
};

// Helper function to validate doctor-only permissions
const validateDoctorPermission = (user) => {
  return user.role === 'doctor';
};

// Helper function to validate chat access permission
const validateChatAccess = async (user, consultation_id) => {
  const consultation = await consultationService.getConsultationById(consultation_id);
  
  if (user.role === 'admin' || user.role === 'super_admin' || user.role === 'doctor') {
    return { authorized: true, consultation };
  }
  
  if (consultation.user_id === user.user_id || consultation.admin_id === user.user_id) {
    return { authorized: true, consultation };
  }
  
  return { authorized: false, consultation: null };
};

// Helper function to validate chat status update permission
const validateChatStatusUpdatePermission = (user) => {
  return user.role === 'admin' || user.role === 'super_admin' || user.role === 'doctor';
};

/**
 * @desc    Get all chats
 * @route   GET /api/v1/chats
 * @access  Private (Admin/Super Admin/Doctor)
 */
const getAllChats = async (req, res, next) => {
  try {
    // Only admins and super admins and doctors can view all chats
    if (!validateAdminViewPermission(req.user)) {
      return failureResponse(res, 'Not authorized to view all chats', 403);
    }
    
    // Get pagination parameters from query, with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const result = await chatService.getAllChats(page, limit);
    
    successResponse(res, result, 'Chats retrieved successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Get chats by user ID (from auth token)
 * @route   GET /api/v1/chats/my
 * @access  Private (User/Doctor)
 */
const getMyChats = async (req, res, next) => {
  try {
    // Both users and doctors can access their own chats
    if (!validateUserChatPermission(req.user)) {
      return failureResponse(res, 'Not authorized to view these chats', 403);
    }
    
    // Get pagination parameters from query, with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    if (req.user.role === 'user') {
      // Use the authenticated user's ID as the user ID
      const user_id = req.user.user_id;
      const result = await chatService.getChatsByUserId(user_id, page, limit);
      successResponse(res, result, 'Chats retrieved successfully');
    } else if (req.user.role === 'doctor') {
      // Use the authenticated user's ID as the doctor ID
      const doctor_id = req.user.user_id;
      const result = await chatService.getChatsByDoctorId(doctor_id, page, limit);
      successResponse(res, result, 'Chats retrieved successfully');
    }
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Get chats by doctor ID (from auth token)
 * @route   GET /api/v1/chats/my-doctor
 * @access  Private (Doctor)
 */
const getMyDoctorChats = async (req, res, next) => {
  try {
    // Only doctors can access their own chats
    if (!validateDoctorPermission(req.user)) {
      return failureResponse(res, 'Not authorized to view these chats', 403);
    }
    
    // Get pagination parameters from query, with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    // Use the authenticated user's ID as the doctor ID
    const doctor_id = req.user.user_id;
    
    const result = await chatService.getChatsByDoctorId(doctor_id, page, limit);
    
    successResponse(res, result, 'Chats retrieved successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Get chat by consultation ID
 * @route   GET /api/v1/chats/consultation/:consultation_id
 * @access  Private (User/Admin /Doctor involved in consultation)
 */
const getChatByConsultation = async (req, res, next) => {
  try {
    const { consultation_id } = req.params;
    
    // Check if user has permission to view this chat
    const { authorized, consultation } = await validateChatAccess(req.user, consultation_id);
    if (!authorized) {
      return failureResponse(res, 'Not authorized to view this chat', 403);
    }
    
    const chat = await chatService.getChatByConsultationId(consultation_id);
    
    successResponse(res, chat, 'Chat retrieved successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Toggle chat active status
 * @route   PUT /api/v1/chats/:id/toggle-status
 * @access  Private (Admin/Doctor)
 */
const toggleChatStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Only admins and doctors can toggle chat status
    if (!validateChatStatusUpdatePermission(req.user)) {
      return failureResponse(res, 'Not authorized to update chat status', 403);
    }
    
    const chat = await chatService.toggleChatStatus(id);
    
    // إنشاء إشعار تلقائي لتحديث حالة الدردشة
    try {
      // الحصول على بيانات الاستشارة المرتبطة بالدردشة
      const consultation = await consultationService.getConsultationById(chat.consultation_id);
      
      // إرسال إشعار لكل من المستخدم والدكتور
      const notifications = [];
      
      // إشعار للمستخدم
      if (consultation.user_id) {
        notifications.push(
          autoNotificationService.createChatStatusNotification(
            consultation.user_id,
            {
              id: chat.id
            },
            chat.is_active
          )
        );
      }
      
      // إشعار للدكتور
      if (consultation.admin_id) {
        notifications.push(
          autoNotificationService.createChatStatusNotification(
            consultation.admin_id,
            {
              id: chat.id
            },
            chat.is_active
          )
        );
      }
      
      // تنفيذ جميع الإشعارات بالتوازي
      await Promise.all(notifications);
      
    } catch (notificationError) {
      console.error('Failed to send chat status notifications:', notificationError);
      // Don't fail the status update if notifications fail
    }
    
    successResponse(res, chat, 'Chat status updated successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

module.exports = {
  getAllChats,
  getMyChats,
  getMyDoctorChats,
  getChatByConsultation,
  toggleChatStatus
};
