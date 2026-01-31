const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const {
  getActivePaymentMethods,
  getAllPaymentMethods,
  getPaymentMethodById,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod
} = require('../controllers/paymentMethod.controller');

/**
 * @swagger
 * tags:
 *   name: Payment Methods
 *   description: Payment methods management
 */

/**
 * @swagger
 * /api/v1/payment-methods:
 *   get:
 *     summary: Get all active payment methods
 *     tags: [Payment Methods]
 *     responses:
 *       200:
 *         description: Payment methods retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/', getActivePaymentMethods);

/**
 * @swagger
 * /api/v1/payment-methods/all:
 *   get:
 *     summary: Get all payment methods (admin only)
 *     tags: [Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment methods retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get('/all', authMiddleware.protect, getAllPaymentMethods);

/**
 * @swagger
 * /api/v1/payment-methods/{id}:
 *   get:
 *     summary: Get payment method by ID
 *     tags: [Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Payment method ID
 *     responses:
 *       200:
 *         description: Payment method retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Payment method not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', authMiddleware.protect, getPaymentMethodById);

/**
 * @swagger
 * /api/v1/payment-methods:
 *   post:
 *     summary: Create a new payment method
 *     tags: [Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Payment method name
 *               description:
 *                 type: string
 *                 description: Payment method description
 *               account_number:
 *                 type: string
 *                 description: Account number
 *               account_name:
 *                 type: string
 *                 description: Account holder name
 *               bank_name:
 *                 type: string
 *                 description: Bank name
 *               qr_code:
 *                 type: string
 *                 format: binary
 *                 description: QR code image
 *     responses:
 *       201:
 *         description: Payment method created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.post('/', authMiddleware.protect, createPaymentMethod);

/**
 * @swagger
 * /api/v1/payment-methods/{id}:
 *   put:
 *     summary: Update payment method
 *     tags: [Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Payment method ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Payment method name
 *               description:
 *                 type: string
 *                 description: Payment method description
 *               account_number:
 *                 type: string
 *                 description: Account number
 *               account_name:
 *                 type: string
 *                 description: Account holder name
 *               bank_name:
 *                 type: string
 *                 description: Bank name
 *               is_active:
 *                 type: boolean
 *                 description: Is payment method active
 *               qr_code:
 *                 type: string
 *                 format: binary
 *                 description: QR code image
 *     responses:
 *       200:
 *         description: Payment method updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Payment method not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', authMiddleware.protect, updatePaymentMethod);

/**
 * @swagger
 * /api/v1/payment-methods/{id}:
 *   delete:
 *     summary: Delete payment method
 *     tags: [Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Payment method ID
 *     responses:
 *       200:
 *         description: Payment method deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Payment method not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', authMiddleware.protect, deletePaymentMethod);

module.exports = router;
