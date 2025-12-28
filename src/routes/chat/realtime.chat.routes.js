const express = require('express');
const router = express.Router();
const { 
  initializeChat,
  joinChatRoom,
  leaveChatRoom,
  sendRealTimeMessage,
  getOnlineStatus
} = require('../../controllers/chat/realtimeChat.controller');
const authMiddleware = require('../../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Real-time Chat
 *   description: Real-time chat functionality using WebSocket
 */

/**
 * @swagger
 * /initialize:
 *   post:
 *     summary: Initialize real-time chat connection
 *     tags: [Real-time Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - consultation_id
 *             properties:
 *               consultation_id:
 *                 type: integer
 *                 description: Consultation ID to initialize chat for
 *     responses:
 *       200:
 *         description: Chat initialized successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Chat not found
 *       500:
 *         description: Internal server error
 */
router.post('/initialize', authMiddleware.protect, initializeChat);

/**
 * @swagger
 * /{chat_id}/join:
 *   post:
 *     summary: Join a chat room
 *     tags: [Real-time Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chat_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Chat ID
 *     responses:
 *       200:
 *         description: Successfully joined chat room
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Chat not found
 *       500:
 *         description: Internal server error
 */
router.post('/:chat_id/join', authMiddleware.protect, joinChatRoom);

/**
 * @swagger
 * /{chat_id}/leave:
 *   post:
 *     summary: Leave a chat room
 *     tags: [Real-time Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chat_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Chat ID
 *     responses:
 *       200:
 *         description: Successfully left chat room
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Chat not found
 *       500:
 *         description: Internal server error
 */
router.post('/:chat_id/leave', authMiddleware.protect, leaveChatRoom);

/**
 * @swagger
 * /{chat_id}/send-realtime:
 *   post:
 *     summary: Send real-time message
 *     tags: [Real-time Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chat_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Chat ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Message content
 *               message_type:
 *                 type: string
 *                 enum: [text, image, video, audio]
 *                 default: text
 *                 description: Type of message
 *               file_url:
 *                 type: string
 *                 description: URL of file (required for media messages)
 *     responses:
 *       200:
 *         description: Message sent successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Chat not found
 *       500:
 *         description: Internal server error
 */
router.post('/:chat_id/send-realtime', authMiddleware.protect, sendRealTimeMessage);

/**
 * @swagger
 * /{chat_id}/online-status:
 *   get:
 *     summary: Get online status of chat participants
 *     tags: [Real-time Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chat_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Chat ID
 *     responses:
 *       200:
 *         description: Online status retrieved successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Chat not found
 *       500:
 *         description: Internal server error
 */
router.get('/:chat_id/online-status', authMiddleware.protect, getOnlineStatus);

module.exports = router;