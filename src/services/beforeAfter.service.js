const beforeAfterRepository = require('../repositories/beforeAfter.repository');
const AppError = require('../utils/AppError');

class BeforeAfterService {
  // Get all before/after records (public)
  async getAllBeforeAfters(page = 1, limit = 10, filters = {}) {
   try {
    const result = await beforeAfterRepository.getAllBeforeAfters(page, limit, filters);
      return result;
    } catch (error) {
      throw new AppError('Failed to get before/after records: ' + error.message, 500);
    }
  }

  // Get before/after record by ID (public)
  async getBeforeAfterById(id) {
   try {
    const beforeAfter= await beforeAfterRepository.getBeforeAfterById(id);
      return beforeAfter;
    } catch (error) {
      throw new AppError('Failed to get before/after record: ' + error.message, 500);
    }
  }

  // Create a new before/after record (admin/doctor only)
  async createBeforeAfter(data) {
   try {
    const beforeAfter= await beforeAfterRepository.createBeforeAfter(data);
      return beforeAfter;
    } catch (error) {
      throw new AppError('Failed to create before/after record: ' + error.message, 500);
    }
  }

  // Update before/after record (admin/doctor only)
  async updateBeforeAfter(id, data) {
   try {
    const beforeAfter= await beforeAfterRepository.updateBeforeAfter(id, data);
      return beforeAfter;
    } catch (error) {
    if (error.message.includes('not found')) {
        throw new AppError('Before/after record not found', 404);
      }
      throw new AppError('Failed to update before/after record: ' + error.message, 500);
    }
  }

  // Delete before/after record (admin/doctor only)
  async deleteBeforeAfter(id) {
   try {
    const result = await beforeAfterRepository.deleteBeforeAfter(id);
      return result;
    } catch (error) {
    if (error.message.includes('not found')) {
        throw new AppError('Before/after record not found', 404);
      }
      throw new AppError('Failed to delete before/after record: ' + error.message, 500);
    }
  }

  // Toggle before/after record active status (admin/doctor only)
  async toggleBeforeAfterStatus(id) {
   try {
    const result = await beforeAfterRepository.toggleBeforeAfterStatus(id);
      return result;
    } catch (error) {
    if (error.message.includes('not found')) {
        throw new AppError('Before/after record not found', 404);
      }
      throw new AppError('Failed to toggle before/after status: ' + error.message, 500);
    }
  }
}

module.exports = new BeforeAfterService();
