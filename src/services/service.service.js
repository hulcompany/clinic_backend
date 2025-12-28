const serviceRepository = require('../repositories/service.repository');
const AppError = require('../utils/AppError');

class ServiceService {
  // Get all services (public)
  async getAllServices(page = 1, limit = 10) {
    try {
      const result = await serviceRepository.getAllServices(page, limit);
      return result;
    } catch (error) {
      throw new AppError('Failed to get services: ' + error.message, 500);
    }
  }

  // Get service by ID (public)
  async getServiceById(id) {
    try {
      const service = await serviceRepository.getServiceById(id);
      return service;
    } catch (error) {
      throw new AppError('Failed to get service: ' + error.message, 500);
    }
  }

  // Create a new service (admin/doctor only)
  async createService(data) {
    try {
      const service = await serviceRepository.createService(data);
      return service;
    } catch (error) {
      throw new AppError('Failed to create service: ' + error.message, 500);
    }
  }

  // Update service (admin/doctor only)
  async updateService(id, data) {
    try {
      const service = await serviceRepository.updateService(id, data);
      return service;
    } catch (error) {
      if (error.message.includes('Service not found')) {
        throw new AppError('Service not found', 404);
      }
      throw new AppError('Failed to update service: ' + error.message, 500);
    }
  }

  // Delete service (admin/doctor only)
  async deleteService(id) {
    try {
      const result = await serviceRepository.deleteService(id);
      return result;
    } catch (error) {
      if (error.message.includes('Service not found')) {
        throw new AppError('Service not found', 404);
      }
      throw new AppError('Failed to delete service: ' + error.message, 500);
    }
  }

  // Toggle service active status (admin/doctor only)
  async toggleServiceStatus(id) {
    try {
      const service = await serviceRepository.toggleServiceStatus(id);
      return service;
    } catch (error) {
      if (error.message.includes('Service not found')) {
        throw new AppError('Service not found', 404);
      }
      throw new AppError('Failed to update service status: ' + error.message, 500);
    }
  }
}

module.exports = new ServiceService();