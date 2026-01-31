const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const {
  createPayment,
  getPaymentById,
  getUserPayments,
  getAllPayments,
  updatePaymentStatus,
  canCreateConsultation
} = require('../controllers/payment.controller');

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment management for consultations
 */

/**
 * @swagger
 * /api/v1/payments:
 *   post:
 *     summary: Create a new payment request
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               consultation_fee:
 *                 type: number
 *                 description: Required consultation fee
 *               payment_amount:
 *                 type: number
 *                 description: Actual amount paid (optional)
 *               payment_proof:
 *                 type: string
 *                 format: binary
 *                 description: Payment proof image
 *     responses:
 *       201:
 *         description: Payment request created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.post('/', authMiddleware.protect, createPayment);

/**
 * @swagger
 * /api/v1/payments/{id}:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', authMiddleware.protect, getPaymentById);

/**
 * @swagger
 * /api/v1/payments/my-payments:
 *   get:
 *     summary: Get current user's payments
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, paid, rejected]
 *         description: Filter by payment status
 *     responses:
 *       200:
 *         description: Payments retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/my-payments', authMiddleware.protect, getUserPayments);

/**
 * @swagger
 * /api/v1/payments:
 *   get:
 *     summary: Get all payments (admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, paid, rejected]
 *         description: Filter by payment status
 *     responses:
 *       200:
 *         description: Payments retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get('/', authMiddleware.protect, getAllPayments);

/**
 * @swagger
 * /api/v1/payments/{id}/status:
 *   put:
 *     summary: Update payment status (verify/reject)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Payment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [paid, rejected]
 *                 description: New payment status
 *               rejection_reason:
 *                 type: string
 *                 description: Reason for rejection (required if status is rejected)
 *     responses:
 *       200:
 *         description: Payment status updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id/status', authMiddleware.protect, updatePaymentStatus);

/**
 * @swagger
 * /api/v1/payments/can-create-consultation:
 *   get:
 *     summary: Check if user can create consultation (has paid)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment status checked successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/can-create-consultation', authMiddleware.protect, canCreateConsultation);

module.exports = router;
