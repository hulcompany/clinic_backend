const express = require('express');
const { 
  getAllBeforeAfters, 
  getBeforeAfterById, 
  createBeforeAfter, 
  updateBeforeAfter, 
  deleteBeforeAfter, 
  toggleBeforeAfterStatus 
} = require('../controllers/beforeAfter.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { conditionalMediaManagement, deleteMediaCleanup } = require('../middleware/mediaUpdate.middleware');
const router= express.Router();
/**
 * @swagger
 * tags:
 *   name: BeforeAfter
 *  description: Before/After images management
 */

/**
 * @swagger
 * /api/v1/before-after:
 *  get:
 *     summary: Get all before/after records
 *     tags: [BeforeAfter]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *          type: integer
 *           minimum: 1
 *        description: Page number(default: 1)
 *       - in: query
 *         name: limit
 *         schema:
 *          type: integer
 *           minimum: 1
 *           maximum: 100
 *        description: Number of records per page (default: 10)
 *       - in: query
 *         name: service_id
 *         schema:
 *          type: integer
 *        description: Filter by service ID
 *     responses:
 *      200:
 *        description: Before/after records retrieved successfully
 *      500:
 *        description: Internal server error
 */
router.get('/', getAllBeforeAfters);

/**
 * @swagger
 * /api/v1/before-after/{id}:
 *  get:
 *     summary: Get before/after record by ID
 *     tags: [BeforeAfter]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *          type: integer
 *        description: Before/after record ID
 *     responses:
 *      200:
 *        description: Before/after record retrieved successfully
 *       404:
 *        description: Before/after record not found
 *      500:
 *        description: Internal server error
 */
router.get('/:id', getBeforeAfterById);


/**
 * @swagger
 * /api/v1/before-after:
 *   post:
 *     summary: Create a new before/after record
 *     tags: [BeforeAfter]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *      content:
 *         multipart/form-data:
 *           schema:
 *            type: object
 *             required:
 *               - title
 *               - before_image
 *               - after_image
 *             properties:
 *              title:
 *                type: string
 *                description: Title for the before/after record
 *              description:
 *                type: string
 *                description: Description of the treatment/procedure
 *               service_id:
 *                type: integer
 *                description: Associated service ID
 *               before_image:
 *                type: string
 *                 format: binary
 *                description: Before image
 *               after_image:
 *                type: string
 *                 format: binary
 *                description: After image
 *     responses:
 *      201:
 *        description: Before/after record created successfully
 *      400:
 *        description: Bad request
 *       403:
 *        description: Not authorized
 *      500:
 *        description: Internal server error
 */
router.post('/', 
  authMiddleware.protect, 
 conditionalMediaManagement({
   contentType: 'before_after',
    fieldName: ['before_image', 'after_image'],
   mediaField: ['before_image', 'after_image'],
    cleanup: false, // No cleanup needed for new records
    uploadType: 'fields',
   mediaType: 'image'
  }),
  createBeforeAfter
);
/**
 * @swagger
 * /api/v1/before-after/{id}:
 *   put:
 *     summary: Update before/after record
 *     tags: [BeforeAfter]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *          type: integer
 *        description: Before/after record ID
 *     requestBody:
 *       required: true
 *      content:
 *         multipart/form-data:
 *           schema:
 *            type: object
 *             properties:
 *              title:
 *                type: string
 *                description: Title for the before/after record
 *              description:
 *                type: string
 *                description: Description of the treatment/procedure
 *               service_id:
 *                type: integer
 *                description: Associated service ID
 *               before_image:
 *                type: string
 *                 format: binary
 *                description: Before image (optional, preserves existing if not provided)
 *               after_image:
 *                type: string
 *                 format: binary
 *                description: After image (optional, preserves existing if not provided)
 *     responses:
 *      200:
 *        description: Before/after record updated successfully
 *      400:
 *        description: Bad request
 *       403:
 *        description: Not authorized
 *       404:
 *        description: Before/after record not found
 *      500:
 *        description: Internal server error
 */
router.put('/:id', 
  authMiddleware.protect, 
 conditionalMediaManagement({
   contentType: 'before_after',
    fieldName: ['before_image', 'after_image'],
   mediaField: ['before_image', 'after_image'],
    entityType: 'before_after', // Specify entity type for proper cleanup
    cleanup: true, // Cleanup old images when updating
    uploadType: 'fields',
   mediaType: 'image'
  }),
  updateBeforeAfter
);
/**
 * @swagger
 * /api/v1/before-after/{id}:
 *  delete:
 *     summary: Delete before/after record
 *     tags: [BeforeAfter]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *          type: integer
 *        description: Before/after record ID
 *     responses:
 *      200:
 *        description: Before/after record deleted successfully
 *       403:
 *        description: Not authorized
 *      404:
 *        description: Before/after record not found
 *      500:
 *        description: Internal server error
 */
router.delete('/:id', 
  authMiddleware.protect, 
  deleteMediaCleanup({
    entityType: 'before_after',
   contentType: 'before_after',
   mediaField: ['before_image', 'after_image'],
   mediaType: 'images'
  }),
  deleteBeforeAfter
);

/**
 * @swagger
 * /api/v1/before-after/{id}/toggle-status:
 *   put:
 *     summary: Toggle before/after record active status
 *     tags: [BeforeAfter]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *          type: integer
 *        description: Before/after record ID
 *     responses:
 *      200:
 *        description: Before/after status toggled successfully
 *       403:
 *        description: Not authorized
 *       404:
 *        description: Before/after record not found
 *      500:
 *        description: Internal server error
 */
router.put('/:id/toggle-status', 
  authMiddleware.protect, 
  toggleBeforeAfterStatus
);

module.exports = router;
