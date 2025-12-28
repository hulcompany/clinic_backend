const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getUsers, getUser, updateUser, deleteUser } = require('../../controllers/authentication/userController');

// Authentication middleware
const authMiddleware = require('../../middleware/auth.middleware');
const { conditionalMediaManagement } = require('../../middleware/mediaUpdate.middleware');
const { checkRestrictedAccess } = require('../../middleware/restrictedAccess.middleware');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 */

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get authenticated user's own profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
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
 *     summary: Update authenticated user's own profile
 *     tags: [Users]
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
 *                 example: "John Smith"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "johnsmith@example.com"
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
 *                 example: "John Smith"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "johnsmith@example.com"
 *               phone:
 *                 type: string
 *                 example: "+1987654321"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: User's profile image
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
 *         description: User profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
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
// Use the media management middleware for profile updates
const profileMediaManagement = conditionalMediaManagement({
  fieldName: 'image',
  contentType: 'users',
  entityType: 'user', // Specify entity type directly
  mediaField: 'image',
  cleanup: true // Cleanup old media when updating
});

router.route('/profile')
  .get(authMiddleware.protect, getProfile)
  .put(authMiddleware.protect, profileMediaManagement, updateProfile);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 10
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
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
router.route('/')
  .get(authMiddleware.protect, authMiddleware.permit('view_users'), getUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get single user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
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
 *               full_name:
 *                 type: string
 *                 example: "John Smith"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "johnsmith@example.com"
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
 *                 example: "John Smith"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "johnsmith@example.com"
 *               phone:
 *                 type: string
 *                 example: "+1987654321"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: User's profile image
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
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 */
// Use the media management middleware for user updates
const userMediaManagement = conditionalMediaManagement({
  fieldName: 'image',
  contentType: 'users',
  entityType: 'user', // Specify entity type directly
  mediaField: 'image',
  cleanup: true // Cleanup old media when updating
});

router.route('/:id')
  .get(authMiddleware.protect, authMiddleware.permit('view_users'), checkRestrictedAccess, getUser)
  .put(authMiddleware.protect, authMiddleware.permit('update_user'), checkRestrictedAccess, userMediaManagement, updateUser)
  .delete(authMiddleware.protect, authMiddleware.permit('delete_user'), checkRestrictedAccess, deleteUser);

module.exports = router;