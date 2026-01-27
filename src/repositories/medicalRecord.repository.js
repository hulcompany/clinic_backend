const { MedicalRecord, User, Admin, Consultation } = require('../models');
const { Op } = require('sequelize');
const AppError = require('../utils/AppError');

class MedicalRecordRepository {
  /**
   * Create a new medical record
   * @param {Object} medicalRecordData - Medical record data
   * @returns {Promise<Object>} Created medical record
   */
  async createMedicalRecord(medicalRecordData) {
    try {
      // Include consultation details in the response
      // First create the record
      const createdRecord = await MedicalRecord.create(medicalRecordData);
      
      // Then fetch the complete record with associations
      const record = await MedicalRecord.findByPk(createdRecord.id, {
        attributes: {
          include: ['medical_attachments']  // Include the medical_attachments field
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['user_id', 'full_name', 'email', 'phone', 'is_restricted']
          },
          {
            model: Admin,
            as: 'admin',
            attributes: ['user_id', 'full_name', 'email', 'phone', 'role']
          },
          {
            model: Consultation,
            as: 'consultation',
            attributes: ['id', 'initial_issue', 'status', 'createdAt', 'updatedAt']
          }
        ]
      });
      
      return record;
    } catch (error) {
      throw new AppError('Failed to create medical record: ' + error.message, 500);
    }
  }

  /**
   * Get medical record by ID
   * @param {number} id - Medical record ID
   * @returns {Promise<Object>} Medical record
   */
  async getMedicalRecordById(id) {
    try {
      const record = await MedicalRecord.findByPk(id, {
        attributes: {
          include: ['medical_attachments']  // Include the medical_attachments field
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['user_id', 'full_name', 'email', 'phone', 'is_restricted']
          },
          {
            model: Admin,
            as: 'admin',
            attributes: ['user_id', 'full_name', 'email', 'phone', 'role']
          },
          {
            model: Consultation,
            as: 'consultation',
            attributes: ['id', 'initial_issue', 'status', 'createdAt', 'updatedAt']
          }
        ]
      });
      if (!record) {
        throw new AppError('Medical record not found', 404);
      }
      return record;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch medical record: ' + error.message, 500);
    }
  }

  /**
   * Get all medical records with pagination
   * @param {number} page - Page number
   * @param {number} limit - Limit per page
   * @returns {Promise<Object>} Medical records with pagination info
   */
  async getAllMedicalRecords(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      const { count, rows } = await MedicalRecord.findAndCountAll({
        limit,
        offset,
        order: [['created_at', 'DESC']],
        attributes: {
          include: ['medical_attachments']  // Include the medical_attachments field
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['user_id', 'full_name', 'email', 'phone', 'is_restricted']
          },
          {
            model: Admin,
            as: 'admin',
            attributes: ['user_id', 'full_name', 'email', 'phone', 'role']
          },
          {
            model: Consultation,
            as: 'consultation',
            attributes: ['id', 'initial_issue', 'status', 'createdAt', 'updatedAt']
          }
        ]
      });

      return {
        records: rows,
        pagination: {
          total: count,
          pages: Math.ceil(count / limit),
          current: page,
          limit: limit
        }
      };
    } catch (error) {
      throw new AppError('Failed to fetch medical records: ' + error.message, 500);
    }
  }

  /**
   * Get medical records by user ID
   * @param {number} userId - User ID
   * @param {number} page - Page number
   * @param {number} limit - Limit per page
   * @returns {Promise<Object>} Medical records with pagination info
   */
  async getMedicalRecordsByUserId(userId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      const { count, rows } = await MedicalRecord.findAndCountAll({
        where: { user_id: userId },
        limit,
        offset,
          attributes: {
          include: ['medical_attachments']  // Include the medical_attachments field
        },
        order: [['created_at', 'DESC']],
        attributes: {
          include: ['medical_attachments']  // Include the medical_attachments field
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['user_id', 'full_name', 'email', 'phone', 'is_restricted']
          },
          {
            model: Admin,
            as: 'admin',
            attributes: ['user_id', 'full_name', 'email', 'phone', 'role']
          },
          {
            model: Consultation,
            as: 'consultation',
            attributes: ['id', 'initial_issue', 'status', 'createdAt', 'updatedAt']
          }
        ]
      });

      return {
        records: rows,
        pagination: {
          total: count,
          pages: Math.ceil(count / limit),
          current: page,
          limit: limit
        }
      };
    } catch (error) {
      throw new AppError('Failed to fetch medical records by user: ' + error.message, 500);
    }
  }

  /**
   * Get medical records by doctor ID
   * @param {number} doctorId - Doctor ID
   * @param {number} page - Page number
   * @param {number} limit - Limit per page
   * @returns {Promise<Object>} Medical records with pagination info
   */
  async getMedicalRecordsByDoctorId(doctorId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      const { count, rows } = await MedicalRecord.findAndCountAll({
        where: { doctor_id: doctorId },
        limit,
        offset,
        order: [['created_at', 'DESC']],
        attributes: {
          include: ['medical_attachments']  // Include the medical_attachments field
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['user_id', 'full_name', 'email', 'phone', 'is_restricted']
          },
          {
            model: Admin,
            as: 'admin',
            attributes: ['user_id', 'full_name', 'email', 'phone', 'role']
          },
          {
            model: Consultation,
            as: 'consultation',
            attributes: ['id', 'initial_issue', 'status', 'createdAt', 'updatedAt']
          }
        ]
      });

      return {
        records: rows,
        pagination: {
          total: count,
          pages: Math.ceil(count / limit),
          current: page,
          limit: limit
        }
      };
    } catch (error) {
      throw new AppError('Failed to fetch medical records by doctor: ' + error.message, 500);
    }
  }

  /**
   * Get medical records by doctor ID excluding restricted users
   * @param {number} doctorId - Doctor ID
   * @param {number} page - Page number
   * @param {number} limit - Limit per page
   * @returns {Promise<Object>} Medical records with pagination info
   */
  async getMedicalRecordsByDoctorIdExcludingRestricted(doctorId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      const { count, rows } = await MedicalRecord.findAndCountAll({
        where: { doctor_id: doctorId },
        attributes: {
          include: ['medical_attachments']  // Include the medical_attachments field
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['user_id', 'full_name', 'email', 'phone', 'is_restricted'],
            where: { is_restricted: { [Op.ne]: true } } // Exclude restricted users
          },
          {
            model: Admin,
            as: 'admin',
            attributes: ['user_id', 'full_name', 'email', 'phone', 'role']
          },
          {
            model: Consultation,
            as: 'consultation',
            attributes: ['id', 'initial_issue', 'status', 'createdAt', 'updatedAt']
          }
        ],
        limit,
        offset,
        order: [['created_at', 'DESC']]
      });

      return {
        records: rows,
        pagination: {
          total: count,
          pages: Math.ceil(count / limit),
          current: page,
          limit: limit
        }
      };
    } catch (error) {
      throw new AppError('Failed to fetch medical records by doctor (excluding restricted): ' + error.message, 500);
    }
  }

  /**
   * Get medical records by secretary's supervisor (doctor)
   * @param {number} supervisorId - Supervisor (Doctor) ID
   * @param {number} page - Page number
   * @param {number} limit - Limit per page
   * @returns {Promise<Object>} Medical records with pagination info
   */
  async getMedicalRecordsBySecretarySupervisor(supervisorId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      const { count, rows } = await MedicalRecord.findAndCountAll({
        where: { doctor_id: supervisorId }, // Filter records by the supervisor (doctor) ID
        attributes: {
          include: ['medical_attachments']  // Include the medical_attachments field
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['user_id', 'full_name', 'email', 'phone', 'is_restricted'],
            where: { is_restricted: { [Op.ne]: true } } // Exclude restricted users
          },
          {
            model: Admin,
            as: 'admin',
            attributes: ['user_id', 'full_name', 'email', 'phone', 'role']
          },
          {
            model: Consultation,
            as: 'consultation',
            attributes: ['id', 'initial_issue', 'status', 'createdAt', 'updatedAt']
          }
        ],
        limit,
        offset,
        order: [['created_at', 'DESC']]
      });

      return {
        records: rows,
        pagination: {
          total: count,
          pages: Math.ceil(count / limit),
          current: page,
          limit: limit
        }
      };
    } catch (error) {
      throw new AppError('Failed to fetch medical records by secretary supervisor: ' + error.message, 500);
    }
  }

  /**
   * Update medical record by ID
   * @param {number} id - Medical record ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated medical record
   */
  async updateMedicalRecord(id, updateData) {
    try {
      const [updatedRowsCount, updatedRecords] = await MedicalRecord.update(updateData, {
        where: { id },
        returning: true
      });
      
      if (updatedRowsCount === 0) {
        throw new AppError('Medical record not found', 404);
      }
      
      // Return the updated record with associations
      const updatedRecord = await MedicalRecord.findByPk(id, {
        attributes: {
          include: ['medical_attachments']  // Include the medical_attachments field
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['user_id', 'full_name', 'email', 'phone', 'is_restricted']
          },
          {
            model: Admin,
            as: 'admin',
            attributes: ['user_id', 'full_name', 'email', 'phone', 'role']
          },
          {
            model: Consultation,
            as: 'consultation',
            attributes: ['id', 'initial_issue', 'status', 'createdAt', 'updatedAt']
          }
        ]
      });
      return updatedRecord;
    } catch (error) {
      if (error.message.includes('Medical record not found')) {
        throw new AppError('Medical record not found', 404);
      }
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update medical record: ' + error.message, 500);
    }
  }

  /**
   * Delete medical record by ID
   * @param {number} id - Medical record ID
   * @returns {Promise<boolean>} Delete success status
   */
  async deleteMedicalRecord(id) {
    try {
      const record = await this.getMedicalRecordById(id);
      
      const deletedRowsCount = await MedicalRecord.destroy({
        where: { id }
      });
      
      return deletedRowsCount > 0;
    } catch (error) {
      if (error.message.includes('Medical record not found')) {
        throw new AppError('Medical record not found', 404);
      }
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete medical record: ' + error.message, 500);
    }
  }
}


module.exports = new MedicalRecordRepository();
