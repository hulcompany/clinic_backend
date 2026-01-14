/**
 * Consultation Repository for Data Access
 * 
 * This repository provides a centralized data access layer for all consultation-related operations.
 * It abstracts database interactions for consultations, providing a consistent interface
 * for the consultation service.
 */

const { Consultation, User, Admin } = require('../models/index');

class ConsultationRepository {
  // Get consultation by ID with associated data
  async getConsultationById(id) {
    try {
      const consultation = await Consultation.findByPk(id, {
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['user_id', 'full_name', 'email', 'phone', 'image']
          },
          {
            model: Admin,
            as: 'Admin',
            attributes: ['user_id', 'full_name', 'email', 'phone', 'image']
          }
        ]
      });
      
      return consultation;
    } catch (error) {
      throw new Error('Failed to get consultation: ' + error.message);
    }
  }

  // Get all consultations with pagination
  async getAllConsultations(page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      const { count, rows: consultations } = await Consultation.findAndCountAll({
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['user_id', 'full_name', 'email', 'phone', 'image']
          },
          {
            model: Admin,
            as: 'Admin',
            attributes: ['user_id', 'full_name', 'email', 'phone', 'image']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      return {
        consultations,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      };
    } catch (error) {
      throw new Error('Failed to get consultations: ' + error.message);
    }
  }

  // Get consultations by user ID with pagination
  async getConsultationsByUserId(user_id, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      const { count, rows: consultations } = await Consultation.findAndCountAll({
        where: { user_id },
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['user_id', 'full_name', 'email', 'phone', 'image']
          },
          {
            model: Admin,
            as: 'Admin',
            attributes: ['user_id', 'full_name', 'email', 'phone', 'image']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      return {
        consultations,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      };
    } catch (error) {
      throw new Error('Failed to get consultations by user: ' + error.message);
    }
  }

  // Get consultations by doctor ID with pagination
  async getConsultationsByDoctorId(admin_id, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      const { count, rows: consultations } = await Consultation.findAndCountAll({
        where: { admin_id },
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['user_id', 'full_name', 'email', 'phone', 'image']
          },
          {
            model: Admin,
            as: 'Admin',
            attributes: ['user_id', 'full_name', 'email', 'phone', 'image']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      return {
        consultations,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      };
    } catch (error) {
      throw new Error('Failed to get consultations by doctor: ' + error.message);
    }
  }

  // Get consultation IDs by user ID
  async getConsultationIdsByUserId(user_id) {
    try {
      const consultations = await Consultation.findAll({
        where: { user_id },
        attributes: ['id']
      });
      
      return consultations.map(consultation => consultation.id);
    } catch (error) {
      throw new Error('Failed to get consultation IDs by user: ' + error.message);
    }
  }

  // Get consultation IDs by admin ID
  async getConsultationIdsByAdminId(admin_id) {
    try {
      const consultations = await Consultation.findAll({
        where: { admin_id },
        attributes: ['id']
      });
      
      return consultations.map(consultation => consultation.id);
    } catch (error) {
      throw new Error('Failed to get consultation IDs by admin: ' + error.message);
    }
  }

  // Create a new consultation
  async createConsultation(data) {
    try {
      const consultation = await Consultation.create(data);
      return consultation;
    } catch (error) {
      throw new Error('Failed to create consultation: ' + error.message);
    }
  }

  // Update consultation
  async updateConsultation(id, data) {
    try {
      const consultation = await Consultation.findByPk(id);
      if (!consultation) {
        throw new Error('Consultation not found');
      }
      
      const updatedConsultation = await consultation.update(data);
      return updatedConsultation;
    } catch (error) {
      throw new Error('Failed to update consultation: ' + error.message);
    }
  }

  // Delete consultation
  async deleteConsultation(id) {
    try {
      const consultation = await Consultation.findByPk(id);
      if (!consultation) {
        throw new Error('Consultation not found');
      }
      
      await consultation.destroy();
      return true;
    } catch (error) {
      throw new Error('Failed to delete consultation: ' + error.message);
    }
  }

  // Update consultation status
  async updateStatus(id, status) {
    try {
      const consultation = await Consultation.findByPk(id);
      if (!consultation) {
        throw new Error('Consultation not found');
      }
      
      const updatedConsultation = await consultation.update({ status });
      return updatedConsultation;
    } catch (error) {
      throw new Error('Failed to update consultation status: ' + error.message);
    }
  }
}


module.exports = new ConsultationRepository();
