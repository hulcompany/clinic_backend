const contactUsRepository = require('../repositories/contactUs.repository');
const AppError = require('../utils/AppError');

class ContactUsService {
  // Get contact information (public)
  async getContactInfo() {
    try {
      const contactInfo = await contactUsRepository.getContactInfo();
      return contactInfo;
    } catch (error) {
      throw new AppError('Failed to get contact information: ' + error.message, 500);
    }
  }

  // Get all contact records (admin only)
  async getAllContactRecords(page = 1, limit = 10) {
    try {
      const result = await contactUsRepository.getAllContactRecords(page, limit);
      return result;
    } catch (error) {
      throw new AppError('Failed to get contact records: ' + error.message, 500);
    }
  }

  // Get contact info by ID (admin only)
  async getContactInfoById(id) {
    try {
      const contactInfo = await contactUsRepository.getContactInfoById(id);
      return contactInfo;
    } catch (error) {
      throw new AppError('Failed to get contact information: ' + error.message, 500);
    }
  }

  // Create new contact information (admin/doctor only)
  async createContactInfo(data) {
    try {
      const contactInfo = await contactUsRepository.createContactInfo(data);
      return contactInfo;
    } catch (error) {
      throw new AppError('Failed to create contact information: ' + error.message, 500);
    }
  }

  // Update contact information (admin/doctor only)
  async updateContactInfo(id, data) {
    try {
      const contactInfo = await contactUsRepository.updateContactInfo(id, data);
      return contactInfo;
    } catch (error) {
      if (error.message.includes('Contact information not found')) {
        throw new AppError('Contact information not found', 404);
      }
      throw new AppError('Failed to update contact information: ' + error.message, 500);
    }
  }

  // Delete contact information (admin/doctor only)
  async deleteContactInfo(id) {
    try {
      const result = await contactUsRepository.deleteContactInfo(id);
      return result;
    } catch (error) {
      if (error.message.includes('Contact information not found')) {
        throw new AppError('Contact information not found', 404);
      }
      throw new AppError('Failed to delete contact information: ' + error.message, 500);
    }
  }

  // Toggle contact information active status (admin/doctor only)
  async toggleContactStatus(id) {
    try {
      const contactInfo = await contactUsRepository.toggleContactStatus(id);
      return contactInfo;
    } catch (error) {
      if (error.message.includes('Contact information not found')) {
        throw new AppError('Contact information not found', 404);
      }
      throw new AppError('Failed to update contact status: ' + error.message, 500);
    }
  }
}

module.exports = new ContactUsService();