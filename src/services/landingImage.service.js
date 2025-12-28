const landingImageRepository = require('../repositories/landingImage.repository');
const AppError = require('../utils/AppError');


class LandingImageService {
  // Create a new landing image
  async createLandingImage(data) {
    try {
      const landingImage = await landingImageRepository.createLandingImage(data);
      return landingImage;
    } catch (error) {
      throw new AppError('Failed to create landing image: ' + error.message, 500);
    }
  }

    // Update landing image
  async updateLandingImage(id, data) {
    try {
    
      const landingImages = await landingImageRepository.updateLandingImage(id, data);
      
      return landingImages;
    } catch (error) {
      if (error.message.includes('Landing image not found')) {
        throw new AppError('Landing image not found', 404);
      }
      throw new AppError('Failed to update landing image: ' + error.message, 500);
    }
  }

    // Delete landing image
  async deleteLandingImage(id) {
    try {
      const result = await landingImageRepository.deleteLandingImage(id);
      return result;
    } catch (error) {
      if (error.message.includes('Landing image not found')) {
        throw new AppError('Landing image not found', 404);
      }
      throw new AppError('Failed to delete landing image: ' + error.message, 500);
    }
  }


  // Get landing image by ID
  async getLandingImageById(id) {
    try {
      const landingImage = await landingImageRepository.getLandingImageById(id);
      return landingImage;
    } catch (error) {
      throw new AppError('Failed to get landing image: ' + error.message, 500);
    }
  }
 

  // Get all landing images
  async getAllLandingImages() {
    try {
      const landingImages = await landingImageRepository.getAllLandingImages();
      return landingImages;
    } catch (error) {
      throw new AppError('Failed to get landing images: ' + error.message, 500);
    }
  }


  // Get landing images by section
  async getLandingImagesBySection(section) {
    try {
      const landingImages = await landingImageRepository.getLandingImagesBySection(section);
      return landingImages;
    } catch (error) {
      throw new AppError('Failed to get landing images by section: ' + error.message, 500);
    }
  }







  

  // Toggle landing image active status
  async toggleLandingImageStatus(id) {
    try {
      const landingImage = await landingImageRepository.toggleLandingImageStatus(id);
      return landingImage;
    } catch (error) {
      if (error.message.includes('Landing image not found')) {
        throw new AppError('Landing image not found', 404);
      }
      throw new AppError('Failed to update landing image status: ' + error.message, 500);
    }
  }

    
}

module.exports = new LandingImageService();