const express = require('express');
const router = express.Router();
const {
  initiatePhoneVerification,
  completePhoneVerification,
  registerWithPhoneVerification,
  getPhoneVerificationStatus
} = require('../../controllers/authentication/phoneVerification.controller');

/**
 * @swagger
 * tags:
 *   name: Phone Verification
 *   description: Secure phone number verification using Telegram
 */

/**
 * @swagger
 * /api/auth/verify-phone:
 *   post:
 *     summary: Initiate secure phone verification
 *     tags: [Phone Verification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *                 description: Phone number to verify
 *               userType:
 *                 type: string
 *                 enum: [user, admin]
 *                 default: user
 *                 description: Type of user being verified
 *     responses:
 *       200:
 *         description: Verification initiated successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post('/verify-phone', initiatePhoneVerification);

/**
 * @swagger
 * /api/auth/complete-phone-verification:
 *   post:
 *     summary: Complete phone verification with Telegram token
 *     tags: [Phone Verification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - token
 *               - telegramChatId
 *             properties:
 *               phone:
 *                 type: string
 *                 description: Phone number being verified
 *               token:
 *                 type: string
 *                 description: Verification token received from Telegram
 *               telegramChatId:
 *                 type: string
 *                 description: Telegram chat ID of the user
 *               userType:
 *                 type: string
 *                 enum: [user, admin]
 *                 default: user
 *                 description: Type of user being verified
 *     responses:
 *       200:
 *         description: Phone verification completed successfully
 *       400:
 *         description: Bad request or invalid token
 *       500:
 *         description: Internal server error
 */
router.post('/complete-phone-verification', completePhoneVerification);

/**
 * @swagger
 * /api/auth/register-with-phone:
 *   post:
 *     summary: Register user with pre-verified phone number
 *     tags: [Phone Verification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - full_name
 *               - phone
 *               - password
 *             properties:
 *               full_name:
 *                 type: string
 *                 description: User's full name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email (optional)
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: User's password
 *               phone:
 *                 type: string
 *                 description: Pre-verified phone number
 *     responses:
 *       201:
 *         description: Account registered successfully
 *       400:
 *         description: Bad request or phone not verified
 *       500:
 *         description: Internal server error
 */
router.post('/register-with-phone', registerWithPhoneVerification);

/**
 * @swagger
 * /api/auth/phone-verification-status/{phone}:
 *   get:
 *     summary: Get verification status for a phone number
 *     tags: [Phone Verification]
 *     parameters:
 *       - in: path
 *         name: phone
 *         required: true
 *         schema:
 *           type: string
 *         description: Phone number to check
 *       - in: query
 *         name: userType
 *         schema:
 *           type: string
 *           enum: [user, admin]
 *           default: user
 *         description: Type of user to check
 *     responses:
 *       200:
 *         description: Verification status retrieved successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get('/phone-verification-status/:phone', getPhoneVerificationStatus);

module.exports = router;
