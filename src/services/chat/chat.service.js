const AppError = require('../../utils/AppError');
const chatRepository = require('../../repositories/chat/chat.repository');
const consultationRepository = require('../../repositories/consultation.repository');

class ChatService {
  // Get chat by ID
  async getChatById(id) {
    try {
      const chat = await chatRepository.getChatById(id);
      if (!chat) {
        throw new AppError('Chat not found', 404);
      }
      return chat;
    } catch (error) {
      throw new AppError('Failed to get chat: ' + error.message, 500);
    }
  }
  
  // Get chat by consultation ID
  async getChatByConsultationId(consultation_id) {
    try {
      const chat = await chatRepository.getChatByConsultationId(consultation_id);
      if (!chat) {
        throw new AppError('Chat not found for this consultation', 404);
      }
      return chat;
    } catch (error) {
      throw new AppError('Failed to get chat: ' + error.message, 500);
    }
  }
  
  // Get all chats with pagination
  async getAllChats(page = 1, limit = 20) {
    try {
      const result = await chatRepository.getAllChats(page, limit);
      return result;
    } catch (error) {
      throw new AppError('Failed to get chats: ' + error.message, 500);
    }
  }
  
  // Get chats by doctor ID with pagination
  async getChatsByDoctorId(doctor_id, page = 1, limit = 20) {
    try {
      // First, get consultation IDs for this doctor
      const consultationIds = await consultationRepository.getConsultationIdsByAdminId(doctor_id);
      
      // If no consultations, return empty result
      if (consultationIds.length === 0) {
        return {
          chats: [],
          pagination: {
            currentPage: parseInt(page),
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: parseInt(limit)
          }
        };
      }
      
      // Get chats for these consultations
      const result = await chatRepository.getChatsByConsultationIds(consultationIds, page, limit);
      
      return result;
    } catch (error) {
      throw new AppError('Failed to get chats: ' + error.message, 500);
    }
  }
  
  // Get chats by user ID with pagination
  async getChatsByUserId(user_id, page = 1, limit = 20) {
    try {
      // First, get consultation IDs for this user
      const consultationIds = await consultationRepository.getConsultationIdsByUserId(user_id);
      
      // If no consultations, return empty result
      if (consultationIds.length === 0) {
        return {
          chats: [],
          pagination: {
            currentPage: parseInt(page),
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: parseInt(limit)
          }
        };
      }
      
      // Get chats for these consultations
      const result = await chatRepository.getChatsByConsultationIds(consultationIds, page, limit);
      
      return result;
    } catch (error) {
      throw new AppError('Failed to get chats: ' + error.message, 500);
    }
  }
  
  // Update chat last message timestamp
  async updateLastMessageTimestamp(chat_id) {
    try {
      const chat = await chatRepository.updateLastMessageTimestamp(chat_id);
      return chat;
    } catch (error) {
      throw new AppError('Failed to update chat timestamp: ' + error.message, 500);
    }
  }
  
  // Toggle chat active status
  async toggleChatStatus(chat_id) {
    try {
      const chat = await chatRepository.toggleChatStatus(chat_id);
      return chat;
    } catch (error) {
      throw new AppError('Failed to update chat status: ' + error.message, 500);
    }
  }
}

module.exports = new ChatService();