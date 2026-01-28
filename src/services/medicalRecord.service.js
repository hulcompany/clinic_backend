
const medicalRecordRepository = require('../repositories/medicalRecord.repository');
const { MedicalRecord, sequelize } = require('../models');
const AppError = require('../utils/AppError');

class MedicalRecordService {
  /**
   * Create a new medical record
   * @param {Object} medicalRecordData - Medical record data
   * @param {Object} req - Request object for file handling
   * @returns {Promise<Object>} Created medical record
   */
  async createMedicalRecord(medicalRecordData) {
    const transaction = await sequelize.transaction();
    try {
      const { user_id } = medicalRecordData;
      
      // Check if user already has a medical record WITH TRANSACTION
      const existingRecord = await MedicalRecord.findOne({
        where: { user_id: user_id },
        transaction: transaction
      });
      
      if (existingRecord) {
        await transaction.rollback();
        throw new AppError('User already has a medical record. Only one medical record is allowed per user.', 400);
      }
      
      // Create medical record WITH TRANSACTION
      const medicalRecord = await medicalRecordRepository.createMedicalRecord(medicalRecordData, transaction);
      await transaction.commit();
      return medicalRecord;
    } catch (error) {
      await transaction.rollback();
      if (error.message.includes('User already has a medical record') || 
          error.message.includes('Validation error') ||
          error.message.includes('unique constraint')) {
        throw new AppError('User already has a medical record. Only one medical record is allowed per user.', 400);
      }
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
      const medicalRecord = await medicalRecordRepository.getMedicalRecordById(id);
      if (!medicalRecord) {
        throw new AppError('Medical record not found', 404);
      }
      return medicalRecord;
    } catch (error) {
      if (error.message.includes('Medical record not found')) {
        throw error; // Re-throw the 404 error
      }
      throw new AppError('Failed to get medical record: ' + error.message, 500);
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
      const result = await medicalRecordRepository.getAllMedicalRecords(page, limit);
      return result;
    } catch (error) {
      throw new AppError('Failed to get medical records: ' + error.message, 500);
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
      const result = await medicalRecordRepository.getMedicalRecordsByUserId(userId, page, limit);
      return result;
    } catch (error) {
      throw new AppError('Failed to get medical records by user: ' + error.message, 500);
    }
  }

  /**
   * Get single medical record by user ID (for validation)
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} Medical record or null if not found
   */
  async getSingleMedicalRecordByUserId(userId) {
    try {
      const result = await medicalRecordRepository.getMedicalRecordsByUserId(userId, 1, 1);
      if (result && result.data && result.data.length > 0) {
        return result.data[0];
      }
      return null;
    } catch (error) {
      throw new AppError('Failed to get medical record by user: ' + error.message, 500);
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
      const result = await medicalRecordRepository.getMedicalRecordsByDoctorId(doctorId, page, limit);
      return result;
    } catch (error) {
      throw new AppError('Failed to get medical records by doctor: ' + error.message, 500);
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
      const result = await medicalRecordRepository.getMedicalRecordsByDoctorIdExcludingRestricted(doctorId, page, limit);
      return result;
    } catch (error) {
      throw new AppError('Failed to get medical records by doctor (excluding restricted): ' + error.message, 500);
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
      const result = await medicalRecordRepository.getMedicalRecordsBySecretarySupervisor(supervisorId, page, limit);
      return result;
    } catch (error) {
      throw new AppError('Failed to get medical records by secretary supervisor: ' + error.message, 500);
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
      const updatedRecord = await medicalRecordRepository.updateMedicalRecord(id, updateData);
      return updatedRecord;
    } catch (error) {
      if (error.message.includes('Medical record not found')) {
        throw new AppError('Medical record not found', 404);
      }
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
      // Delete the record
      const deleted = await medicalRecordRepository.deleteMedicalRecord(id);
      
      return deleted;
    } catch (error) {
      if (error.message.includes('Medical record not found')) {
        throw new AppError('Medical record not found', 404);
      }
      throw new AppError('Failed to delete medical record: ' + error.message, 500);
    }
  }

}

module.exports = new MedicalRecordService();

