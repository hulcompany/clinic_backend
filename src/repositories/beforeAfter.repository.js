const { BeforeAfter, Service, User } = require('../models');
const AppError = require('../utils/AppError');

class BeforeAfterRepository {
  // Get all before/after records with pagination and filtering
  async getAllBeforeAfters(page = 1, limit = 10, filters = {}) {
    try {
     const offset = (page - 1) * limit;
     const where = { is_active: true };
      
      // Add service_id filter if provided
     if (filters.service_id) {
       where.service_id = filters.service_id;
      }
      
     const { rows: beforeAfters, count } = await BeforeAfter.findAndCountAll({
      where,
       include: [
         {
           model: Service,
       as: 'service',
      attributes: ['id', 'name', 'image']
         },
         {
           model: User,
       as: 'user',
      attributes: ['user_id', 'full_name', 'email']
         }
       ],
       limit,
       offset,
       order: [['sort_order', 'ASC'], ['createdAt', 'DESC']]
     });

      return {
        beforeAfters,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalRecords: count
      };
    } catch (error) {
      throw new AppError('Failed to fetch before/after records: ' + error.message, 500);
    }
  }

  // Get before/after record by ID
  async getBeforeAfterById(id) {
    try {
     const beforeAfter= await BeforeAfter.findByPk(id, {
       include: [
         {
           model: Service,
       as: 'service',
      attributes: ['id', 'name', 'image']
         },
         {
           model: User,
       as: 'user',
      attributes: ['user_id', 'full_name', 'email']
         }
       ]
     });
      
     if (!beforeAfter) {
        throw new AppError('Before/After record not found', 404);
      }
      
      return beforeAfter;
    } catch (error) {
     if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch before/after record: ' + error.message, 500);
    }
  }

  // Create a new before/after record
  async createBeforeAfter(beforeAfterData) {
    try {
     const beforeAfter= await BeforeAfter.create(beforeAfterData);
      return beforeAfter;
    } catch (error) {
      throw new AppError('Failed to create before/after record: ' + error.message, 500);
    }
  }

  // Update before/after record
  async updateBeforeAfter(id, updateData) {
    try {
     const beforeAfter= await this.getBeforeAfterById(id);
     await beforeAfter.update(updateData);
      return beforeAfter;
    } catch (error) {
     if (error instanceof AppError) throw error;
      throw new AppError('Failed to update before/after record: ' + error.message, 500);
    }
  }

  // Delete before/after record (hard delete)
  async deleteBeforeAfter(id) {
    try {
     const beforeAfter= await this.getBeforeAfterById(id);
      
      // Clean up media files before deleting
     console.log('Cleaning up media for before/after record:', beforeAfter.toJSON());
      // Note: The actual cleanup is handled by the middleware
      
      // Actually delete the record from the database
     await beforeAfter.destroy();
      return { message: 'Before/after record deleted successfully' };
    } catch (error) {
     if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete before/after record: ' + error.message, 500);
    }
  }

  // Toggle before/after record active status
  async toggleBeforeAfterStatus(id) {
    try {
     const beforeAfter= await this.getBeforeAfterById(id);
      
      // Toggle the is_active status
     const newStatus = !beforeAfter.is_active;
      
     await beforeAfter.update({ is_active: newStatus });
      
      // Fetch the updated record to ensure we return the latest data
     const updatedBeforeAfter= await this.getBeforeAfterById(id);
      
      return updatedBeforeAfter;
    } catch (error) {
     if (error instanceof AppError) throw error;
      throw new AppError('Failed to toggle before/after status: ' + error.message, 500);
    }
  }
}

module.exports = new BeforeAfterRepository();
