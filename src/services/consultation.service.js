const AppError = require('../utils/AppError');
const consultationRepository = require('../repositories/consultation.repository');
const chatRepository = require('../repositories/chat/chat.repository');

class ConsultationService {
  // Delete a consultation
  async deleteConsultation(id) {
    try {
      const result = await consultationRepository.deleteConsultation(id);
      return result;
    } catch (error) {
      throw new AppError('Failed to delete consultation: ' + error.message, 500);
    }
  }

  // Create a new consultation
  async createConsultation(data) {
    try {
      const { user_id, admin_id, initial_issue } = data;
      
      // Create consultation
      const consultation = await consultationRepository.createConsultation({
        user_id,
        admin_id,
        initial_issue,
        status: 'requested'
      });
      
      // Create associated chat
      const chat = await chatRepository.createChat(consultation.id);
      
      return {
        consultation,
        chat
      };
    } catch (error) {
      throw new AppError('Failed to create consultation: ' + error.message, 500);
    }
  }
  
  // Get all consultations with pagination
  async getAllConsultations(page = 1, limit = 20) {
    try {
      const result = await consultationRepository.getAllConsultations(page, limit);
      return result;
    } catch (error) {
      throw new AppError('Failed to get consultations: ' + error.message, 500);
    }
  }
  
  // Get consultation by ID
  async getConsultationById(id) {
    try {
      const consultation = await consultationRepository.getConsultationById(id);
      if (!consultation) {
        throw new AppError('Consultation not found', 404);
      }
      return consultation;
    } catch (error) {
      throw new AppError('Failed to get consultation: ' + error.message, 500);
    }
  }
  
  // Update consultation status
  async updateConsultationStatus(id, status) {
    try {
      const consultation = await consultationRepository.updateStatus(id, status);
      return consultation;
    } catch (error) {
      throw new AppError('Failed to update consultation status: ' + error.message, 500);
    }
  }
  
  // Get consultations by user ID
  async getConsultationsByUserId(user_id, page = 1, limit = 20) {
    try {
      const result = await consultationRepository.getConsultationsByUserId(user_id, page, limit);
      return result;
    } catch (error) {
      throw new AppError('Failed to get consultations: ' + error.message, 500);
    }
  }
  
  // Get consultations by admin ID
  async getConsultationsByAdminId(admin_id, page = 1, limit = 20) {
    try {
      const result = await consultationRepository.getConsultationsByDoctorId(admin_id, page, limit);
      return result;
    } catch (error) {
      throw new AppError('Failed to get consultations: ' + error.message, 500);
    }
  }
}

module.exports = new ConsultationService();