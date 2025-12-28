const { contactUsService } = require('../services');
const AppError = require('../utils/AppError');
const { successResponse, createdResponse, failureResponse } = require('../utils/responseHandler');
const { uploadImage } = require('../utils/allMediaUploadUtil');

// Helper function to validate admin/doctor permissions
const validateAdminDoctorPermission = (user) => {
  return user.role === 'admin' || user.role === 'super_admin' || user.role === 'doctor';
};

// Helper function to validate super admin permissions
const validateSuperAdminPermission = (user) => {
  return user.role === 'super_admin';
};

/**
 * @desc    Get contact information (public)
 * @route   GET /api/v1/contact-us
 * @access  Public
 */
const getContactInfo = async (req, res, next) => {
  try {
    const contactInfo = await contactUsService.getContactInfo();
    
    successResponse(res, contactInfo, 'Contact information retrieved successfully');
  } catch (error) {
    if (error.statusCode === 404) {
      return failureResponse(res, 'Contact information not found', 404);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Get all contact records (admin only)
 * @route   GET /api/v1/contact-us/all
 * @access  Private (Super Admin)
 */
const getAllContactRecords = async (req, res, next) => {
  try {
    // Only super admins can view all contact records
    if (!validateSuperAdminPermission(req.user)) {
      return failureResponse(res, 'Not authorized to view all contact records', 403);
    }
    
    // Get pagination parameters from query, with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await contactUsService.getAllContactRecords(page, limit);
    
    successResponse(res, result, 'Contact records retrieved successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Get contact info by ID (admin only)
 * @route   GET /api/v1/contact-us/:id
 * @access  Private (Super Admin)
 */
const getContactInfoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Only super admins can view specific contact records
    if (!validateSuperAdminPermission(req.user)) {
      return failureResponse(res, 'Not authorized to view this contact record', 403);
    }
    
    const contactInfo = await contactUsService.getContactInfoById(id);
    
    successResponse(res, contactInfo, 'Contact information retrieved successfully');
  } catch (error) {
    if (error.statusCode === 404) {
      return failureResponse(res, 'Contact information not found', 404);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Create new contact information
 * @route   POST /api/v1/contact-us
 * @access  Private (Admin/Doctor/Super Admin)
 */
const createContactInfo = async (req, res, next) => {
  try {
    // Check if user has permission to create contact information
    if (!validateAdminDoctorPermission(req.user)) {
      return failureResponse(res, 'Not authorized to create contact information', 403);
    }
    
    const { phone_numbers, social_media, email, address } = req.body;
    
    // Validate required fields
    if (!phone_numbers || !social_media || !email) {
      return failureResponse(res, 'Phone numbers, social media, and email are required', 400);
    }
    
    // Handle image upload if provided
    let imageData = null;
    if (req.file) {
      imageData = req.file.filename;
    }
    
    // Create contact data
    const contactData = {
      phone_numbers: typeof phone_numbers === 'string' ? JSON.parse(phone_numbers) : phone_numbers,
      social_media: typeof social_media === 'string' ? JSON.parse(social_media) : social_media,
      email,
      address: typeof address === 'string' ? JSON.parse(address) : address,
      image: imageData
    };
    
    const contactInfo = await contactUsService.createContactInfo(contactData);
    
    createdResponse(res, contactInfo, 'Contact information created successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Update contact information
 * @route   PUT /api/v1/contact-us/:id
 * @access  Private (Admin/Doctor/Super Admin)
 */
const updateContactInfo = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if user has permission to update contact information
    if (!validateAdminDoctorPermission(req.user)) {
      return failureResponse(res, 'Not authorized to update contact information', 403);
    }
    
    const { phone_numbers, social_media, email, address } = req.body;
    
    // Prepare update data
    const updateData = {};
    
    if (phone_numbers) {
      updateData.phone_numbers = typeof phone_numbers === 'string' ? JSON.parse(phone_numbers) : phone_numbers;
    }
    
    if (social_media) {
      updateData.social_media = typeof social_media === 'string' ? JSON.parse(social_media) : social_media;
    }
    
    if (email) {
      updateData.email = email;
    }
    
    if (address) {
      updateData.address = typeof address === 'string' ? JSON.parse(address) : address;
    }
    
    // Handle image upload if provided
    if (req.file) {
      updateData.image = req.file.filename;
    }
    
    const contactInfo = await contactUsService.updateContactInfo(id, updateData);
    
    successResponse(res, contactInfo, 'Contact information updated successfully');
  } catch (error) {
    if (error.statusCode === 404) {
      return failureResponse(res, 'Contact information not found', 404);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Delete contact information
 * @route   DELETE /api/v1/contact-us/:id
 * @access  Private (Admin/Doctor/Super Admin)
 */
const deleteContactInfo = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if user has permission to delete contact information
    if (!validateAdminDoctorPermission(req.user)) {
      return failureResponse(res, 'Not authorized to delete contact information', 403);
    }
    
    await contactUsService.deleteContactInfo(id);
    
    successResponse(res, null, 'Contact information deleted successfully');
  } catch (error) {
    if (error.statusCode === 404) {
      return failureResponse(res, 'Contact information not found', 404);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Toggle contact information active status
 * @route   PUT /api/v1/contact-us/:id/toggle-status
 * @access  Private (Admin/Doctor/Super Admin)
 */
const toggleContactStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if user has permission to update contact status
    if (!validateAdminDoctorPermission(req.user)) {
      return failureResponse(res, 'Not authorized to update contact status', 403);
    }
    
    const contactInfo = await contactUsService.toggleContactStatus(id);
    
    successResponse(res, contactInfo, 'Contact status updated successfully');
  } catch (error) {
    if (error.statusCode === 404) {
      return failureResponse(res, 'Contact information not found', 404);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

module.exports = {
  getContactInfo,
  getAllContactRecords,
  getContactInfoById,
  createContactInfo,
  updateContactInfo,
  deleteContactInfo,
  toggleContactStatus
};