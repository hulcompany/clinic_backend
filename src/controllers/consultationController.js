const { consultationService } = require('../services/index');
const { autoNotificationService } = require('../services');
const AppError = require('../utils/AppError');
const { successResponse, createdResponse, failureResponse } = require('../utils/responseHandler');

// Helper function to validate admin view permission for consultations
const validateAdminViewPermission = (user) => {
  return user.role === 'admin' || user.role === 'super_admin' || user.role === 'doctor';
};

// Helper function to validate consultation access permission
const validateConsultationAccess = (user, consultationUserId) => {
  // Admins, super admins, and doctors can view any consultation
  if (user.role === 'admin' || user.role === 'super_admin' || user.role === 'doctor') {
    return true;
  }
  
  // Regular users can only view their own consultations
  return user.user_id === consultationUserId;
};

// Helper function to validate admin-only permission for delete operations
const validateAdminOnlyPermission = (user) => {
  return user.role === 'admin' || user.role === 'super_admin'|| user.role === 'doctor';
};

// Helper function to validate consultation status update permission
const validateConsultationStatusUpdatePermission = (user) => {
  return user.role === 'admin' || user.role === 'super_admin' || user.role === 'doctor';
};

// Helper function to validate consultation assignment
const validateConsultationAssignment = async (user, consultationId) => {
  const consultation = await consultationService.getConsultationById(consultationId);
  
  // Admins, super admins can update any consultation
  if (user.role === 'admin' || user.role === 'super_admin') {
    return { authorized: true, consultation };
  }
  
  // Doctors can only update their assigned consultations
  if (user.role === 'doctor' && consultation.admin_id === user.user_id) {
    return { authorized: true, consultation };
  }
  
  return { authorized: false, consultation: null };
};

// Helper function to validate user consultations access
const validateUserConsultationsAccess = (user, targetUserId) => {
  // Admins, super admins, and doctors can view any user's consultations
  if (user.role === 'admin' || user.role === 'super_admin' || user.role === 'doctor') {
    return true;
  }
  
  // Regular users can only view their own consultations
  return user.user_id === targetUserId;
};

// Helper function to validate admin consultations access
const validateAdminConsultationsAccess = (user, targetAdminId) => {
  // Admins, super admins, and doctors can view consultations
  if (user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'doctor') {
    return false;
  }
  
  // Regular admins and doctors can only view their own consultations
  if ((user.role === 'admin' || user.role === 'doctor') && user.user_id !== targetAdminId) {
    return false;
  }
  
  return true;
};

/**
 * @desc    Get all consultations
 * @route   GET /api/v1/consultations
 * @access  Private (Admin/Super Admin/Doctor)
 */
const getAllConsultations = async (req, res, next) => {
  try {
    // Only admins, super admins, and doctors can view all consultations
    if (!validateAdminViewPermission(req.user)) {
      return failureResponse(res, 'Not authorized to view all consultations', 403);
    }
    
    // Get pagination parameters from query, with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const result = await consultationService.getAllConsultations(page, limit);
    
    successResponse(res, result, 'Consultations retrieved successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Create a new consultation
 * @route   POST /api/v1/consultations
 * @access  Private (User)
 */
const createConsultation = async (req, res, next) => {
  try {
    const { admin_id, initial_issue } = req.body;
    
    // User ID comes from authenticated user
    const user_id = req.user.user_id;
    
    const result = await consultationService.createConsultation({
      user_id,
      admin_id,
      initial_issue,
      medical_record_id: null  // Initially null, will be updated when medical record is created

    });
    
    // إنشاء إشعار تلقائي لإنشاء الاستشارة
    try {
      await autoNotificationService.createConsultationNotification(
        user_id,
        {
          id: result.consultation.id
        }
      );
    } catch (notificationError) {
      console.error('Failed to send consultation creation notification:', notificationError);
      // Don't fail the consultation creation if notification fails
    }
    
    createdResponse(res, result, 'Consultation created successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Get consultation by ID
 * @route   GET /api/v1/consultations/:id
 * @access  Private (User/Admin)
 */
const getConsultation = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const consultation = await consultationService.getConsultationById(id);
    
    // Check if user has permission to view this consultation
    if (!validateConsultationAccess(req.user, consultation.user_id)) {
      return failureResponse(res, 'Not authorized to view this consultation', 403);
    }
    
    successResponse(res, consultation, 'Consultation retrieved successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Update consultation status
 * @route   PUT /api/v1/consultations/:id/status
 * @access  Private (Admin/Doctor)
 */
const updateConsultationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Only admins and doctors can update consultation status
    if (!validateConsultationStatusUpdatePermission(req.user)) {
      return failureResponse(res, 'Not authorized to update consultation status', 403);
    }
    
    // Check if admin/doctor is assigned to this consultation
    const { authorized, consultation } = await validateConsultationAssignment(req.user, id);
    if (!authorized) {
      return failureResponse(res, 'Not authorized to update this consultation', 403);
    }
    
    const updatedConsultation = await consultationService.updateConsultationStatus(id, status);
    
    // إنشاء إشعار تلقائي لتحديث حالة الاستشارة
    try {
      await autoNotificationService.createConsultationStatusNotification(
        consultation.user_id,
        {
          id: consultation.id
        },
        status
      );
    } catch (notificationError) {
      console.error('Failed to send consultation status notification:', notificationError);
      // Don't fail the status update if notification fails
    }
    
    successResponse(res, updatedConsultation, 'Consultation status updated successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Get consultations by user ID
 * @route   GET /api/v1/consultations/user/:user_id
 * @access  Private (User/Admin/Doctor)
 */
const getConsultationsByUserId = async (req, res, next) => {
  try {
    const { user_id } = req.params;
    
    // Get pagination parameters from query, with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    // Check if user has permission to view these consultations
    if (!validateUserConsultationsAccess(req.user, parseInt(user_id))) {
      return failureResponse(res, 'Not authorized to view these consultations', 403);
    }
    
    const result = await consultationService.getConsultationsByUserId(user_id, page, limit);
    
    successResponse(res, result, 'Consultations retrieved successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Get consultations by admin ID
 * @route   GET /api/v1/consultations/admin/:admin_id
 * @access  Private (Admin/Doctor)
 */
const getConsultationsByAdminId = async (req, res, next) => {
  try {
    const { admin_id } = req.params;
    
    // Get pagination parameters from query, with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    // Check if admin/doctor has permission to view these consultations
    if (!validateAdminConsultationsAccess(req.user, parseInt(admin_id))) {
      return failureResponse(res, 'Not authorized to view these consultations', 403);
    }
    
    const result = await consultationService.getConsultationsByAdminId(admin_id, page, limit);
    
    successResponse(res, result, 'Consultations retrieved successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

// Delete consultation
const deleteConsultation = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if user is authorized to delete this consultation
    const { authorized, consultation } = await validateConsultationAssignment(req.user, id);
    
    if (!authorized) {
      return failureResponse(res, 'Not authorized to delete this consultation', 403);
    }
    
    await consultationService.deleteConsultation(id);
    
    successResponse(res, null, 'Consultation deleted successfully');
  } catch (error) {
    if (error.message.includes('Consultation not found')) {
      return failureResponse(res, 'Consultation not found', 404);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

module.exports = {
  getAllConsultations,
  createConsultation,
  getConsultation,
  updateConsultationStatus,
  getConsultationsByUserId,
  getConsultationsByAdminId,
  deleteConsultation
};

