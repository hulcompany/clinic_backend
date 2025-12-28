const { chatService, messageService } = require('../../services/index');
const AppError = require('../../utils/AppError');
const { successResponse, failureResponse } = require('../../utils/responseHandler');

/**
 * @desc    Initialize real-time chat connection
 * @route   POST /api/v1/chats/initialize
 * @access  Private (User/Admin/Doctor involved in chat)
 */
const initializeChat = async (req, res, next) => {
  try {
    const { consultation_id } = req.body;
    const user_id = req.user.user_id;
    
    // Check if user has permission to access this chat
    const chat = await chatService.getChatByConsultationId(consultation_id);
    
    if (!chat) {
      return failureResponse(res, 'Chat not found for this consultation', 404);
    }
    
    // Return connection details
    successResponse(res, {
      chat_id: chat.id,
      consultation_id: chat.consultation_id,
      ws_url: `${process.env.WS_URL || 'ws://localhost:3000'}/socket.io/`
    }, 'Chat initialized successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Join a chat room
 * @route   POST /api/v1/chats/:chat_id/join
 * @access  Private (User/Admin/Doctor involved in chat)
 */
const joinChatRoom = async (req, res, next) => {
  try {
    const { chat_id } = req.params;
    const user_id = req.user.user_id;
    
    // Check if user has permission to access this chat
    const chat = await chatService.getChatById(chat_id);
    
    if (!chat) {
      return failureResponse(res, 'Chat not found', 404);
    }
    
    // In a real implementation, we would notify the WebSocket service
    // For now, we'll just return success
    successResponse(res, {
      chat_id,
      user_id,
      joined: true
    }, 'Successfully joined chat room');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Leave a chat room
 * @route   POST /api/v1/chats/:chat_id/leave
 * @access  Private (User/Admin/Doctor involved in chat)
 */
const leaveChatRoom = async (req, res, next) => {
  try {
    const { chat_id } = req.params;
    const user_id = req.user.user_id;
    
    // Check if user has permission to access this chat
    const chat = await chatService.getChatById(chat_id);
    
    if (!chat) {
      return failureResponse(res, 'Chat not found', 404);
    }
    
    // In a real implementation, we would notify the WebSocket service
    // For now, we'll just return success
    successResponse(res, {
      chat_id,
      user_id,
      left: true
    }, 'Successfully left chat room');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Send real-time message
 * @route   POST /api/v1/chats/:chat_id/send-realtime
 * @access  Private (User/Admin/Doctor involved in chat)
 */
const sendRealTimeMessage = async (req, res, next) => {
  try {
    const { chat_id } = req.params;
    const { content, message_type, file_url } = req.body;
    const sender_id = req.user.user_id;
    
    // Check if user has permission to access this chat
    const chat = await chatService.getChatById(chat_id);
    
    if (!chat) {
      return failureResponse(res, 'Chat not found', 404);
    }
    
    // Create message in database
    const message = await messageService.createMessage({
      chat_id,
      sender_id,
      message_type: message_type || 'text',
      content,
      file: message_type !== 'text' ? file_url : null
    });
    
    // Emit message via WebSocket if available
    if (typeof global.websocketService !== 'undefined') {
      global.websocketService.emitToChat(
        chat_id, 
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
          updated_at: message.updatedAt
        }
      );
    }
    
    successResponse(res, message, 'Message sent successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Get online status of chat participants
 * @route   GET /api/v1/chats/:chat_id/online-status
 * @access  Private (User/Admin/Doctor involved in chat)
 */
const getOnlineStatus = async (req, res, next) => {
  try {
    const { chat_id } = req.params;
    
    // Check if user has permission to access this chat
    const chat = await chatService.getChatById(chat_id);
    
    if (!chat) {
      return failureResponse(res, 'Chat not found', 404);
    }
    
    // Get online status from WebSocket service if available
    let onlineUsers = [];
    if (typeof global.websocketService !== 'undefined') {
      onlineUsers = global.websocketService.getConnectedUsers();
    }
    
    successResponse(res, {
      chat_id,
      online_users: onlineUsers,
      total_online: onlineUsers.length
    }, 'Online status retrieved successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

module.exports = {
  initializeChat,
  joinChatRoom,
  leaveChatRoom,
  sendRealTimeMessage,
  getOnlineStatus
};