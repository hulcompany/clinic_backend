const landingImageService = require('../services/landingImage.service');
const AppError = require('../utils/AppError');
const { successResponse, createdResponse, failureResponse } = require('../utils/responseHandler');

// Helper function to validate admin/doctor permissions
const validateAdminDoctorPermission = (user) => {
  return user.role === 'admin' || user.role === 'super_admin' || user.role === 'doctor';
};

const createLandingImage = async (req, res, next) => {
  try {
    // Check if user has permission to create landing images
    if (!validateAdminDoctorPermission(req.user)) {
      return failureResponse(res, 'Not authorized to create landing images', 403);
    }
    
    const { section, display_order, is_active } = req.body;
    
    // Validate required fields
    if (!req.file || !section) {
      return failureResponse(res, 'Image file and section are required', 400);
    }
    
    // Handle image upload if provided
    let imageData = null;
    if (req.file) {
      imageData = req.file.filename;
    }
    
    // Create landing image data
    const landingImageData = {
      image: imageData,
      section,
      display_order: display_order || 0,
      is_active: is_active !== undefined ? is_active : true
    };
    
    const landingImage = await landingImageService.createLandingImage(landingImageData);
    
    createdResponse(res, landingImage, 'Landing image created successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

const getAllLandingImages = async (req, res, next) => {
  try {
    const landingImages = await landingImageService.getAllLandingImages();
    successResponse(res, landingImages, 'Landing images retrieved successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

const getLandingImagesBySection = async (req, res, next) => {
  try {
    const { section } = req.params;
    const landingImages = await landingImageService.getLandingImagesBySection(section);
    successResponse(res, landingImages, `Landing images for section ${section} retrieved successfully`);
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

const getLandingImageById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const landingImage = await landingImageService.getLandingImageById(id);
    
    successResponse(res, landingImage, 'Landing image retrieved successfully');
  } catch (error) {
    if (error.statusCode === 404) {
      return failureResponse(res, 'Landing image not found', 404);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

const updateLandingImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if user has permission to update landing images
    if (!validateAdminDoctorPermission(req.user)) {
      return failureResponse(res, 'Not authorized to update landing images', 403);
    }
    
    const { section, display_order, is_active } = req.body;
    
    // Prepare update data
    const updateData = {};
    
    if (section) {
      updateData.section = section;
    }
    
    if (display_order !== undefined) {
      updateData.display_order = display_order;
    }
    
    if (is_active !== undefined) {
      updateData.is_active = is_active;
    }
    
    // Handle image upload if provided
    if (req.file) {
      updateData.image = req.file.filename;
    }
    
    const landingImage = await landingImageService.updateLandingImage(id, updateData);
    
    successResponse(res, landingImage, 'Landing image updated successfully');
  } catch (error) {
    if (error.statusCode === 404) {
      return failureResponse(res, 'Landing image not found', 404);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

const deleteLandingImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if user has permission to delete landing images
    if (!validateAdminDoctorPermission(req.user)) {
      return failureResponse(res, 'Not authorized to delete landing images', 403);
    }
    
    await landingImageService.deleteLandingImage(id);
    
    successResponse(res, null, 'Landing image deleted successfully');
  } catch (error) {
    if (error.statusCode === 404) {
      return failureResponse(res, 'Landing image not found', 404);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};
 

const toggleLandingImageStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if user has permission to update landing image status
    if (!validateAdminDoctorPermission(req.user)) {
      return failureResponse(res, 'Not authorized to update landing image status', 403);
    }
    
    const landingImage = await landingImageService.toggleLandingImageStatus(id);
    
    successResponse(res, landingImage, 'Landing image status updated successfully');
  } catch (error) {
    if (error.statusCode === 404) {
      return failureResponse(res, 'Landing image not found', 404);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

module.exports = {
  createLandingImage,
  getAllLandingImages,
  getLandingImagesBySection,
  getLandingImageById,
  updateLandingImage,
  deleteLandingImage,
  toggleLandingImageStatus
};