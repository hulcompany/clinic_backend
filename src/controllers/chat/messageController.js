const { messageService, chatService, consultationService } = require('../../services/index');
const AppError = require('../../utils/AppError');
const { successResponse, createdResponse, failureResponse } = require('../../utils/responseHandler');
const { uploadImage, uploadVideo, uploadAudio } = require('../../utils/allMediaUploadUtil');

// Helper function to determine message type from file extension
const determineMessageType = (file) => {
  if (!file) return 'text';
  
  const fileExtension = file.originalname.split('.').pop().toLowerCase();
  
  if (fileExtension) {
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(fileExtension)) {
      return 'video';
    } else if (['mp3', 'wav', 'aac', 'ogg', 'flac'].includes(fileExtension)) {
      return 'audio';
    } else {
      return 'image';
    }
  }
  
  return 'image'; // default
};


// Helper function to validate user permissions for messaging
const validateUserPermissions = async (chat_id, user) => {
  // First, get the chat to check permissions
  const chat = await chatService.getChatById(chat_id);
  
  // Check if chat is active
  if (!chat.is_active) {
    throw new Error('Cannot send message in inactive chat');
  }
  
  // Get the consultation to check if user is involved
  const consultation = await consultationService.getConsultationById(chat.consultation_id);
  
  // Check if user has permission to send message in this chat
  if (user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'doctor') {
    if (consultation.user_id !== user.user_id && consultation.admin_id !== user.user_id) {
      throw new Error('Not authorized to send message in this chat');
    }
  }
  
  return { chat, consultation };
};

// Helper function to validate user permissions for viewing messages
const validateViewPermissions = async (chat_id, user) => {
  // First, get the chat to check permissions
  const chat = await chatService.getChatById(chat_id);
  
  // Check if chat is active
  if (!chat.is_active) {
    throw new Error('Cannot view messages in inactive chat');
  }
  
  // Get the consultation to check if user is involved
  const consultation = await consultationService.getConsultationById(chat.consultation_id);
  
  // Check if user has permission to view messages in this chat
  if (user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'doctor') {
    if (consultation.user_id !== user.user_id && consultation.admin_id !== user.user_id) {
      throw new Error('Not authorized to view messages in this chat');
    }
  }
  
  return { chat, consultation };
};

// Helper function to validate user permissions for marking messages as read
const validateReadPermissions = async (message_id, user) => {
  // Get the message
  const message = await messageService.getMessageById(message_id);
  
  // Get the chat to check if user is involved
  const chat = await chatService.getChatById(message.chat_id);
  
  // Get the consultation to check if user is involved
  const consultation = await consultationService.getConsultationById(chat.consultation_id);
  
  // Check if user is the recipient (not the sender)
  if (message.sender_id === user.user_id) {
    throw new Error('Cannot mark own message as read');
  }
  
  // Check if user is involved in this consultation
  if (user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'doctor') {
    if (consultation.user_id !== user.user_id && consultation.admin_id !== user.user_id) {
      throw new Error('Not authorized to mark message as read');
    }
  }
  
  return { message, chat, consultation };
};



/**
 * @desc    Send a new message (handles both JSON and multipart/form-data, including multiple file uploads)
 * @route   POST /api/v1/messages
 * @access  Private (User/Admin/Doctor involved in chat)
 */
const sendMessage = async (req, res, next) => {
  try {
    // Extract parameters from form-data or JSON body
    let { chat_id, message_type, content, file_url } = req.body;
    
    // Sender ID comes from authenticated user
    const sender_id = req.user.user_id;
    
    // Handle file upload if this is a multipart/form-data request
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
      // For multipart/form-data requests, we need to handle file uploads
      // We'll determine message type based on file extension
      
      // Get the file(s) from the request
      let files = [];
      
      // Handle array-based multiple file upload
      if (req.files && Array.isArray(req.files)) {
        files = req.files;
      } 
      // Handle field-based multiple file upload
      else if (req.files && req.files.file) {
        if (Array.isArray(req.files.file)) {
          files = req.files.file;
        } else {
          files = [req.files.file];
        }
      }
      // Handle single file upload (fallback)
      else if (req.file) {
        files = [req.file];
      }
      
      // If chat_id is not in destructured body, try to get it directly
      if (!chat_id) {
        chat_id = req.body.chat_id;
      }
      
      // Process all files - create separate messages for each file type
      if (files.length > 0) {
        // Store information about all files for the response
        req.allFiles = files.map(file => ({
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype
        }));
            
        // We'll create separate messages for each file
        req.createMultipleMessages = true;
        req.filesToProcess = files;
      }
    }
    
    // Validate required parameters
    if (!chat_id) {
      return failureResponse(res, 'Chat ID is required', 400);
    }
    
    // Set default message type if not provided
    if (!message_type) {
      message_type = 'text';
    }
    
    // Validate user permissions
    await validateUserPermissions(chat_id, req.user);
    
    // If we need to create multiple messages for multiple files
    if (req.createMultipleMessages && req.filesToProcess) {
      // Create separate messages for each file
      const messages = [];
      
      // Create the first message with content and the first file
      if (req.filesToProcess.length > 0) {
        const firstFile = req.filesToProcess[0];
        // Determine message type based on first file extension
        const fileType = determineMessageType(firstFile);
        
        // Get filename directly from the first uploaded file
        const filename = firstFile.filename;
        
        // Build file URL
        const fileUrl = messageService.buildFileUrl(filename);
        
        // Create message for the first file with content
        const message = await messageService.createMessage({
          chat_id,
          sender_id,
          message_type: fileType,
          content: content, // Include content with the first message
          file: fileUrl
        });
        
        messages.push(message);
      }
      
      // Create additional messages for remaining files without content
      for (let i = 1; i < req.filesToProcess.length; i++) {
        const file = req.filesToProcess[i];
        // Determine message type based on file extension
        const fileType = determineMessageType(file);
        
        // Get filename directly from the uploaded file
        const filename = file.filename;
        
        // Build file URL
        const fileUrl = messageService.buildFileUrl(filename);
        
        // Create message for this file without content
        const message = await messageService.createMessage({
          chat_id,
          sender_id,
          message_type: fileType,
          content: null, // No content for additional messages
          file: fileUrl
        });
        
        messages.push(message);
      }
      
      // Update chat's last message timestamp
      await chatService.updateLastMessageTimestamp(chat_id);
      
      // Create a plain object with only the fields we want
      const responseData = {
        id: messages[0].id, // Use the first message ID as the main ID
        chat_id: messages[0].chat_id,
        sender_id: messages[0].sender_id,
        content: messages[0].content,
        createdAt: messages[0].createdAt,
        updatedAt: messages[0].updatedAt,
        allFiles: req.allFiles
      };
      
      // Return the response with only the fields we want
      successResponse(res, responseData, `Message sent successfully with ${req.filesToProcess.length} file(s)`);
    } else {
      // Create a single message (text or single file)
      const message = await messageService.createMessage({
        chat_id,
        sender_id,
        message_type,
        content: content, // Always preserve the content field, even for media messages
        file: message_type !== 'text' ? file_url : null
      });
      
      // Update chat's last message timestamp
      await chatService.updateLastMessageTimestamp(chat_id);
      
      // Always include all message fields plus the allFiles array when files are present
      if (req.allFiles) {
        // Create a plain object with only the fields we want
        const responseData = {
          id: message.id,
          chat_id: message.chat_id,
          sender_id: message.sender_id,
          content: message.content,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
          allFiles: req.allFiles
        };
        
        // Return the response with only the fields we want
        successResponse(res, responseData, 'Message sent successfully');
      } else {
        // For text messages without files, return the normal response
        createdResponse(res, message, 'Message sent successfully');
      }
    }
  } catch (error) {
    if (error.message === 'Cannot send message in inactive chat' || 
        error.message === 'Not authorized to send message in this chat') {
      return failureResponse(res, error.message, 400);
    } else if (error.message === 'File upload failed' || 
               error.message === 'Invalid message type for media upload') {
      return failureResponse(res, error.message, 400);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Get messages by chat ID
 * @route   GET /api/v1/messages/chat/:chat_id
 * @access  Private (User/Admin/Doctor involved in chat)
 */
// Helper function to determine MIME type from file extension
function getMimeTypeFromFileExtension(filename) {
  if (!filename) return 'unknown';
  
  const extension = filename.split('.').pop().toLowerCase();
  
  // Image extensions
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) {
    return `image/${extension === 'jpg' ? 'jpeg' : extension}`;
  }
  
  // Audio extensions
  if (['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(extension)) {
    return `audio/${extension}`;
  }
  
  // Video extensions
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(extension)) {
    return `video/${extension}`;
  }
  
  return 'application/octet-stream';
}

const getMessagesByChat = async (req, res, next) => {
  try {
    const { chat_id } = req.params;
    // Get pagination parameters from query, with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    
    // Validate user permissions
    await validateViewPermissions(chat_id, req.user);
    
    const result = await messageService.getMessagesByChatId(chat_id, page, limit);
    
    // Format messages to match the sendMessage response format
    const formattedMessages = result.messages.map(message => {
      // For messages with files, create a similar format to sendMessage
      if (message.file) {
        return {
          id: message.id,
          chat_id: message.chat_id,
          sender_id: message.sender_id,
          message_type: message.message_type,
          content: message.content,
          read_at: message.read_at,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
          // Add file information
          allFiles: [{
            filename: message.file,
            originalname: message.file,
            mimetype: getMimeTypeFromFileExtension(message.file)
          }]
        };
      }
      // For text messages, return the normal format
      return {
        id: message.id,
        chat_id: message.chat_id,
        sender_id: message.sender_id,
        message_type: message.message_type,
        content: message.content,
        read_at: message.read_at,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt
      };
    });
    
    successResponse(res, {
      messages: formattedMessages,
      pagination: result.pagination
    }, 'Messages retrieved successfully');
  } catch (error) {
    if (error.message === 'Cannot view messages in inactive chat' || 
        error.message === 'Not authorized to view messages in this chat') {
      return failureResponse(res, error.message, 400);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Mark message as read
 * @route   PUT /api/v1/messages/:id/read
 * @access  Private (Recipient/Admin/Doctor)
 */
const markMessageAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate user permissions
    const { message } = await validateReadPermissions(id, req.user);
    
    const updatedMessage = await messageService.markMessageAsRead(id);
    
    successResponse(res, updatedMessage, 'Message marked as read');
  } catch (error) {
    if (error.message === 'Cannot mark own message as read' || 
        error.message === 'Not authorized to mark message as read') {
      return failureResponse(res, error.message, 400);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};



module.exports = {
  sendMessage,
  getMessagesByChat,
  markMessageAsRead
};