const { Review, User } = require('../models');
const AppError = require('../utils/AppError');

class ReviewRepository {
  // Get all reviews with pagination
  async getAllReviews(page = 1, limit = 10, includeInactive = false) {
    try {
      const offset = (page - 1) * limit;
      
      // Build where clause based on includeInactive flag
      const whereClause = includeInactive ? {} : { is_active: true };
      
      const { rows: reviews, count } = await Review.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        include: [{
          model: User,
          attributes: ['user_id', 'full_name', 'email', 'phone', 'image']
        }]
      });

      return {
        reviews,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalReviews: count
      };
    } catch (error) {
      throw new AppError('Failed to fetch reviews: ' + error.message, 500);
    }
  }

  // Get review by ID
  async getReviewById(id) {
    try {
      const review = await Review.findByPk(id, {
        include: [{
          model: User,
          attributes: ['user_id', 'full_name', 'email', 'phone', 'image']
        }]
      });
      
      if (!review) {
        throw new AppError('Review not found', 404);
      }
      
      return review;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch review: ' + error.message, 500);
    }
  }

  // Get reviews by user ID
  async getReviewsByUserId(userId, page = 1, limit = 10, includeInactive = false) {
    try {
      const offset = (page - 1) * limit;
      
      // Build where clause based on includeInactive flag
      const whereClause = includeInactive ? { user_id: userId } : { user_id: userId, is_active: true };
      
      const { rows: reviews, count } = await Review.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });

      return {
        reviews,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalReviews: count
      };
    } catch (error) {
      throw new AppError('Failed to fetch user reviews: ' + error.message, 500);
    }
  }

  // Create a new review
  async createReview(reviewData) {
    try {
      const review = await Review.create(reviewData);
      
      // Return the review with user information
      return await this.getReviewById(review.id);
    } catch (error) {
      throw new AppError('Failed to create review: ' + error.message, 500);
    }
  }

  // Update review
  async updateReview(id, updateData) {
    try {
      const review = await this.getReviewById(id);
      await review.update(updateData);
      
      // Return the updated review with user information
      return await this.getReviewById(review.id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update review: ' + error.message, 500);
    }
  }

  // Permanently delete review from database (hard delete)
  async permanentDeleteReview(id) {
    try {
      const review = await this.getReviewById(id);
      
      // Hard delete (permanent removal from database)
      await review.destroy();
      
      return { message: 'Review permanently deleted from database' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete review: ' + error.message, 500);
    }
  }

  // Soft delete review (set is_active to false)
  async softDeleteReview(id) {
    try {
      const review = await this.getReviewById(id);
      
      // Soft delete by setting is_active to false
      await review.update({ is_active: false });
      
      // Return the updated review
      return await this.getReviewById(review.id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete review: ' + error.message, 500);
    }
  }

  // Toggle review active status
  async toggleReviewStatus(id) {
    try {
      const review = await this.getReviewById(id);
      
      // Toggle the is_active status
      const newStatus = !review.is_active;
      await review.update({ is_active: newStatus });
      
      // Return the updated review
      return await this.getReviewById(review.id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to toggle review status: ' + error.message, 500);
    }
  }

  // Get average rating
  async getAverageRating() {
    try {
      const result = await Review.findOne({
        where: { is_active: true },
        attributes: [
          [Review.sequelize.fn('AVG', Review.sequelize.col('rating')), 'averageRating'],
          [Review.sequelize.fn('COUNT', Review.sequelize.col('id')), 'totalReviews']
        ]
      });
      
      // Handle case when no reviews exist
      if (!result) {
        return {
          averageRating: 0,
          totalReviews: 0
        };
      }
      
      return {
        averageRating: parseFloat(result.dataValues.averageRating) || 0,
        totalReviews: parseInt(result.dataValues.totalReviews) || 0
      };
    } catch (error) {
      throw new AppError('Failed to calculate average rating: ' + error.message, 500);
    }
  }
}

module.exports = new ReviewRepository();