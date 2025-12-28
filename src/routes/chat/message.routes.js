const express = require('express');
const router = express.Router();
const { 
  sendMessage,
  getMessagesByChat,
  markMessageAsRead
} = require('../../controllers/chat/messageController');
const authMiddleware = require('../../middleware/auth.middleware');
const { uploadImage, uploadVideo, uploadAudio } = require('../../utils/allMediaUploadUtil');
const { createUploader } = require('../../utils/mediaHelper');

// Simple middleware for handling file uploads for messages
const messageMediaManagement = (req, res, next) => {
  // Check if request is multipart/form-data (contains file uploads)
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    // Create uploader that expects a field named 'file' (supporting multiple files)
    const upload = createUploader('messages', 'file', 'array', 10); // Allow up to 10 files
    
    // Execute the upload middleware
    upload(req, res, (err) => {
      if (err) {
        // Handle specific multer errors
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            status: 'failure',
            message: 'Unexpected field in form data. Please ensure your form field is named "file".'
          });
        }
        return next(err);
      }
      next();
    });
  } else {
    // If not multipart/form-data, continue without media handling
    next();
  }
};

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Message management
 */





/**
 * @swagger
 * /:
 *   post:
 *     summary: Send a new message (supports both JSON and multipart/form-data, including multiple file uploads)
 *     description: Send a new message (text or media). For media messages, first upload files using /upload-media endpoint.
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - chat_id
 *             properties:
 *               chat_id:
 *                 type: integer
 *                 description: ID of the chat to send message to
 *               message_type:
 *                 type: string
 *                 enum: [text, image, video, audio]
 *                 default: text
 *                 description: Type of message
 *               content:
 *                 type: string
 *                 description: Text content (required for text messages)
 *               file_url:
 *                 type: string
 *                 description: URL of file (required for media messages)
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - chat_id
 *             properties:
 *               chat_id:
 *                 type: integer
 *                 description: ID of the chat to send message to
 *               content:
 *                 type: string
 *                 description: Text content (optional for media messages)
 *               file:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: One or more media files to upload (images, audio, or video)
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.post('/', authMiddleware.protect, messageMediaManagement, sendMessage);

/**
 * @swagger
 * /chat/{chat_id}:
 *   get:
 *     summary: Get messages by chat ID
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chat_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Chat ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of messages per page
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     messages:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Message'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalItems:
 *                           type: integer
 *                         itemsPerPage:
 *                           type: integer
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get('/chat/:chat_id', authMiddleware.protect, getMessagesByChat);

/**
 * @swagger
 * /{id}/read:
 *   put:
 *     summary: Mark message as read
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Message ID
 *     responses:
 *       200:
 *         description: Message marked as read
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Message not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id/read', authMiddleware.protect, markMessageAsRead);

module.exports = router;