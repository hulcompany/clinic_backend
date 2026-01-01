const express = require('express');
const { getProfile, updateProfile, register, verifyOTP, resendOTP, login, logout, forgotPassword, resetPassword,toggleUserRestriction, registerSecretaryByDoctor, assignSecretaryToDoctor, getSecretariesByDoctor, sendOTPPhone } = require('../../controllers/authentication/adminController');
const authMiddleware = require('../../middleware/auth.middleware');
const { conditionalMediaManagement } = require('../../middleware/mediaUpdate.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Administration
 *   description: Admin management endpoints
 */

/**
 * @swagger
 * /api/admin/profile:
 *   get:
 *     summary: Get authenticated admin's own profile
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin profile data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Admin'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Admin not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   put:
 *     summary: Update authenticated admin's own profile
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: "Dr. John Smith"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "dr.johnsmith@example.com"
 *               phone:
 *                 type: string
 *                 example: "+1987654321"
 *               image:
 *                 type: string
 *                 format: uri
 *                 example: "https://example.com/new-profile.jpg"
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: "Dr. John Smith"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "dr.johnsmith@example.com"
 *               phone:
 *                 type: string
 *                 example: "+1987654321"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Admin's profile image
 *     parameters:
 *       - in: query
 *         name: compression
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *         description: Image compression ratio (0-100, where 100 is no compression)
 *       - in: query
 *         name: contentType
 *         schema:
 *           type: string
 *         description: Content type for folder organization
 *     responses:
 *       200:
 *         description: Admin profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Admin'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Admin not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Use the media management middleware for admin profile updates
const adminProfileMediaManagement = conditionalMediaManagement({
  fieldName: 'image',
  contentType: 'admins',
  entityType: 'admin', // Specify entity type directly
  mediaField: 'image',
  cleanup: true // Cleanup old media when updating
});

router.route('/profile')
  .get(authMiddleware.protect, getProfile)
  .put(authMiddleware.protect, adminProfileMediaManagement, updateProfile);

/**
 * @swagger
 * /api/admin/register:
 *   post:
 *     summary: Register a new admin
 *     tags: [Administration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - full_name
 *             properties:
 *               full_name:
 *                 type: string
 *                 description: Admin's full name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Admin's email address
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Admin's password (min 6 characters)
 *               phone:
 *                 type: string
 *                 description: Admin's phone number
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - full_name
 *             properties:
 *               full_name:
 *                 type: string
 *                 description: Admin's full name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Admin's email address
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Admin's password (min 6 characters)
 *               phone:
 *                 type: string
 *                 description: Admin's phone number
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Admin's profile image
 *     parameters:
 *       - in: query
 *         name: compression
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *         description: Image compression ratio (0-100, where 100 is no compression)
 *       - in: query
 *         name: contentType
 *         schema:
 *           type: string
 *         description: Content type for folder organization
 *     responses:
 *       201:
 *         description: Admin registered successfully
 *       400:
 *         description: Bad request or admin already exists
 *       500:
 *         description: Internal server error
 */
// Use the media management middleware for admin registration
const adminMediaManagement = conditionalMediaManagement({
  fieldName: 'image',
  contentType: 'admins',
  entityType: 'admin', // Specify entity type directly
  mediaField: 'image',
  cleanup: false // No cleanup needed for registration (new admin)
});

router.post('/register', 
  adminMediaManagement,
  register
);

/**
 * @swagger
 * /api/admin/verify-otp:
 *   post:
 *     summary: Verify admin email with OTP
 *     tags: [Administration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otpCode
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Admin's email address
 *               otpCode:
 *                 type: string
 *                 description: 6-digit OTP code sent to admin's email
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired OTP
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Internal server error
 */
router.post('/verify-otp', verifyOTP);

/**
 * @swagger
 * /api/admin/resend-otp:
 *   post:
 *     summary: Resend OTP to admin's email
 *     tags: [Administration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Admin's email address
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Internal server error
 */
router.post('/resend-otp', resendOTP);

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     summary: Login admin
 *     tags: [Administration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Admin's email address
 *               password:
 *                 type: string
 *                 description: Admin's password
 *     responses:
 *       200:
 *         description: Admin logged in successfully
 *       401:
 *         description: Invalid credentials or unverified email
 *       500:
 *         description: Internal server error
 */
router.post('/login', 
  authMiddleware.loginRateLimit,
  login
);

/**
 * @swagger
 * /api/admin/logout:
 *   post:
 *     summary: Logout admin
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token to invalidate
 *     responses:
 *       200:
 *         description: Admin logged out successfully
 *       500:
 *         description: Internal server error
 */
router.post('/logout', authMiddleware.protect, logout);

/**
 * @swagger
 * /api/admin/forgot-password:
 *   post:
 *     summary: Request password reset OTP for admin
 *     tags: [Administration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Admin's email address
 *     responses:
 *       200:
 *         description: Password reset OTP sent successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Internal server error
 */
router.post('/forgot-password', forgotPassword);

/**
 * @swagger
 * /api/admin/reset-password:
 *   post:
 *     summary: Reset admin password with OTP
 *     tags: [Administration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otpCode
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Admin's email address
 *               otpCode:
 *                 type: string
 *                 description: 6-digit OTP code sent to admin's email
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: New password (min 6 characters)
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Bad request or invalid OTP
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Internal server error
 */
router.post('/reset-password', resetPassword);

// User restriction toggle route (only for doctors)
router.route('/users/:id/toggle-restriction')
  .put(authMiddleware.protect, authMiddleware.authorize('doctor', 'admin', 'super_admin'), toggleUserRestriction);

/**
 * @swagger
 * /api/admin/register-secretary:
 *   post:
 *     summary: Register secretary by doctor (doctor only)
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *                 description: Secretary's full name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Secretary's email address
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Secretary's password (min 6 characters)
 *               phone:
 *                 type: string
 *                 description: Secretary's phone number
 *               role:
 *                 type: string
 *                 enum: [secretary]
 *                 description: Secretary's role (automatically set to secretary)
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *                 description: Secretary's full name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Secretary's email address
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Secretary's password (min 6 characters)
 *               phone:
 *                 type: string
 *                 description: Secretary's phone number
 *               role:
 *                 type: string
 *                 enum: [secretary]
 *                 description: Secretary's role (automatically set to secretary)
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Secretary's profile image
 *     parameters:
 *       - in: query
 *         name: compression
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *         description: Image compression ratio (0-100, where 100 is no compression)
 *       - in: query
 *         name: contentType
 *         schema:
 *           type: string
 *         description: Content type for folder organization
 *     responses:
 *       201:
 *         description: Secretary registered successfully
 *       400:
 *         description: Bad request or admin already exists
 *       401:
 *         description: Unauthorized - only doctors can register secretaries
 *       500:
 *         description: Internal server error
 */
const secretaryMediaManagement = conditionalMediaManagement({
  fieldName: 'image',
  contentType: 'admins',
  entityType: 'admin',
  mediaField: 'image',
  cleanup: false
});

router.post('/register-secretary', 
  authMiddleware.protect,
  authMiddleware.authorize('doctor', 'admin', 'super_admin'),
  secretaryMediaManagement,
  registerSecretaryByDoctor
);

/**
 * @swagger
 * /api/admin/secretaries/{secretaryId}/assign-to-doctor/{doctorId}:
 *   put:
 *     summary: Assign secretary to doctor (admin only)
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: secretaryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the secretary to assign
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the doctor to assign the secretary to
 *     responses:
 *       200:
 *         description: Secretary assigned successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized - only admins can assign secretaries
 *       404:
 *         description: Secretary or doctor not found
 *       500:
 *         description: Internal server error
 */
router.put('/secretaries/:secretaryId/assign-to-doctor/:doctorId',
  authMiddleware.protect,
  authMiddleware.authorize('admin', 'super_admin'),
  assignSecretaryToDoctor
);

/**
 * @swagger
 * /api/admin/doctors/{doctorId}/secretaries:
 *   get:
 *     summary: Get secretaries by doctor
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the doctor to get secretaries for
 *     responses:
 *       200:
 *         description: List of secretaries retrieved successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Doctor not found
 *       500:
 *         description: Internal server error
 */
router.get('/doctors/:doctorId/secretaries',
  authMiddleware.protect,
  getSecretariesByDoctor
);

/**
 * @swagger
 * /api/admin/send-otp-phone:
 *   post:
 *     summary: Send OTP via phone number (Telegram)
 *     tags: [Administration]
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
 *                 description: Admin's phone number
 *     responses:
 *       200:
 *         description: OTP sent successfully via Telegram
 *       400:
 *         description: Bad request
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Internal server error
 */
router.post('/send-otp-phone', sendOTPPhone);

module.exports = router;
