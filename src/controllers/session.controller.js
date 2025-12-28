const { sessionService } = require('../services/index');
const AppError = require('../utils/AppError');
const { successResponse, createdResponse, failureResponse } = require('../utils/responseHandler');

// Helper function to validate admin/doctor permissions
const validateAdminDoctorPermission = (user) => {
  return user.role === 'admin' || user.role === 'super_admin' || user.role === 'doctor';
};

// Helper function to validate super admin permissions
const validateSuperAdminPermission = (user) => {
  return user.role === 'super_admin';
};

/**
 * @desc    Get all sessions
 * @route   GET /api/v1/sessions
 * @access  Private (Super Admin)
 */
const getAllSessions = async (req, res, next) => {
  try {
    // Only super admins can view all sessions
    if (!validateSuperAdminPermission(req.user)) {
      return failureResponse(res, 'Not authorized to view all sessions', 403);
    }
    
    // Get pagination parameters from query, with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const result = await sessionService.getAllSessions(page, limit);
    
    successResponse(res, result, 'Sessions retrieved successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Get session by ID
 * @route   GET /api/v1/sessions/:id
 * @access  Private (Admin/Doctor/Super Admin)
 */
const getSessionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if user has permission to view this session
    if (!validateAdminDoctorPermission(req.user)) {
      return failureResponse(res, 'Not authorized to view this session', 403);
    }
    
    const session = await sessionService.getSessionById(id);
    
    // Doctors can only view their own sessions
    if (req.user.role === 'doctor' && session.doctor_id !== req.user.user_id) {
      return failureResponse(res, 'Not authorized to view this session', 403);
    }
    
    successResponse(res, session, 'Session retrieved successfully');
  } catch (error) {
    if (error.statusCode === 404) {
      return failureResponse(res, 'Session not found', 404);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Get sessions by doctor ID
 * @route   GET /api/v1/sessions/doctor/:doctor_id
 * @access  Private (Admin/Doctor/Super Admin)
 */
const getSessionsByDoctorId = async (req, res, next) => {
  try {
    const { doctor_id } = req.params;
    
    // Check if user has permission to view these sessions
    if (!validateAdminDoctorPermission(req.user)) {
      return failureResponse(res, 'Not authorized to view these sessions', 403);
    }
    
    // Doctors can only view their own sessions
    if (req.user.role === 'doctor' && parseInt(doctor_id) !== req.user.user_id) {
      return failureResponse(res, 'Not authorized to view these sessions', 403);
    }
    
    // Get pagination parameters from query, with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const result = await sessionService.getSessionsByDoctorId(doctor_id, page, limit);
    
    successResponse(res, result, 'Sessions retrieved successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Create a new session
 * @route   POST /api/v1/sessions
 * @access  Private (Doctor/Admin/Super Admin)
 */
const createSession = async (req, res, next) => {
  try {
    // Check if user has permission to create sessions
    if (!validateAdminDoctorPermission(req.user)) {
      return failureResponse(res, 'Not authorized to create sessions', 403);
    }
    
    const { link, link_type, doctor_id } = req.body;
    
    // Validate required fields
    if (!link || !link_type) {
      return failureResponse(res, 'Link and link_type are required', 400);
    }
    
    // Doctors can only create sessions for themselves
    let targetDoctorId = doctor_id;
    if (req.user.role === 'doctor') {
      targetDoctorId = req.user.user_id;
      // If doctor_id was provided and doesn't match their ID, reject
      if (doctor_id && parseInt(doctor_id) !== req.user.user_id) {
        return failureResponse(res, 'Doctors can only create sessions for themselves', 403);
      }
    }
    
    // Create session
    const sessionData = {
      doctor_id: targetDoctorId,
      link,
      link_type
    };
    
    const session = await sessionService.createSession(sessionData);
    
    createdResponse(res, session, 'Session created successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Update session
 * @route   PUT /api/v1/sessions/:id
 * @access  Private (Doctor/Admin/Super Admin)
 */
const updateSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { link, link_type } = req.body;
    
    // Check if user has permission to update sessions
    if (!validateAdminDoctorPermission(req.user)) {
      return failureResponse(res, 'Not authorized to update sessions', 403);
    }
    
    // Get the existing session to check ownership
    const existingSession = await sessionService.getSessionById(id);
    
    // Doctors can only update their own sessions
    if (req.user.role === 'doctor' && existingSession.doctor_id !== req.user.user_id) {
      return failureResponse(res, 'Not authorized to update this session', 403);
    }
    
    // Prepare update data
    const updateData = {};
    if (link) updateData.link = link;
    if (link_type) updateData.link_type = link_type;
    
    const session = await sessionService.updateSession(id, updateData);
    
    successResponse(res, session, 'Session updated successfully');
  } catch (error) {
    if (error.statusCode === 404) {
      return failureResponse(res, 'Session not found', 404);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Delete session
 * @route   DELETE /api/v1/sessions/:id
 * @access  Private (Doctor/Admin/Super Admin)
 */
const deleteSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if user has permission to delete sessions
    if (!validateAdminDoctorPermission(req.user)) {
      return failureResponse(res, 'Not authorized to delete sessions', 403);
    }
    
    // Get the existing session to check ownership
    const existingSession = await sessionService.getSessionById(id);
    
    // Doctors can only delete their own sessions
    if (req.user.role === 'doctor' && existingSession.doctor_id !== req.user.user_id) {
      return failureResponse(res, 'Not authorized to delete this session', 403);
    }
    
    await sessionService.deleteSession(id);
    
    successResponse(res, null, 'Session deleted successfully');
  } catch (error) {
    if (error.statusCode === 404) {
      return failureResponse(res, 'Session not found', 404);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Toggle session active status
 * @route   PUT /api/v1/sessions/:id/toggle-status
 * @access  Private (Doctor/Admin/Super Admin)
 */
const toggleSessionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if user has permission to update session status
    if (!validateAdminDoctorPermission(req.user)) {
      return failureResponse(res, 'Not authorized to update session status', 403);
    }
    
    // Get the existing session to check ownership
    const existingSession = await sessionService.getSessionById(id);
    
    // Doctors can only update their own sessions
    if (req.user.role === 'doctor' && existingSession.doctor_id !== req.user.user_id) {
      return failureResponse(res, 'Not authorized to update this session', 403);
    }
    
    const session = await sessionService.toggleSessionStatus(id);
    
    successResponse(res, session, 'Session status updated successfully');
  } catch (error) {
    if (error.statusCode === 404) {
      return failureResponse(res, 'Session not found', 404);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

module.exports = {
  getAllSessions,
  getSessionById,
  getSessionsByDoctorId,
  createSession,
  updateSession,
  deleteSession,
  toggleSessionStatus
};