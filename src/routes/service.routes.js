const express = require('express');
const { 
  getAllServices, 
  getServiceById, 
  createService, 
  updateService, 
  deleteService, 
  toggleServiceStatus 
} = require('../controllers/service.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { conditionalMediaManagement, deleteMediaCleanup } = require('../middleware/mediaUpdate.middleware');
const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Services
 *   description: Clinic services management
 */

/**
 * @swagger
 * /api/v1/services:
 *   get:
 *     summary: Get all services
 *     tags: [Services]
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
 *         description: Number of services per page (default: 10)
 *     responses:
 *       200:
 *         description: Services retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/', getAllServices);

/**
 * @swagger
 * /api/v1/services/{id}:
 *   get:
 *     summary: Get service by ID
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Service ID
 *     responses:
 *       200:
 *         description: Service retrieved successfully
 *       404:
 *         description: Service not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', getServiceById);


/**
 * @swagger
 * /api/v1/services:
 *   post:
 *     summary: Create a new service
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *                 description: Service name in JSON format {"ar": "الاسم", "en": "Name"}
 *               description:
 *                 type: string
 *                 description: Service description in JSON format {"ar": "الوصف", "en": "Description"}
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Service image
 *     responses:
 *       201:
 *         description: Service created successfully
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
    contentType: 'services',
    fieldName: 'image',
    mediaField: 'image',
    cleanup: false, // No cleanup needed for new services
    uploadType: 'single',
    mediaType: 'image'
  }),
  createService
);
/**
 * @swagger
 * /api/v1/services/{id}:
 *   put:
 *     summary: Update service
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Service ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Service name in JSON format {"ar": "الاسم", "en": "Name"}
 *               description:
 *                 type: string
 *                 description: Service description in JSON format {"ar": "الوصف", "en": "Description"}
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Service image
 *     responses:
 *       200:
 *         description: Service updated successfully
 *       400:
 *         description: Bad request
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Service not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', 
  authMiddleware.protect, 
  conditionalMediaManagement({
    contentType: 'services',
    fieldName: 'image',
    mediaField: 'image',
    entityType: 'service', // Specify entity type for proper cleanup
    cleanup: true, // Cleanup old image when updating
    uploadType: 'single',
    mediaType: 'image'
  }),
  updateService
);
/**
 * @swagger
 * /api/v1/services/{id}:
 *   delete:
 *     summary: Delete service
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Service ID
 *     responses:
 *       200:
 *         description: Service deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Service not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', 
  authMiddleware.protect, 
  deleteMediaCleanup({
    entityType: 'service',
    contentType: 'services',
    mediaField: 'image',
    mediaType: 'images'
  }),
  deleteService
);

/**
 * @swagger
 * /api/v1/services/{id}/toggle-status:
 *   put:
 *     summary: Toggle service active status
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Service ID
 *     responses:
 *       200:
 *         description: Service status updated successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Service not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id/toggle-status', 
  authMiddleware.protect, 
  toggleServiceStatus
);

module.exports = router;