const { Service } = require('../models');
const AppError = require('../utils/AppError');

class ServiceRepository {
  // Get all services with pagination
  async getAllServices(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      const { rows: services, count } = await Service.findAndCountAll({
        where: { is_active: true },
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });

      return {
        services,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalServices: count
      };
    } catch (error) {
      throw new AppError('Failed to fetch services: ' + error.message, 500);
    }
  }

  // Get service by ID
  async getServiceById(id) {
    try {
      const service = await Service.findByPk(id);
      if (!service) {
        throw new AppError('Service not found', 404);
      }
      return service;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch service: ' + error.message, 500);
    }
  }

  // Create a new service
  async createService(serviceData) {
    try {
      const service = await Service.create(serviceData);
      return service;
    } catch (error) {
      throw new AppError('Failed to create service: ' + error.message, 500);
    }
  }

  // Update service
  async updateService(id, updateData) {
    try {
      const service = await this.getServiceById(id);
      await service.update(updateData);
      return service;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update service: ' + error.message, 500);
    }
  }

  // Delete service (hard delete - actually remove from database)
  async deleteService(id) {
    try {
      const service = await this.getServiceById(id);
      
      // Clean up media file before deleting
      console.log('Cleaning up media for service:', service.toJSON());
      // Note: The actual cleanup is handled by the middleware, but we can add additional logging here
      
      // Actually delete the service from the database
      await service.destroy();
      return { message: 'Service deleted successfully' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete service: ' + error.message, 500);
    }
  }

  // Toggle service active status
  async toggleServiceStatus(id) {
    try {
      const service = await this.getServiceById(id);
      
      // Toggle the is_active status
      const newStatus = !service.is_active;
      
      await service.update({ is_active: newStatus });
      
      // Fetch the updated service to ensure we return the latest data
      const updatedService = await this.getServiceById(id);
      
      return updatedService;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to toggle service status: ' + error.message, 500);
    }
  }
}

module.exports = new ServiceRepository();