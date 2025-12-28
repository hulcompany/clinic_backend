const { LandingImage } = require('../models');
const AppError = require('../utils/AppError');

class LandingImageRepository {
  // Create a new landing image
  async createLandingImage(landingImageData) {
    try {
      const landingImage = await LandingImage.create(landingImageData);
      return landingImage;
    } catch (error) {
      throw new AppError('Failed to create landing image: ' + error.message, 500);
    }
  }

  // Get landing image by ID
  async getLandingImageById(id) {
    try {
      const landingImage = await LandingImage.findByPk(id);
      if (!landingImage) {
        throw new AppError('Landing image not found', 404);
      }
      return landingImage;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch landing image: ' + error.message, 500);
    }
  }

  // Get all active landing images
  async getAllLandingImages() {
    try {
      const landingImages = await LandingImage.findAll({
        where: {
          is_active: true
        },
        order: [
          ['section', 'ASC'],
          ['display_order', 'ASC']
        ]
      });
      return landingImages;
    } catch (error) {
      throw new AppError('Failed to fetch landing images: ' + error.message, 500);
    }
  }

  // Get landing images by section
  async getLandingImagesBySection(section) {
    try {
      const landingImages = await LandingImage.findAll({
        where: {
          section,
          is_active: true
        },
        order: [
          ['display_order', 'ASC']
        ]
      });
      return landingImages;
    } catch (error) {
      throw new AppError('Failed to fetch landing images by section: ' + error.message, 500);
    }
  }

  // Update landing image
  async updateLandingImage(id, updateData) {
    try {
      const landingImage = await this.getLandingImageById(id);
      await landingImage.update(updateData);
      return landingImage;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update landing image: ' + error.message, 500);
    }
  }

  // Delete landing image (hard delete - actually remove from database)
  async deleteLandingImage(id) {
    try {
      const landingImage = await this.getLandingImageById(id);
      
      // Clean up media file before deleting
      console.log('Cleaning up media for landing image:', landingImage.toJSON());
      // Note: The actual cleanup is handled by the middleware, but we can add additional logging here
      
      // Actually delete the landing image from the database
      await landingImage.destroy();
      return { message: 'Landing image deleted successfully' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete landing image: ' + error.message, 500);
    }
  }

  // Toggle landing image active status
  async toggleLandingImageStatus(id) {
    try {
      const landingImage = await this.getLandingImageById(id);
      
      // Toggle the is_active status
      const newStatus = !landingImage.is_active;
      
      await landingImage.update({ is_active: newStatus });
      
      // Fetch the updated landing image to ensure we return the latest data
      const updatedLandingImage = await this.getLandingImageById(id);
      
      return updatedLandingImage;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to toggle landing image status: ' + error.message, 500);
    }
  }

  
}

module.exports = new LandingImageRepository();