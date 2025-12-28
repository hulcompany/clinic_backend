const { reviewService } = require('../services');
const AppError = require('../utils/AppError');
const { successResponse, createdResponse, failureResponse } = require('../utils/responseHandler');
const { User } = require('../models');
const { hasPermission } = require('../config/roles');

// Helper function to validate admin/super_admin permissions
const validateAdminPermission = (user) => {
  return user.role === 'admin' || user.role === 'super_admin';
};

// Helper function to validate doctor/admin/super_admin permissions
const validateProfessionalPermission = (user) => {
  return user.role === 'doctor' || user.role === 'admin' || user.role === 'super_admin';
};

// Helper function to validate doctor/admin/super_admin/secretary with review permissions
const validateProfessionalOrReviewPermission = (user) => {
  if (user.role === 'doctor' || user.role === 'admin' || user.role === 'super_admin') {
    return true;
  }
  if (user.role === 'secretary' && hasPermission(user.role, 'manage_reviews_for_assigned_doctor')) {
    return true;
  }
  return false;
};

// Helper function to validate owner/doctor/admin/super_admin permissions
const validateOwnershipOrProfessionalPermission = (user, ownerId) => {
  return user.user_id === ownerId || user.role === 'doctor' || user.role === 'admin' || user.role === 'super_admin';
};

// Helper function to validate owner/doctor/admin/super_admin/secretary with review permissions
const validateOwnershipOrProfessionalOrReviewPermission = (user, ownerId) => {
  if (user.user_id === ownerId) return true;
  if (user.role === 'doctor' || user.role === 'admin' || user.role === 'super_admin') return true;
  if (user.role === 'secretary' && hasPermission(user.role, 'manage_reviews_for_assigned_doctor')) return true;
  return false;
};

/**
 * @desc    Get all reviews (public)
 * @route   GET /api/v1/reviews
 * @access  Public
 */
const getAllReviews = async (req, res, next) => {
  try {
    // Get pagination parameters from query, with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const includeInactive = req.query.includeInactive === 'true';
    
    const result = await reviewService.getAllReviews(page, limit, includeInactive);
    
    successResponse(res, result, 'Reviews retrieved successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Get review by ID (public)
 * @route   GET /api/v1/reviews/:id
 * @access  Public
 */
const getReviewById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const review = await reviewService.getReviewById(id);
    
    successResponse(res, review, 'Review retrieved successfully');
  } catch (error) {
    if (error.statusCode === 404) {
      return failureResponse(res, 'Review not found', 404);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Get reviews by user ID (public)
 * @route   GET /api/v1/reviews/user/:userId
 * @access  Public
 */
const getReviewsByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Get pagination parameters from query, with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const includeInactive = req.query.includeInactive === 'true';
    
    const result = await reviewService.getReviewsByUserId(userId, page, limit, includeInactive);
    
    successResponse(res, result, 'User reviews retrieved successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Create a new review
 * @route   POST /api/v1/reviews
 * @access  Private (Authenticated users)
 */
const createReview = async (req, res, next) => {
  try {
    const { rating, comment, user_id } = req.body;
    
    // Validate required fields
    if (!rating || !comment) {
      return failureResponse(res, 'Rating and comment are required', 400);
    }
    
    let targetUserId;
    
    // Check if user is trying to create a review for another user
    if (user_id) {
      // If admin, super_admin, or doctor, allow creating review for specified user
      if (req.user.role === 'admin' || req.user.role === 'super_admin' || req.user.role === 'doctor') {
        targetUserId = parseInt(user_id); // Use specified user ID
      } else if (req.user.role === 'secretary' && hasPermission(req.user.role, 'manage_reviews_for_assigned_doctor')) {
        // Secretaries with proper permission can create reviews for users of their assigned doctor
        targetUserId = parseInt(user_id);
      } else {
        // Non-admin users cannot create reviews for other users
        const specifiedUserId = parseInt(user_id);
        if (specifiedUserId !== req.user.user_id) {
          return failureResponse(res, 'Not authorized to create reviews for other users', 403);
        }
        // If user specifies their own ID, use it
        targetUserId = specifiedUserId;
      }
    } else {
      // If no user_id specified, default to authenticated user
      targetUserId = req.user.user_id;
    }
    
    // Validate that the target user exists
    const targetUser = await User.findByPk(targetUserId);
    if (!targetUser) {
      return failureResponse(res, 'Target user does not exist', 400);
    }
    
    // Additional check: if the authenticated user is not an admin/doctor/super_admin or secretary with proper permission,
    // they should only be able to create reviews for themselves
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && req.user.role !== 'doctor' && 
        !(req.user.role === 'secretary' && hasPermission(req.user.role, 'manage_reviews_for_assigned_doctor'))) {
      if (targetUserId !== req.user.user_id) {
        return failureResponse(res, 'Not authorized to create reviews for other users', 403);
      }
    }
    
    const reviewData = {
      rating,
      comment
    };
    
    const review = await reviewService.createReview(targetUserId, reviewData);
    
    createdResponse(res, review, 'Review created successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};
/**
 * @desc    Update review
 * @route   PUT /api/v1/reviews/:id
 * @access  Private (Owner/Doctor/Admin/Super Admin)
 */
const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    
    // First check if user has permission to update this review
    // Get the review to check ownership
    const review = await reviewService.getReviewById(id);
    if (!validateOwnershipOrProfessionalOrReviewPermission(req.user, review.user_id)) {
      return failureResponse(res, 'Not authorized to update this review', 403);
    }
    
    // Prepare update data
    const updateData = {};
    
    if (rating) {
      updateData.rating = rating;
    }
    
    if (comment) {
      updateData.comment = comment;
    }
    
    const updatedReview = await reviewService.updateReview(id, req.user.user_id, req.user.role, updateData);
    
    successResponse(res, updatedReview, 'Review updated successfully');
  } catch (error) {
    if (error.statusCode === 404) {
      return failureResponse(res, 'Review not found', 404);
    }
    if (error.statusCode === 403) {
      return failureResponse(res, error.message, 403);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Delete review (soft delete)
 * @route   DELETE /api/v1/reviews/:id
 * @access  Private (Owner/Doctor/Admin/Super Admin)
 */
const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // First check if user has permission to delete this review
    // Get the review to check ownership
    const review = await reviewService.getReviewById(id);
    if (!validateOwnershipOrProfessionalOrReviewPermission(req.user, review.user_id)) {
      return failureResponse(res, 'Not authorized to delete this review', 403);
    }
    
    await reviewService.deleteReview(id, req.user.user_id, req.user.role);
    
    successResponse(res, null, 'Review deleted successfully');
  } catch (error) {
    if (error.statusCode === 404) {
      return failureResponse(res, 'Review not found', 404);
    }
    if (error.statusCode === 403) {
      return failureResponse(res, error.message, 403);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Toggle review active status
 * @route   PUT /api/v1/reviews/:id/toggle-status
 * @access  Private (Owner/Doctor/Admin/Super Admin)
 */
const toggleReviewStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // First get the review to check ownership
    const review = await reviewService.getReviewById(id);
    
    // Check if user has permission to update review status
    // Allow owner, doctor, admin, super admin, or secretary with proper permission
    if (req.user.user_id !== review.user_id && !validateProfessionalOrReviewPermission(req.user)) {
      return failureResponse(res, 'Not authorized to update review status', 403);
    }
    
    const updatedReview = await reviewService.toggleReviewStatus(id, req.user.role);
    
    successResponse(res, updatedReview, 'Review status updated successfully');
  } catch (error) {
    if (error.statusCode === 404) {
      return failureResponse(res, 'Review not found', 404);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Get average rating
 * @route   GET /api/v1/reviews/average-rating
 * @access  Public
 */
const getAverageRating = async (req, res, next) => {
  try {
    const result = await reviewService.getAverageRating();
    
    successResponse(res, result, 'Average rating retrieved successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

module.exports = {
  getAllReviews,
  getReviewById,
  getReviewsByUserId,
  createReview,
  updateReview,
  deleteReview,
  toggleReviewStatus,
  getAverageRating
};