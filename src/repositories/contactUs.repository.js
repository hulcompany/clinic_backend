const { ContactUs } = require('../models');
const { Op } = require('sequelize');
const AppError = require('../utils/AppError');
class ContactUsRepository {
  // Get all contact info (typically there should be only one active record)
  async getContactInfo() {
    try {
      const contactInfo = await ContactUs.findOne({
        where: { is_active: true },
        order: [['createdAt', 'DESC']]
      });

      if (!contactInfo) {
        throw new AppError('Contact information not found', 404);
      }

      return contactInfo;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch contact information: ' + error.message, 500);
    }
  }

  // Get contact info by ID
  async getContactInfoById(id) {
    try {
      const contactInfo = await ContactUs.findByPk(id);
      if (!contactInfo) {
        throw new AppError('Contact information not found', 404);
      }
      return contactInfo;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch contact information: ' + error.message, 500);
    }
  }

  // Get all contact info records with pagination (for admin panel)
  async getAllContactRecords(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      const { rows: contacts, count } = await ContactUs.findAndCountAll({
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });

      return {
        contacts,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalContacts: count
      };
    } catch (error) {
      throw new AppError('Failed to fetch contact records: ' + error.message, 500);
    }
  }

  // Create new contact information
  async createContactInfo(contactData) {
    try {
      // Deactivate any existing active contact info
      await ContactUs.update(
        { is_active: false },
        { where: { is_active: true } }
      );

      // Create new contact info as active
      const contactInfo = await ContactUs.create({
        ...contactData,
        is_active: true
      });

      return contactInfo;
    } catch (error) {
      throw new AppError('Failed to create contact information: ' + error.message, 500);
    }
  }

  // Update contact information
  async updateContactInfo(id, updateData) {
    try {
      const contactInfo = await this.getContactInfoById(id);
      
      // If activating this record, deactivate others
      if (updateData.is_active === true) {
        await ContactUs.update(
          { is_active: false },
          { where: { is_active: true, id: { [Op.ne]: id } } }
        );
      }

      await contactInfo.update(updateData);
      return contactInfo;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update contact information: ' + error.message, 500);
    }
  }

  // Delete contact information (hard delete - actually remove from database)
  async deleteContactInfo(id) {
    try {
      const contactInfo = await this.getContactInfoById(id);
      
      // Actually delete the contact information from the database
      await contactInfo.destroy();
      return { message: 'Contact information deleted successfully' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete contact information: ' + error.message, 500);
    }
  }

  // Toggle contact information active status
  async toggleContactStatus(id) {
    try {
      const contactInfo = await this.getContactInfoById(id);
      
      // Toggle the is_active status
      const newStatus = !contactInfo.is_active;
      
      await contactInfo.update({ is_active: newStatus });
      
      // Fetch the updated contact info to ensure we return the latest data
      const updatedContactInfo = await this.getContactInfoById(id);
      
      return updatedContactInfo;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to toggle contact status: ' + error.message, 500);
    }
  }
}

module.exports = new ContactUsRepository();