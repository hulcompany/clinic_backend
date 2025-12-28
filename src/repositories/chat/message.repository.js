/**
 * Message Repository for Data Access
 * 
 * This repository provides a centralized data access layer for all message-related operations.
 * It abstracts database interactions for messages, providing a consistent interface
 * for the message service.
 */

const { Message } = require('../../models/index');

class MessageRepository {
  // Get message by ID
  async getMessageById(id) {
    try {
      const message = await Message.findByPk(id);
      return message;
    } catch (error) {
      throw new Error('Failed to get message: ' + error.message);
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

  // Update message
  async updateMessage(id, data) {
    try {
      const message = await Message.findByPk(id);
      if (!message) {
        throw new Error('Message not found');
      }
      
      const updatedMessage = await message.update(data);
      return updatedMessage;
    } catch (error) {
      throw new Error('Failed to update message: ' + error.message);
    }
  }

  // Delete message
  async deleteMessage(id) {
    try {
      const message = await Message.findByPk(id);
      if (!message) {
        throw new Error('Message not found');
      }
      
      await message.destroy();
      return true;
    } catch (error) {
      throw new Error('Failed to delete message: ' + error.message);
    }
  }
}

module.exports = new MessageRepository();