/**
 * WebSocket Service for Real-time Chat
 * 
 * This service handles real-time communication between users using WebSocket technology.
 * It manages connections, rooms, message broadcasting, and user presence tracking.
 * The service integrates with the existing chat infrastructure to provide instant messaging.
 */

// External dependencies
const { Server } = require('socket.io');
const http = require('http');
const jwt = require('jsonwebtoken');

// Internal dependencies
const logger = require('../../utils/websocket.logger');
const WebSocketMonitoringService = require('./websocket.monitoring');

// Lazy-loaded services to avoid circular dependencies
let chatService = null;
let messageService = null;

/**
 * Helper functions
 */

// Helper to get chat service instance
const getChatService = () => {
  if (!chatService) {
    chatService = require('./chat.service');
  }
  return chatService;
};

// Helper to get message service instance
const getMessageService = () => {
  if (!messageService) {
    messageService = require('./message.service');
  }
  return messageService;
};

// Helper to validate chat existence
const validateChatExists = async (chatId, userId, action) => {
  try {
    const service = getChatService();
    const chat = await service.getChatById(chatId);
    if (!chat) {
      const error = new Error('Chat not found');
      logger.logError(error, `Chat ${chatId} not found when ${action} for user ${userId}`);
      return { valid: false, error: 'Chat not found', originalError: error };
    }
    return { valid: true, chat };
  } catch (error) {
    logger.logError(error, `Error validating chat ${chatId} existence for user ${userId} during ${action}`);
    return { valid: false, error: 'Invalid chat', originalError: error };
  }
};

// Helper to validate user is in chat room
const validateUserInChatRoom = (socket, chatId, userId, action) => {
  if (!socket.rooms.has(`chat_${chatId}`)) {
    const error = new Error('User not in chat room');
    logger.logError(error, `User ${userId} attempted to ${action} in chat ${chatId} without joining`);
    return { valid: false, error };
  }
  return { valid: true };
};

// Helper to handle socket errors consistently
const handleSocketError = (socket, error, context, userMessage) => {
  logger.logError(error, context);
  if (socket && socket.emit) {
    socket.emit('error', { message: userMessage || 'An error occurred', error: error.message });
  }
};

// Helper to validate and prepare message data
const prepareMessageData = (data, senderId) => {
  const { chatId, message, messageType, fileUrl, fileData, fileName, fileType, textContent } = data;
  
  return {
    chat_id: chatId,
    sender_id: senderId,
    message_type: messageType || fileType || 'text',
    content: message || textContent || null,
    file: fileUrl || fileName || null
  };
};

/**
 * WebSocket Service for Real-time Chat
 * 
 * This service handles real-time communication between users using WebSocket technology.
 * It manages connections, rooms, message broadcasting, and user presence tracking.
 * The service integrates with the existing chat infrastructure to provide instant messaging.
 */
class WebSocketService {
  /**
   * Initialize WebSocket service
   * @param {HttpServer} server - HTTP server instance
   */
  constructor(server) {
    this.io = null;
    this.connectedUsers = new Map();
    this.monitoringService = null;
    this.initializeSocket(server);
  }

  initializeSocket(server) {
    // Determine CORS origin based on environment
    const corsOrigin = process.env.WS_CORS_ORIGIN || process.env.CLIENT_URL || process.env.DOMAIN || 'http://localhost:4002';
    
    try {
      this.io = require('socket.io')(server, {
        cors: {
          // Use WS_CORS_ORIGIN for WebSocket-specific CORS, fallback to CLIENT_URL, then DOMAIN, then default
          origin: corsOrigin,
          methods: ['GET', 'POST'],
          credentials: true,
          // Additional CORS options for production
          optionsSuccessStatus: 200,
          allowedHeaders: ['Content-Type', 'Authorization'],
          exposedHeaders: ['Content-Length', 'X-Requested-With']
        },
        pingInterval: parseInt(process.env.WS_PING_INTERVAL) || 30000,
        pingTimeout: parseInt(process.env.WS_PING_TIMEOUT) || 5000,
        // Additional production settings
        maxHttpBufferSize: 10e6,       // 10MB بدلاً من 100KB
        connectTimeout: 60000,         
        serveClient: false,
        httpCompression: true,
        cookie: false,
        transports: ['websocket', 'polling'],
        allowEIO3: true,
        // ⭐⭐ إضافة maxPayload للتوافق ⭐⭐
        maxPayload: 10e6              // 10MB أيضاً
              // ⭐⭐ إعدادات إضافية للأمان ⭐⭐
        pingTimeout: 30000,            // 30 ثانية للملفات الكبيرة
        upgradeTimeout: 40000,         // 40 ثانية للترقية
        perMessageDeflate: {
          threshold: 1024,             // ضغط الرسائل فوق 1KB
          concurrencyLimit: 10         // تحديد التزامن
        }
      });
      
      // Initialize monitoring service
      this.monitoringService = new WebSocketMonitoringService(this);
      
      logger.logConnection('N/A', 'initialized', { corsOrigin ,
        maxBufferSize: '10MB',
        warning: 'Large buffer size may cause memory issues' });
          // ⭐⭐ إضافة تنظيف للذاكرة كل 5 دقائق ⭐⭐
      this.startMemoryCleanup();
    } catch (error) {
      logger.logError(error, 'WebSocket initialization failed');
      if (this.monitoringService) {
        this.monitoringService.trackError();
      }
      throw new Error('WebSocket service initialization failed: ' + error.message);
    }

    // Authentication middleware
    this.io.use((socket, next) => {
      const token = socket.handshake.query.token;
      
      // Log connection attempt
      console.log('[WEBSOCKET] Received connection attempt with token:', token ? token.substring(0, 20) + '...' : 'null');
      
      // Validate token presence
      if (!token) {
        console.log('[WEBSOCKET] No token provided');
        return next(new Error('Authentication token required'));
      }
      
      // Verify JWT token
      const secret = process.env.JWT_SECRET;
      
      try {
        console.log('[WEBSOCKET] Attempting to verify token with secret length:', secret ? secret.length : 'null');
        
        // Decode token to check structure
        const decodedPayload = jwt.decode(token);
        console.log('[WEBSOCKET] Decoded payload:', decodedPayload);
        
        // Validate token structure
        if (!decodedPayload || !decodedPayload.id) {
          console.log('[WEBSOCKET] Invalid token structure');
          return next(new Error('Invalid token structure'));
        }
        
        // Verify token signature
        const verifiedPayload = jwt.verify(token, secret);
        console.log('[WEBSOCKET] Verified payload:', verifiedPayload);
        
        // Attach user to socket
        socket.user = verifiedPayload;
        next();
      } catch (error) {
        console.error('[WEBSOCKET] JWT verification error:', error);
        next(new Error('Invalid authentication token: ' + error.message));
      }
    });

    this.io.on('connection', (socket) => {
      logger.logConnection(socket.id, 'connected', { userId: socket.user?.id });
      if (this.monitoringService) {
        this.monitoringService.trackConnection();
      }
        // ⭐⭐ تحديث وقت النشاط الأخير عند الاتصال ⭐⭐
      socket.lastActivity = Date.now();
      
      // ⭐⭐ تتبع استخدام الذاكرة ⭐⭐
      socket.memoryUsage = {
        messagesSent: 0,
        filesUploaded: 0,
        totalDataSize: 0
      };

      /**
       * ====================
       * CHAT ROOM MANAGEMENT
       * ====================
       */
      
      /**
       * Handle joining a chat room
       */
      socket.on('join_chat', async (data) => {
        try {
          const userId = socket.user.id;
          
          // Validate that the chat exists
          const chatValidation = await validateChatExists(data.chatId, userId, 'joining');
          if (!chatValidation.valid) {
            socket.emit('error', { message: chatValidation.error });
            return;
          }
          
          // Join the chat room
          socket.join(`chat_${data.chatId}`);
          
          // Track user in chat
          logger.logChatEvent(data.chatId, userId, 'joined', {});
          
          // Notify other users in the chat that someone joined
          socket.to(`chat_${data.chatId}`).emit('user_joined', { userId, chatId: data.chatId });
          
          console.log(`[WEBSOCKET] User ${userId} joined chat ${data.chatId}`);
        } catch (error) {
          handleSocketError(socket, error, `Error joining chat ${data?.chatId} for user ${socket.user?.id}`, 'Failed to join chat room');
        }
      });
      
      /**
       * Handle leaving a chat room
       */
      socket.on('leave_chat', async (data) => {
        try {
          const userId = socket.user.id;
          
          // Validate that the chat exists
          const chatValidation = await validateChatExists(data.chatId, userId, 'leaving');
          if (!chatValidation.valid) {
            socket.emit('error', { message: chatValidation.error });
            return;
          }
          
          // Leave the chat room
          socket.leave(`chat_${data.chatId}`);
          
          // Track user leaving chat
          logger.logChatEvent(data.chatId, userId, 'left', {});
          
          // Notify other users in the chat that someone left
          socket.to(`chat_${data.chatId}`).emit('user_left', { userId, chatId: data.chatId });
          
          console.log(`[WEBSOCKET] User ${userId} left chat ${data.chatId}`);
        } catch (error) {
          handleSocketError(socket, error, `Error leaving chat ${data?.chatId} for user ${socket.user?.id}`, 'Failed to leave chat room');
        }
      });
      
      /**
       * ====================
       * MESSAGE HANDLING
       * ====================
       */
      
      /**
       * Handle fetching messages for a chat
       */
      socket.on('get_messages', async (data) => {
        try {
          const userId = socket.user.id;
          
          // Validate that the chat exists
          const chatValidation = await validateChatExists(data.chatId, userId, 'loading messages');
          if (!chatValidation.valid) {
            socket.emit('error', { message: chatValidation.error });
            return;
          }
          
          // Fetch messages from database
          const service = getMessageService();
          const result = await service.getMessagesByChatId(data.chatId, 1, 50); // Get first 50 messages
          
          // Send messages to client
          socket.emit('messages_loaded', {
            chatId: data.chatId,
            messages: result.messages
          });
          
          console.log(`[WEBSOCKET] Loaded ${result.messages.length} messages for chat ${data.chatId} for user ${userId}`);
        } catch (error) {
          handleSocketError(socket, error, `Error loading messages for chat ${data?.chatId} for user ${socket.user?.id}`, 'Failed to load messages');
        }
      });

      /**
       * Handle new message
       */
      socket.on('send_message', async (data) => {
        try {
                    // تحديث وقت النشاط
          socket.lastActivity = Date.now();
          
          // ⭐⭐ تحقق من حجم الرسالة (10MB حد أقصى) ⭐⭐
          const MAX_MESSAGE_SIZE = 10 * 1024 * 1024; // 10MB
          const messageSize = JSON.stringify(data).length;
          
          if (messageSize > MAX_MESSAGE_SIZE) {
            socket.emit('error', {
              message: 'Message too large. Maximum size is 10MB.',
              maxSize: '10MB',
              actualSize: (messageSize / (1024*1024)).toFixed(2) + 'MB'
            });
            return;
          }
          
          // تحديث تتبع الذاكرة
          socket.memoryUsage.messagesSent++;
          socket.memoryUsage.totalDataSize += messageSize;
          
          // Use authenticated user ID instead of client-provided ID
          const senderId = socket.user.id;
          
          // Validate that the chat exists
          const chatValidation = await validateChatExists(data.chatId, senderId, 'sending message');
          if (!chatValidation.valid) {
            socket.emit('error', { message: chatValidation.error });
            return;
          }
          
          // Validate that user is in this chat room
          const roomValidation = validateUserInChatRoom(socket, data.chatId, senderId, 'send message');
          if (!roomValidation.valid) {
            socket.emit('error', { message: 'You must join the chat room before sending messages' });
            return;
          }
          
          // Prepare message data using helper
          const messageData = prepareMessageData(data, senderId);
          
          // Save message to database using message service
          const service = getMessageService();
          const savedMessage = await service.createMessage(messageData, true); // true indicates this is the sender's own message
          
          // Emit message to all users in the chat room
          socket.to(`chat_${data.chatId}`).emit('receive_message', {
            id: savedMessage.id,
            chat_id: savedMessage.chat_id,
            sender_id: savedMessage.sender_id,
            message_type: savedMessage.message_type,
            content: savedMessage.content,
            file: savedMessage.file,
            file_url: savedMessage.file_url,
            created_at: savedMessage.createdAt,
            updated_at: savedMessage.updatedAt,
            // Include sender information so frontend can determine if message should be auto-marked as read
            is_own_message: false // For other users, this is not their own message
          });
          
          // Also send the message back to the sender with is_own_message flag set to true
          socket.emit('receive_message', {
            id: savedMessage.id,
            chat_id: savedMessage.chat_id,
            sender_id: savedMessage.sender_id,
            message_type: savedMessage.message_type,
            content: savedMessage.content,
            file: savedMessage.file,
            file_url: savedMessage.file_url,
            created_at: savedMessage.createdAt,
            updated_at: savedMessage.updatedAt,
            // For the sender, this is their own message
            is_own_message: true
          });
          
          logger.logMessage(data.chatId, savedMessage.id, 'sent', { senderId, messageType: data.messageType });
          if (this.monitoringService) {
            this.monitoringService.trackMessage();
          }
          // ⭐⭐ تحذير إذا كانت الرسالة كبيرة ⭐⭐
          if (messageSize > 5 * 1024 * 1024) { // أكبر من 5MB
            console.warn(`[WEBSOCKET WARNING] Large message sent (${(messageSize/(1024*1024)).toFixed(2)}MB) by user ${senderId}`);
          }
          
        } catch (error) {
          handleSocketError(socket, error, `Error sending message to chat ${data?.chatId}`, 'Failed to send message');
        }
      });

      /**
       * Handle file upload
       */
      socket.on('upload_file', async (data) => {
        try {
                    // تحديث وقت النشاط
          socket.lastActivity = Date.now();
          
          // ⭐⭐ تحقق من حجم الملف (10MB حد أقصى) ⭐⭐
          const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
          
          // حساب حجم الملف
          let fileSize = 0;
          if (data.fileSize) {
            fileSize = data.fileSize;
          } else if (data.fileData && data.fileData.length) {
            fileSize = data.fileData.length;
          } else if (data.chunkData && data.chunkData.length) {
            fileSize = data.chunkData.length;
          }
          
          if (fileSize > MAX_FILE_SIZE) {
            socket.emit('error', {
              message: 'File size exceeds 10MB limit. Please compress or use smaller file.',
              maxSize: '10MB',
              actualSize: (fileSize / (1024*1024)).toFixed(2) + 'MB'
            });
            return;
          }
          
          // تحديث تتبع الذاكرة
          socket.memoryUsage.filesUploaded++;
          socket.memoryUsage.totalDataSize += fileSize;
          
          // Use authenticated user ID
          const senderId = socket.user.id;
          
          // Validate that the chat exists
          const chatValidation = await validateChatExists(data.chatId, senderId, 'uploading file');
          if (!chatValidation.valid) {
            socket.emit('error', { message: chatValidation.error });
            return;
          }
          
          // Validate that user is in this chat room
          const roomValidation = validateUserInChatRoom(socket, data.chatId, senderId, 'upload file');
          if (!roomValidation.valid) {
            socket.emit('error', { message: 'You must join the chat room before uploading files' });
            return;
          }
                    // ⭐⭐ تحذير للملفات الكبيرة ⭐⭐
          if (fileSize > 10 * 1024 * 1024) { // أكبر من 10MB
            console.warn(`[WEBSOCKET WARNING] Large file upload (${(fileSize/(1024*1024)).toFixed(2)}MB) by user ${senderId}`);
          }
          // In a real implementation, you would save the file to disk/storage
          // and then create a message record with the file URL
          
          // For now, we'll simulate saving the file and creating a message
          const service = getMessageService();
          const messageData = prepareMessageData(data, senderId);
          const savedMessage = await service.createMessage(messageData, true); // true indicates this is the sender's own message
          
          // Emit file message to all users in the chat room
          socket.to(`chat_${data.chatId}`).emit('receive_message', {
            id: savedMessage.id,
            chat_id: savedMessage.chat_id,
            sender_id: savedMessage.sender_id,
            message_type: savedMessage.message_type,
            content: savedMessage.content,
            file: savedMessage.file,
            file_url: savedMessage.file_url,
            created_at: savedMessage.createdAt,
            updated_at: savedMessage.updatedAt,
            // Include sender information so frontend can determine if message should be auto-marked as read
            is_own_message: false // For other users, this is not their own message
          });
          
          // Also send the message back to the sender with is_own_message flag set to true
          socket.emit('receive_message', {
            id: savedMessage.id,
            chat_id: savedMessage.chat_id,
            sender_id: savedMessage.sender_id,
            message_type: savedMessage.message_type,
            content: savedMessage.content,
            file: savedMessage.file,
            file_url: savedMessage.file_url,
            created_at: savedMessage.createdAt,
            updated_at: savedMessage.updatedAt,
            // For the sender, this is their own message
            is_own_message: true
          });
          
          logger.logMessage(data.chatId, savedMessage.id, 'file_sent', { senderId, fileType: data.fileType });
          
          // Confirm upload to sender
          socket.emit('file_uploaded', { 
            messageId: savedMessage.id, 
            fileName: data.fileName,
            fileUrl: savedMessage.file_url, // Send the actual file URL
            success: true 
          });
        } catch (error) {
          handleSocketError(socket, error, `Error uploading file to chat ${data?.chatId}`, 'Failed to upload file');
        }
      });

      /**
       * Handle typing indicator
       */
      socket.on('typing', async (data) => {
        try {
          // Use authenticated user ID instead of client-provided ID
          const userId = socket.user.id;
          
          // Validate that the chat exists
          const chatValidation = await validateChatExists(data.chatId, userId, 'sending typing indicator');
          if (!chatValidation.valid) {
            return; // Don't send error to client for typing indicators as it's non-critical
          }
          
          // Validate that user is in this chat room
          const roomValidation = validateUserInChatRoom(socket, data.chatId, userId, 'send typing indicator');
          if (!roomValidation.valid) {
            return; // Don't send error to client for typing indicators as it's non-critical
          }
          
          socket.to(`chat_${data.chatId}`).emit('user_typing', { userId, isTyping: data.isTyping });
          logger.logChatEvent(data.chatId, userId, 'typing', { isTyping: data.isTyping });
        } catch (error) {
          // For typing indicators, we don't send errors to the client as it's non-critical
          logger.logError(error, `Error handling typing indicator for chat ${data?.chatId}`);
        }
      });

      /**
       * Handle message read status
       */
      socket.on('mark_as_read', async (data) => {
        try {
          // Use authenticated user ID instead of client-provided ID
          const userId = socket.user.id;
          
          // Validate that the chat exists
          const chatValidation = await validateChatExists(data.chatId, userId, 'marking message as read');
          if (!chatValidation.valid) {
            socket.emit('error', { message: chatValidation.error });
            return;
          }
          
          // Validate that user is in this chat room
          const roomValidation = validateUserInChatRoom(socket, data.chatId, userId, 'mark message as read');
          if (!roomValidation.valid) {
            socket.emit('error', { message: 'You must join the chat room before marking messages as read' });
            return;
          }
          
          // First, get the message to check if the user is the sender
          // This prevents users from automatically marking their own messages as read
          // which can happen when the frontend automatically sends mark_as_read events
          const service = getMessageService();
          try {
            const message = await service.getMessageById(data.messageId);
            
            // Prevent users from marking their own messages as read
            if (message.sender_id === userId) {
              // Don't mark the message as read if the user is the sender
              // Just acknowledge the request without updating the database
              socket.emit('message_read_ack', { 
                messageId: data.messageId, 
                read_at: message.read_at,
                self_message: true
              });
              return;
            }
          } catch (error) {
            // If we can't get the message, proceed with the normal flow
            // This shouldn't happen in normal circumstances
            console.warn('Could not retrieve message for read status check:', error.message);
          }
          
          // Update message read status in database
          const updatedMessage = await service.markMessageAsRead(data.messageId);
          
          socket.to(`chat_${data.chatId}`).emit('message_read', { 
            messageId: updatedMessage.id, 
            read_at: updatedMessage.read_at 
          });
          logger.logMessage(data.chatId, data.messageId, 'marked_as_read', { userId });
        } catch (error) {
          handleSocketError(socket, error, `Error marking message ${data?.messageId} as read in chat ${data?.chatId}`, 'Failed to mark message as read');
        }
      });

      /**
       * ====================
       * CONNECTION HANDLING
       * ====================
       */
      
      /**
       * Handle disconnect
       */
      socket.on('disconnect', (reason) => {
        try {
          logger.logConnection(socket.id, 'disconnected', { reason });
          if (this.monitoringService) {
            this.monitoringService.trackDisconnection();
          }
          // Remove user from connected users
          for (let [userId, socketId] of this.connectedUsers.entries()) {
            if (socketId === socket.id) {
              this.connectedUsers.delete(userId);
              logger.logConnection(socket.id, 'user_removed', { userId });
              break;
            }
          }
        } catch (error) {
          logger.logError(error, `Error handling disconnect for socket ${socket.id}`);
        }
      });
    });
      // ⭐⭐ تنظيف الاتصالات غير النشطة كل 5 دقائق ⭐⭐
    this.startInactiveConnectionCleanup();
  }
  /**
   * تنظيف الاتصالات غير النشطة
   */
  startInactiveConnectionCleanup() {
    setInterval(() => {
      try {
        const sockets = this.io.sockets.sockets;
        const now = Date.now();
        let cleaned = 0;
        let totalMemoryUsage = 0;
        
        sockets.forEach((socket) => {
          // تنظيف الاتصالات غير النشطة لأكثر من 2 ساعة
          if (socket.lastActivity && (now - socket.lastActivity > 2 * 60 * 60 * 1000)) {
            socket.disconnect(true);
            cleaned++;
            
            // تسجيل استخدام الذاكرة
            if (socket.memoryUsage) {
              totalMemoryUsage += socket.memoryUsage.totalDataSize;
            }
            
            console.log(`[WEBSOCKET CLEANUP] Cleaned inactive socket after 2 hours: ${socket.id}`);
          }
        });
        
        if (cleaned > 0) {
          console.log(`[WEBSOCKET CLEANUP] Total cleaned: ${cleaned} inactive connections`);
          console.log(`[WEBSOCKET CLEANUP] Total memory freed: ${(totalMemoryUsage/(1024*1024)).toFixed(2)}MB`);
        }
      } catch (error) {
        console.error('[WEBSOCKET CLEANUP] Error:', error.message);
      }
    }, 5 * 60 * 1000); // كل 5 دقائق
  }
  
  /**
   * تنظيف الذاكرة الدورية
   */
  startMemoryCleanup() {
    setInterval(() => {
      try {
        const memoryUsage = process.memoryUsage();
        const usedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
        const totalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
        
        console.log(`[WEBSOCKET MEMORY] Heap used: ${usedMB}MB / ${totalMB}MB`);
        
        // تحذير إذا كانت الذاكرة عالية
        if (usedMB > 300) { // أكثر من 300MB
          console.warn(`[WEBSOCKET WARNING] High memory usage: ${usedMB}MB`);
          
          // محاولة إجبار GC إذا كان متاحاً
          if (global.gc) {
            console.log('[WEBSOCKET MEMORY] Forcing garbage collection...');
            global.gc();
          }
        }
      } catch (error) {
        console.error('[WEBSOCKET MEMORY] Error:', error.message);
      }
    }, 60 * 1000); // كل دقيقة
  }

  // Method to emit event to specific user
  emitToUser(userId, event, data) {
    try {
      const socketId = this.connectedUsers.get(userId);
      if (socketId) {
        this.io.to(socketId).emit(event, data);
        return true;
      }
      return false;
    } catch (error) {
      logger.logError(error, `Error emitting event ${event} to user ${userId}`);
      return false;
    }
  }
 

  // Method to emit event to all users in a chat
  emitToChat(chatId, event, data) {
    try {
      this.io.to(`chat_${chatId}`).emit(event, data);
      return true;
    } catch (error) {
      logger.logError(error, `Error emitting event ${event} to chat ${chatId}`);
      return false;
    }
  }

  // Method to get online status of a user
  isUserOnline(userId) {
    try {
      return this.connectedUsers.has(userId);
    } catch (error) {
      logger.logError(error, `Error checking online status for user ${userId}`);
      return false;
    }
  }

  // Method to get all connected users
  getConnectedUsers() {
    try {
      return Array.from(this.connectedUsers.keys());
    } catch (error) {
      logger.logError(error, 'Error getting connected users');
      return [];
    }
  }
}


module.exports = WebSocketService;
