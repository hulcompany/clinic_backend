const reviewRepository = require('../repositories/review.repository');
const AppError = require('../utils/AppError');

class ReviewService {
  // Get all reviews (public)
  async getAllReviews(page = 1, limit = 10, includeInactive = false) {
    try {
      const result = await reviewRepository.getAllReviews(page, limit, includeInactive);
      return result;
    } catch (error) {
      throw new AppError('Failed to get reviews: ' + error.message, 500);
    }
  }

  // Get review by ID (public)
  async getReviewById(id) {
    try {
      const review = await reviewRepository.getReviewById(id);
      return review;
    } catch (error) {
      throw new AppError('Failed to get review: ' + error.message, 500);
    }
  }

  // Get reviews by user ID (public)
  async getReviewsByUserId(userId, page = 1, limit = 10, includeInactive = false) {
    try {
      const result = await reviewRepository.getReviewsByUserId(userId, page, limit, includeInactive);
      return result;
    } catch (error) {
      throw new AppError('Failed to get user reviews: ' + error.message, 500);
    }
  }

  // Create a new review (authenticated users only)
  async createReview(userId, data) {
    try {
      // Validate rating
      if (!data.rating || data.rating < 1 || data.rating > 5) {
        throw new AppError('Rating must be between 1 and 5', 400);
      }

      // Validate comment
      if (!data.comment) {
        throw new AppError('Comment is required', 400);
      }

      const reviewData = {
        user_id: userId,
        rating: data.rating,
        comment: data.comment
      };

      const review = await reviewRepository.createReview(reviewData);
      return review;
    } catch (error) {
      if (error.message.includes('Review not found')) {
        throw new AppError('Review not found', 404);
      }
      throw new AppError('Failed to create review: ' + error.message, 500);
    }
  }

  // Update review (permission checking moved to controller)
  async updateReview(id, userId, userRole, data) {
    try {
      // First get the review to check ownership
      const review = await reviewRepository.getReviewById(id);
      
      // Validate rating if provided
      if (data.rating && (data.rating < 1 || data.rating > 5)) {
        throw new AppError('Rating must be between 1 and 5', 400);
      }

      // Prepare update data
      const updateData = {};
      
      if (data.rating) {
        updateData.rating = data.rating;
      }
      
      if (data.comment) {
        updateData.comment = data.comment;
      }

      const updatedReview = await reviewRepository.updateReview(id, updateData);
      return updatedReview;
    } catch (error) {
      if (error.message.includes('Review not found')) {
        throw new AppError('Review not found', 404);
      }
      throw new AppError('Failed to update review: ' + error.message, 500);
    }
  }

  // Delete review (permission checking moved to controller)
  async deleteReview(id, userId, userRole) {
    try {
      // Determine delete method based on user role
      if (userRole === 'admin' || userRole === 'super_admin' || userRole === 'doctor') {
        // Hard delete (permanent removal from database) for admins, super admins, and doctors
        const result = await reviewRepository.permanentDeleteReview(id);
        return result;
      } else {
        // Soft delete by setting is_active to false for regular users
        const result = await reviewRepository.softDeleteReview(id);
        return result;
      }
    } catch (error) {
      if (error.message.includes('Review not found')) {
        throw new AppError('Review not found', 404);
      }
      throw new AppError('Failed to delete review: ' + error.message, 500);
    }
  }

  // Toggle review active status (permission checking moved to controller)
  async toggleReviewStatus(id, userRole) {
    try {
      const review = await reviewRepository.toggleReviewStatus(id);
      return review;
    } catch (error) {
      if (error.message.includes('Review not found')) {
        throw new AppError('Review not found', 404);
      }
      throw new AppError('Failed to update review status: ' + error.message, 500);
    }
  }

  // Get average rating
  async getAverageRating() {
    try {
      const result = await reviewRepository.getAverageRating();
      return result;
    } catch (error) {
      throw new AppError('Failed to get average rating: ' + error.message, 500);
    }
  }
}

module.exports = new ReviewService();