/**
 * Chat Repository for Data Access
 * 
 * This repository provides a centralized data access layer for all chat-related operations.
 * It abstracts database interactions for chats and messages, providing a consistent interface
 * for the chat and message services.
 */

const { Chat, Message, Consultation } = require('../../models/index');

class ChatRepository {
  // Get chat by ID with associated data
  async getChatById(id) {
    try {
      const chat = await Chat.findByPk(id, {
        include: [
          {
            model: Consultation,
            as: 'Consultation'
          }
        ]
      });
      
      return chat;
    } catch (error) {
      throw new Error('Failed to get chat: ' + error.message);
    }
  }

  // Get all chats with pagination
  async getAllChats(page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      const { count, rows: chats } = await Chat.findAndCountAll({
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      return {
        chats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      };
    } catch (error) {
      throw new Error('Failed to get chats: ' + error.message);
    }
  }

  // Get chats by consultation IDs with pagination
  async getChatsByConsultationIds(consultationIds, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      const { count, rows: chats } = await Chat.findAndCountAll({
        where: {
          consultation_id: consultationIds
        },
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      return {
        chats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      };
    } catch (error) {
      throw new Error('Failed to get chats: ' + error.message);
    }
  }

  // Get chat by consultation ID
  async getChatByConsultationId(consultation_id) {
    try {
      const chat = await Chat.findOne({
        where: { consultation_id },
        include: [
          {
            model: Consultation,
            as: 'Consultation'
          }
        ]
      });
      
      return chat;
    } catch (error) {
      throw new Error('Failed to get chat by consultation: ' + error.message);
    }
  }

  // Create a new chat for a consultation
  async createChat(consultation_id) {
    try {
      const chat = await Chat.create({
        consultation_id,
        is_active: true
      });
      
      return chat;
    } catch (error) {
      throw new Error('Failed to create chat: ' + error.message);
    }
  }

  // Update chat last message timestamp
  async updateLastMessageTimestamp(chat_id) {
    try {
      const chat = await Chat.findByPk(chat_id);
      if (!chat) {
        throw new Error('Chat not found');
      }
      
      chat.last_message_at = new Date();
      await chat.save();
      
      return chat;
    } catch (error) {
      throw new Error('Failed to update chat timestamp: ' + error.message);
    }
  }

  // Toggle chat active status
  async toggleChatStatus(chat_id) {
    try {
      const chat = await Chat.findByPk(chat_id);
      if (!chat) {
        throw new Error('Chat not found');
      }
      
      chat.is_active = !chat.is_active;
      await chat.save();
      
      return chat;
    } catch (error) {
      throw new Error('Failed to update chat status: ' + error.message);
    }
  }

  // Get messages by chat ID with pagination
  async getMessagesByChatId(chat_id, page = 1, limit = 50) {
    try {
      const offset = (page - 1) * limit;
      const { count, rows: messages } = await Message.findAndCountAll({
        where: { chat_id },
        order: [['created_at', 'ASC']], // Oldest first for chat display
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      return {
        messages,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      };
    } catch (error) {
      throw new Error('Failed to get messages: ' + error.message);
    }
  }

  // Create a new message
  async createMessage(data) {
    try {
      const { chat_id, sender_id, message_type, content, file } = data;
      
      const message = await Message.create({
        chat_id,
        sender_id,
        message_type: message_type || 'text',
        content: content,
        file: message_type !== 'text' ? file : null
      });
      
      // Update chat's last message timestamp
      await this.updateLastMessageTimestamp(chat_id);
      
      return message;
    } catch (error) {
      throw new Error('Failed to create message: ' + error.message);
    }
  }

  // Mark message as read
  async markMessageAsRead(message_id) {
    try {
      const message = await Message.findByPk(message_id);
      if (!message) {
        throw new Error('Message not found');
      }
      
      message.read_at = new Date();
      await message.save();
      
      return message;
    } catch (error) {
      throw new Error('Failed to mark message as read: ' + error.message);
    }
  }
}

module.exports = new ChatRepository();