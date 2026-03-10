const { beforeAfterService } = require('../services');
const AppError = require('../utils/AppError');
const { successResponse, createdResponse, failureResponse } = require('../utils/responseHandler');

// Helper function to validate admin/doctor permissions
const validateAdminDoctorPermission= (user) => {
  return user.role === 'admin' || user.role === 'super_admin' || user.role === 'doctor';
};

/**
 * @desc    Get all before/after records (public)
 * @route   GET /api/v1/before-after
 * @access  Public
 */
const getAllBeforeAfters = async (req, res, next) => {
  try {
    // Get pagination parameters from query, with defaults
   const page = parseInt(req.query.page) || 1;
   const limit = parseInt(req.query.limit) || 10;
   const filters = {};
    
    // Add service_id filter if provided
   if (req.query.service_id) {
      filters.service_id = req.query.service_id;
    }
    
   const result = await beforeAfterService.getAllBeforeAfters(page, limit, filters);
    
    successResponse(res, result, 'Before/after records retrieved successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Get before/after record by ID (public)
 * @route   GET /api/v1/before-after/:id
 * @access  Public
 */
const getBeforeAfterById = async (req, res, next) => {
  try {
   const { id } = req.params;
    
   const beforeAfter= await beforeAfterService.getBeforeAfterById(id);
    
    successResponse(res, beforeAfter, 'Before/after record retrieved successfully');
  } catch (error) {
   if (error.statusCode === 404) {
      return failureResponse(res, 'Before/after record not found', 404);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Create a new before/after record
 * @route   POST /api/v1/before-after
 * @access  Private(Admin/Doctor/Super Admin)
 */
const createBeforeAfter= async (req, res, next) => {
  try {
    // Check if user has permission to create before/after records
   if (!validateAdminDoctorPermission(req.user)) {
      return failureResponse(res, 'Not authorized to create before/after records', 403);
    }
    
   const { title, description, service_id } = req.body;
    
    // Validate required fields
   if (!title) {
      return failureResponse(res, 'Title is required', 400);
    }
    
    // Handle image uploads
   let beforeImageData = null;
   let afterImageData = null;
    
   if (req.files && req.files.before_image) {
      beforeImageData = req.files.before_image[0].filename;
    }
    
   if (req.files && req.files.after_image) {
      afterImageData = req.files.after_image[0].filename;
    }
    
    // Create before/after data
 const beforeAfterData = {
  title,
  description: description || null,
      before_image: beforeImageData,
      after_image: afterImageData,
      service_id: service_id || null,
      user_id: null, // Set to null as foreign key constraint requires valid user_id from users table
      is_active: true,
      sort_order: 0
    };
    
   const beforeAfter= await beforeAfterService.createBeforeAfter(beforeAfterData);
    
   createdResponse(res, beforeAfter, 'Before/after record created successfully');
  } catch (error) {
   if (error instanceof SyntaxError) {
      return failureResponse(res, 'Invalid JSON format for name or description', 400);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Update before/after record
 * @route   PUT /api/v1/before-after/:id
 * @access  Private(Admin/Doctor/Super Admin)
 */
const updateBeforeAfter= async (req, res, next) => {
  try {
    // Check if user has permission to update before/after records
   if (!validateAdminDoctorPermission(req.user)) {
      return failureResponse(res, 'Not authorized to update before/after records', 403);
    }
    
   const { id } = req.params;
   const { title, description, service_id } = req.body;
    
    // Get existing record to preserve images if not provided
   const existingRecord = await beforeAfterService.getBeforeAfterById(id);
    
    // Handle image uploads (preserve existing if not uploaded)
   let beforeImageData = existingRecord.before_image;
   let afterImageData = existingRecord.after_image;
    
   if (req.files && req.files.before_image) {
      beforeImageData = req.files.before_image[0].filename;
    }
    
   if (req.files && req.files.after_image) {
      afterImageData = req.files.after_image[0].filename;
    }
    
    // Update data
   const updateData = {
      title: title || existingRecord.title,
      description: description !== undefined ? description: existingRecord.description,
      before_image: beforeImageData,
      after_image: afterImageData,
      service_id: service_id !== undefined ? service_id: existingRecord.service_id
    };
    
   const beforeAfter= await beforeAfterService.updateBeforeAfter(id, updateData);
    
    successResponse(res, beforeAfter, 'Before/after record updated successfully');
  } catch (error) {
   if (error.message.includes('not found')) {
      return failureResponse(res, 'Before/after record not found', 404);
    }
   if (error instanceof SyntaxError) {
      return failureResponse(res, 'Invalid JSON format', 400);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Delete before/after record
 * @route   DELETE /api/v1/before-after/:id
 * @access  Private(Admin/Doctor/Super Admin)
 */
const deleteBeforeAfter= async (req, res, next) => {
  try {
    // Check if user has permission to delete before/after records
   if (!validateAdminDoctorPermission(req.user)) {
      return failureResponse(res, 'Not authorized to delete before/after records', 403);
    }
    
   const { id } = req.params;
    
   await beforeAfterService.deleteBeforeAfter(id);
    
    successResponse(res, null, 'Before/after record deleted successfully');
  } catch (error) {
   if (error.message.includes('not found')) {
      return failureResponse(res, 'Before/after record not found', 404);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Toggle before/after record active status
 * @route   PUT /api/v1/before-after/:id/toggle-status
 * @access  Private (Admin/Doctor/Super Admin)
 */
const toggleBeforeAfterStatus = async (req, res, next) => {
  try {
    // Check if user has permission to toggle status
   if (!validateAdminDoctorPermission(req.user)) {
      return failureResponse(res, 'Not authorized to toggle before/after status', 403);
    }
    
   const { id } = req.params;
    
   const beforeAfter= await beforeAfterService.toggleBeforeAfterStatus(id);
    
    successResponse(res, beforeAfter, 'Before/after status toggled successfully');
  } catch (error) {
   if (error.message.includes('not found')) {
      return failureResponse(res, 'Before/after record not found', 404);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

module.exports = {
  getAllBeforeAfters,
  getBeforeAfterById,
  createBeforeAfter,
  updateBeforeAfter,
  deleteBeforeAfter,
  toggleBeforeAfterStatus
};
