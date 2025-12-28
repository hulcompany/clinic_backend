const express = require('express');
const router = express.Router();
const { 
  getAllSessions,
  getSessionById,
  getSessionsByDoctorId,
  createSession,
  updateSession,
  deleteSession,
  toggleSessionStatus
} = require('../controllers/session.controller');
const authMiddleware = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Sessions
 *   description: Meeting session management (Google Meet, WhatsApp, etc.)
 */

/**
 * @swagger
 * /sessions:
 *   get:
 *     summary: Get all sessions
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Sessions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get('/', authMiddleware.protect, getAllSessions);

/**
 * @swagger
 * /sessions/{id}:
 *   get:
 *     summary: Get session by ID
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Session retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Session not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', authMiddleware.protect, getSessionById);

/**
 * @swagger
 * /sessions/doctor/{doctor_id}:
 *   get:
 *     summary: Get sessions by doctor ID
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctor_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Sessions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get('/doctor/:doctor_id', authMiddleware.protect, getSessionsByDoctorId);

/**
 * @swagger
 * /sessions:
 *   post:
 *     summary: Create a new session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - link
 *               - link_type
 *             properties:
 *               link:
 *                 type: string
 *                 description: Meeting link URL
 *               link_type:
 *                 type: string
 *                 enum: [google_meet, whatsapp, zoom, teams, other]
 *                 description: Type of meeting link
 *               doctor_id:
 *                 type: integer
 *                 description: Doctor ID (admins only)
 *     responses:
 *       201:
 *         description: Session created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.post('/', authMiddleware.protect, createSession);

/**
 * @swagger
 * /sessions/{id}:
 *   put:
 *     summary: Update session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               link:
 *                 type: string
 *                 description: Meeting link URL
 *               link_type:
 *                 type: string
 *                 enum: [google_meet, whatsapp, zoom, teams, other]
 *                 description: Type of meeting link
 *     responses:
 *       200:
 *         description: Session updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Session not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', authMiddleware.protect, updateSession);

/**
 * @swagger
 * /sessions/{id}:
 *   delete:
 *     summary: Delete session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Session deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Session not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', authMiddleware.protect, deleteSession);

/**
 * @swagger
 * /sessions/{id}/toggle-status:
 *   put:
 *     summary: Toggle session active status
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Session status updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Session not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id/toggle-status', authMiddleware.protect, toggleSessionStatus);

module.exports = router;