const { serviceService } = require('../services');
const AppError = require('../utils/AppError');
const { successResponse, createdResponse, failureResponse } = require('../utils/responseHandler');
const { uploadImage } = require('../utils/allMediaUploadUtil');

// Helper function to validate admin/doctor permissions
const validateAdminDoctorPermission = (user) => {
  return user.role === 'admin' || user.role === 'super_admin' || user.role === 'doctor';
};

 

/**
 * @desc    Get all services (public)
 * @route   GET /api/v1/services
 * @access  Public
 */
const getAllServices = async (req, res, next) => {
  try {
    // Get pagination parameters from query, with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await serviceService.getAllServices(page, limit);
    
    successResponse(res, result, 'Services retrieved successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Get service by ID (public)
 * @route   GET /api/v1/services/:id
 * @access  Public
 */
const getServiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const service = await serviceService.getServiceById(id);
    
    successResponse(res, service, 'Service retrieved successfully');
  } catch (error) {
    if (error.statusCode === 404) {
      return failureResponse(res, 'Service not found', 404);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Create a new service
 * @route   POST /api/v1/services
 * @access  Private (Admin/Doctor/Super Admin)
 */
const createService = async (req, res, next) => {
  try {
    // Check if user has permission to create services
    if (!validateAdminDoctorPermission(req.user)) {
      return failureResponse(res, 'Not authorized to create services', 403);
    }
    
    const { name, description } = req.body;
    
    // Validate required fields
    if (!name || !description) {
      return failureResponse(res, 'Name and description are required', 400);
    }
    
    // Handle image upload if provided
    let imageData = null;
    if (req.file) {
      imageData = req.file.filename;
    }
    
    // Create service data
    const serviceData = {
      name: typeof name === 'string' ? JSON.parse(name) : name,
      description: typeof description === 'string' ? JSON.parse(description) : description,
      image: imageData
    };
    
    const service = await serviceService.createService(serviceData);
    
    createdResponse(res, service, 'Service created successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Update service
 * @route   PUT /api/v1/services/:id
 * @access  Private (Admin/Doctor/Super Admin)
 */
const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if user has permission to update services
    if (!validateAdminDoctorPermission(req.user)) {
      return failureResponse(res, 'Not authorized to update services', 403);
    }
    
    const { name, description } = req.body;
    
    // Prepare update data
    const updateData = {};
    
    if (name) {
      updateData.name = typeof name === 'string' ? JSON.parse(name) : name;
    }
    
    if (description) {
      updateData.description = typeof description === 'string' ? JSON.parse(description) : description;
    }
    
    // Handle image upload if provided
    if (req.file) {
      updateData.image = req.file.filename;
    }
    
    const service = await serviceService.updateService(id, updateData);
    
    successResponse(res, service, 'Service updated successfully');
  } catch (error) {
    if (error.statusCode === 404) {
      return failureResponse(res, 'Service not found', 404);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Delete service
 * @route   DELETE /api/v1/services/:id
 * @access  Private (Admin/Doctor/Super Admin)
 */
const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if user has permission to delete services
    if (!validateAdminDoctorPermission(req.user)) {
      return failureResponse(res, 'Not authorized to delete services', 403);
    }
    
    await serviceService.deleteService(id);
    
    successResponse(res, null, 'Service deleted successfully');
  } catch (error) {
    if (error.statusCode === 404) {
      return failureResponse(res, 'Service not found', 404);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Toggle service active status
 * @route   PUT /api/v1/services/:id/toggle-status
 * @access  Private (Admin/Doctor/Super Admin)
 */
const toggleServiceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    console.log('Toggle service status request for ID:', id);
    console.log('User:', req.user);
    
    // Check if user has permission to update service status
    if (!validateAdminDoctorPermission(req.user)) {
      console.log('User not authorized to toggle service status');
      return failureResponse(res, 'Not authorized to update service status', 403);
    }
    
    console.log('Calling service to toggle status');
    const service = await serviceService.toggleServiceStatus(id);
    console.log('Service returned from service layer:', service ? service.toJSON() : null);
    
    successResponse(res, service, 'Service status updated successfully');
  } catch (error) {
    console.error('Error in toggleServiceStatus:', error);
    if (error.statusCode === 404) {
      return failureResponse(res, 'Service not found', 404);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

module.exports = {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  toggleServiceStatus
};