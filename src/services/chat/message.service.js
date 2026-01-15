/**
 * Message Service for Chat Functionality
 * 
 * This service handles all message-related operations including creation, retrieval,
 * and real-time broadcasting. It integrates with the WebSocket service to provide
 * instant message delivery and read status updates.
 */

const { buildMediaUrl } = require('../../utils/mediaUtils');
const AppError = require('../../utils/AppError');
const chatRepository = require('../../repositories/chat/chat.repository');
const messageRepository = require('../../repositories/chat/message.repository');

class MessageService {
  // Create a new message
  async createMessage(data, isOwnMessage = false) {
    try {
      const { chat_id, sender_id, message_type, content, file } = data;
      
      // For media messages, store only the filename, not the full URL
      let processedFileUrl = null;
      if (message_type !== 'text' && file) {
        // If file is already a full URL, extract just the filename
        if (file.startsWith('http://') || file.startsWith('https://')) {
          // Extract filename from URL
          processedFileUrl = file.split('/').pop();
        } else {
          // Already a filename, use as is
          processedFileUrl = file;
        }
      }
      
      const message = await messageRepository.createMessage({
        chat_id,
        sender_id,
        message_type: message_type || 'text',
        content: content, // Always preserve the content field, even for media messages
        file: message_type !== 'text' ? processedFileUrl : null
      });
      
      // Emit message via WebSocket if available
      if (typeof global.websocketService !== 'undefined') {
        console.log(`[MESSAGE SERVICE] Broadcasting message ${message.id} to chat ${message.chat_id}`);
        global.websocketService.emitToChat(
          message.chat_id, 
          'receive_message', 
          {
            id: message.id,
            chat_id: message.chat_id,
            sender_id: message.sender_id,
            message_type: message.message_type,
            content: message.content,
            file: message.file,
            file_url: message.file_url,
            created_at: message.createdAt,
            updated_at: message.updatedAt,
            // Include sender information so frontend can determine if message should be auto-marked as read
            is_own_message: isOwnMessage
          }
        );
        console.log(`[MESSAGE SERVICE] Message broadcast complete`);
      }
      
      return message;
    } catch (error) {
      throw new AppError('Failed to create message: ' + error.message, 500);
    }
  }
  
  // Get messages by chat ID with pagination (newest first - conventional chat behavior)
  async getMessagesByChatId(chat_id, page = 1, limit = 50) {
    try {
      const result = await messageRepository.getMessagesByChatId(chat_id, page, limit);
      
      return result;
    } catch (error) {
      throw new AppError('Failed to get messages: ' + error.message, 500);
    }
  }
  
  // Mark message as read
  async markMessageAsRead(message_id) {
    try {
      const message = await messageRepository.markMessageAsRead(message_id);
      
      // Emit read status via WebSocket if available
      if (typeof global.websocketService !== 'undefined') {
        console.log(`[MESSAGE SERVICE] Broadcasting read status for message ${message.id} in chat ${message.chat_id}`);
        global.websocketService.emitToChat(
          message.chat_id, 
          'message_read', 
          {
            message_id: message.id,
            read_at: message.read_at
          }
        );
        console.log(`[MESSAGE SERVICE] Read status broadcast complete`);
      }
      
      return message;
    } catch (error) {
      throw new AppError('Failed to mark message as read: ' + error.message, 500);
    }
  }
  
  // Get message by ID
  async getMessageById(id) {
    try {
      const message = await messageRepository.getMessageById(id);
      if (!message) {
        throw new AppError('Message not found', 404);
      }
      return message;
    } catch (error) {
      throw new AppError('Failed to get message: ' + error.message, 500);
    }
  }
  
  // Build file URL for media messages
  buildFileUrl(filename, contentType = 'messages') {
    if (!filename) return null;
    
    // If filename is already a full URL, return as is
    if (filename.startsWith('http://') || filename.startsWith('https://')) {
      return filename;
    }
    
    // Determine media type from file extension
    const mediaType = filename.match(/\.(mp4|avi|mov|flv|mkv)$/i) ? 'videos' : 
                     filename.match(/\.(mp3|wav|aac|wmv|ogg|webm|flac)$/i) ? 'audios' : 'images';
    return buildMediaUrl(filename, mediaType, contentType);
  }
}


module.exports = new MessageService();

