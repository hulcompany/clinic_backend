const express = require('express');
const { 
  createLandingImage, 
  getAllLandingImages, 
  getLandingImagesBySection, 
  getLandingImageById, 
  updateLandingImage, 
  deleteLandingImage,  
  toggleLandingImageStatus
} = require('../controllers/landingImage.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { conditionalMediaManagement, deleteMediaCleanup } = require('../middleware/mediaUpdate.middleware');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Landing Images
 *   description: Landing page images management
 */

 
/**
 * @swagger
 * /api/v1/landing-images:
 *   get:
 *     summary: Get all active landing images
 *     tags: [Landing Images]
 *     parameters:
 *       - in: query
 *         name: sections
 *         schema:
 *           type: string
 *         description: Comma-separated list of sections to filter (hero, about, story)
 *     responses:
 *       200:
 *         description: Landing images retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/', getAllLandingImages);

/**
 * @swagger
 * /api/v1/landing-images/section/{section}:
 *   get:
 *     summary: Get landing images by section
 *     tags: [Landing Images]
 *     parameters:
 *       - in: path
 *         name: section
 *         required: true
 *         schema:
 *           type: string
 *           enum: [hero, about, story]
 *         description: Section to filter by
 *     responses:
 *       200:
 *         description: Landing images retrieved successfully
 *       404:
 *         description: Landing images not found
 *       500:
 *         description: Internal server error
 */
router.get('/section/:section', getLandingImagesBySection);

/**
 * @swagger
 * /api/v1/landing-images/{id}:
 *   get:
 *     summary: Get landing image by ID
 *     tags: [Landing Images]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Landing image ID
 *     responses:
 *       200:
 *         description: Landing image retrieved successfully
 *       404:
 *         description: Landing image not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', getLandingImageById);


/**
 * @swagger
 * /api/v1/landing-images:
 *   post:
 *     summary: Create a new landing image
 *     tags: [Landing Images]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *               - section
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Landing image file
 *               section:
 *                 type: string
 *                 enum: [hero, about, story]
 *                 description: Section where the image will be displayed
 *               display_order:
 *                 type: integer
 *                 description: Order to display the image (default: 0)
 *               is_active:
 *                 type: boolean
 *                 description: Whether the image is active (default: true)
 *     responses:
 *       201:
 *         description: Landing image created successfully
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
    contentType: 'landing_images',
    fieldName: 'image',
    mediaField: 'image',
    cleanup: false, // No cleanup needed for new landing images
    uploadType: 'single',
    mediaType: 'image'
  }),
  createLandingImage
);

/**
 * @swagger
 * /api/v1/landing-images/{id}:
 *   put:
 *     summary: Update landing image
 *     tags: [Landing Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Landing image ID
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: New landing image file
 *               section:
 *                 type: string
 *                 enum: [hero, about, story]
 *                 description: Section where the image will be displayed
 *               display_order:
 *                 type: integer
 *                 description: Order to display the image
 *               is_active:
 *                 type: boolean
 *                 description: Whether the image is active
 *     responses:
 *       200:
 *         description: Landing image updated successfully
 *       400:
 *         description: Bad request
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Landing image not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', 
  authMiddleware.protect, 
  conditionalMediaManagement({
    contentType: 'landing_images',
    fieldName: 'image',
    mediaField: 'image',
    entityType: 'landing_image', // Specify entity type for proper cleanup
    cleanup: true, // Cleanup old image when updating
    uploadType: 'single',
    mediaType: 'image'
  }),
  updateLandingImage
);

/**
 * @swagger
 * /api/v1/landing-images/{id}:
 *   delete:
 *     summary: Delete landing image
 *     tags: [Landing Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Landing image ID
 *     responses:
 *       200:
 *         description: Landing image deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Landing image not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', 
  authMiddleware.protect, 
  deleteMediaCleanup({
    entityType: 'landing_image',
    contentType: 'landing_images',
    mediaField: 'image',
    mediaType: 'images'
  }),
  deleteLandingImage
);

/**
 * @swagger
 * /api/v1/landing-images/{id}/toggle-status:
 *   put:
 *     summary: Toggle landing image active status
 *     tags: [Landing Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Landing image ID
 *     responses:
 *       200:
 *         description: Landing image status updated successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Landing image not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id/toggle-status', 
  authMiddleware.protect, 
  toggleLandingImageStatus
);

module.exports = router;