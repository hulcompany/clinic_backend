const express = require('express');
const { 
  getContactInfo, 
  getAllContactRecords, 
  getContactInfoById, 
  createContactInfo, 
  updateContactInfo, 
  deleteContactInfo,
  toggleContactStatus
} = require('../controllers/contactUs.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { conditionalMediaManagement, deleteMediaCleanup } = require('../middleware/mediaUpdate.middleware');

const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Contact Us
 *   description: Contact information management
 */

/**
 * @swagger
 * /api/v1/contact-us:
 *   get:
 *     summary: Get contact information
 *     tags: [Contact Us]
 *     responses:
 *       200:
 *         description: Contact information retrieved successfully
 *       404:
 *         description: Contact information not found
 *       500:
 *         description: Internal server error
 */
router.get('/', getContactInfo);

/**
 * @swagger
 * /api/v1/contact-us/all:
 *   get:
 *     summary: Get all contact records (admin only)
 *     tags: [Contact Us]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number (default: 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of records per page (default: 10)
 *     responses:
 *       200:
 *         description: Contact records retrieved successfully
 *       403:
 *         description: Not authorized
 *       500:
 *         description: Internal server error
 */
router.get('/all', 
  authMiddleware.protect, 
  getAllContactRecords
);

/**
 * @swagger
 * /api/v1/contact-us/{id}:
 *   get:
 *     summary: Get contact info by ID (admin only)
 *     tags: [Contact Us]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Contact record ID
 *     responses:
 *       200:
 *         description: Contact information retrieved successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Contact information not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', 
  authMiddleware.protect, 
  getContactInfoById
);

/**
 * @swagger
 * /api/v1/contact-us:
 *   post:
 *     summary: Create new contact information
 *     tags: [Contact Us]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - phone_numbers
 *               - social_media
 *               - email
 *             properties:
 *               phone_numbers:
 *                 type: string
 *                 description: Phone numbers in JSON format [{"type": "mobile", "number": "+1234567890"}]
 *               social_media:
 *                 type: string
 *                 description: Social media links in JSON format [{"platform": "facebook", "url": "https://facebook.com/example"}]
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Contact email
 *               address:
 *                 type: string
 *                 description: Address in JSON format {"ar": "العنوان", "en": "Address"}
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Contact image
 *     responses:
 *       201:
 *         description: Contact information created successfully
 *       400:
 *         description: Bad request
 *       403:
 *         description: Not authorized
 *       500:
 *         description: Internal server error
 */
router.post('/', 
  authMiddleware.protect, 
  conditionalMediaManagement({
    contentType: 'contact',
    fieldName: 'image',
    mediaField: 'image',
    cleanup: false, // No cleanup needed for new contact records
    uploadType: 'single',
    mediaType: 'image'
  }),
  createContactInfo
);/**
 * @swagger
 * /api/v1/contact-us/{id}:
 *   put:
 *     summary: Update contact information
 *     tags: [Contact Us]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Contact record ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               phone_numbers:
 *                 type: string
 *                 description: Phone numbers in JSON format [{"type": "mobile", "number": "+1234567890"}]
 *               social_media:
 *                 type: string
 *                 description: Social media links in JSON format [{"platform": "facebook", "url": "https://facebook.com/example"}]
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Contact email
 *               address:
 *                 type: string
 *                 description: Address in JSON format {"ar": "العنوان", "en": "Address"}
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Contact image
 *     responses:
 *       200:
 *         description: Contact information updated successfully
 *       400:
 *         description: Bad request
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Contact information not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', 
  authMiddleware.protect, 
  conditionalMediaManagement({
    contentType: 'contact',
    fieldName: 'image',
    mediaField: 'image',
    entityType: 'contact', // Specify entity type for proper cleanup
    cleanup: true, // Cleanup old image when updating
    uploadType: 'single',
    mediaType: 'image'
  }),
  updateContactInfo
);
/**
 * @swagger
 * /api/v1/contact-us/{id}:
 *   delete:
 *     summary: Delete contact information
 *     tags: [Contact Us]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Contact record ID
 *     responses:
 *       200:
 *         description: Contact information deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Contact information not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', 
  authMiddleware.protect, 
  deleteMediaCleanup({
    entityType: 'contact',
    contentType: 'contact',
    mediaField: 'image',
    mediaType: 'images'
  }),
  deleteContactInfo
);

/**
 * @swagger
 * /api/v1/contact-us/{id}/toggle-status:
 *   put:
 *     summary: Toggle contact information active status
 *     tags: [Contact Us]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Contact information ID
 *     responses:
 *       200:
 *         description: Contact status updated successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Contact information not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id/toggle-status', 
  authMiddleware.protect, 
  toggleContactStatus
);

module.exports = router;