const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const {
  getAllAvailability,
  getAvailabilityById,
  getAvailabilityByAdminId,
  createAvailability,
  updateAvailability,
  deleteAvailability,
  bookAvailabilitySlot,
  cancelBooking,
  getUsersWithAppointments
} = require('../controllers/availability.controller');

/**
 * @swagger
 * tags:
 *   name: Availability
 *   description: Availability slots management for doctors/secretaries
 */

/**
 * @swagger
 * /api/v1/availability:
 *   get:
 *     summary: Get all availability slots
 *     tags: [Availability]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [available, unavailable, cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: is_booked
 *         schema:
 *           type: boolean
 *         description: Filter by booking status
 *       - in: query
 *         name: booked_by_user_id
 *         schema:
 *           type: integer
 *         description: Filter by booked user ID
 *       - in: query
 *         name: admin_id
 *         schema:
 *           type: integer
 *         description: Filter by admin ID
 *     responses:
 *       200:
 *         description: Availability slots retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/', getAllAvailability);

/**
 * @swagger
 * /api/v1/availability:
 *   post:
 *     summary: Create a new availability slot
 *     tags: [Availability]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - start_time
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Date of availability (YYYY-MM-DD)
 *               start_time:
 *                 type: string
 *                 format: time
 *                 description: Start time of availability slot (HH:MM:SS)
 *               end_time:
 *                 type: string
 *                 format: time
 *                 description: End time of availability slot (HH:MM:SS) - optional for single time slots
 *               booked_by_user_id:
 *                 type: integer
 *                 description: User ID to pre-book this slot (optional)
 *               admin_id:
 *                 type: integer
 *                 description: Admin ID for which to create the availability slot (for secretaries to create for their assigned doctor)
 *     responses:
 *       201:
 *         description: Availability slot created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.post('/', 
  authMiddleware.protect, 
  createAvailability
);

/**
 * @swagger
 * /api/v1/availability/{id}:
 *   get:
 *     summary: Get availability slot by ID
 *     tags: [Availability]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Availability slot ID
 *     responses:
 *       200:
 *         description: Availability slot retrieved successfully
 *       404:
 *         description: Availability slot not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', getAvailabilityById);

/**
 * @swagger
 * /api/v1/availability/admin/{adminId}:
 *   get:
 *     summary: Get availability slots by admin ID
 *     tags: [Availability]
 *     parameters:
 *       - in: path
 *         name: adminId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Admin ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [available, unavailable, cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: is_booked
 *         schema:
 *           type: boolean
 *         description: Filter by booking status
 *       - in: query
 *         name: booked_by_user_id
 *         schema:
 *           type: integer
 *         description: Filter by booked user ID
 *     responses:
 *       200:
 *         description: Availability slots retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/admin/:adminId', getAvailabilityByAdminId);

/**
 * @swagger
 * /api/v1/availability/{id}:
 *   put:
 *     summary: Update availability slot
 *     tags: [Availability]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Availability slot ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Date of availability (YYYY-MM-DD)
 *               start_time:
 *                 type: string
 *                 format: time
 *                 description: Start time of availability slot (HH:MM:SS)
 *               end_time:
 *                 type: string
 *                 format: time
 *                 description: End time of availability slot (HH:MM:SS) - optional for single time slots
 *               booked_by_user_id:
 *                 type: integer
 *                 description: User ID to pre-book this slot (optional)
 *               status:
 *                 type: string
 *                 enum: [available, unavailable, cancelled]
 *                 description: Status of the slot
 *     responses:
 *       200:
 *         description: Availability slot updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Availability slot not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', 
  authMiddleware.protect, 
  updateAvailability
);

/**
 * @swagger
 * /api/v1/availability/{id}:
 *   delete:
 *     summary: Delete availability slot
 *     tags: [Availability]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Availability slot ID
 *     responses:
 *       200:
 *         description: Availability slot deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Availability slot not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', 
  authMiddleware.protect, 
  deleteAvailability
);

/**
 * @swagger
 * /api/v1/availability/{id}/book:
 *   post:
 *     summary: Book an availability slot
 *     tags: [Availability]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Availability slot ID
 *     responses:
 *       200:
 *         description: Availability slot booked successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Availability slot not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/book', 
  authMiddleware.protect, 
  bookAvailabilitySlot
);

/**
 * @swagger
 * /api/v1/availability/{id}/cancel:
 *   post:
 *     summary: Cancel booking of an availability slot
 *     tags: [Availability]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Availability slot ID
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Availability slot not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/cancel', 
  authMiddleware.protect, 
  cancelBooking
);

/**
 * @swagger
 * /api/v1/availability/{id}/toggle-join:
 *   put:
 *     summary: Toggle availability slot join enabled status
 *     tags: [Availability]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Availability slot ID
 *     responses:
 *       200:
 *         description: Join enabled status updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Availability slot not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id/toggle-join', 
  authMiddleware.protect, 
  toggleJoinEnabled
);

/**
 * @swagger
 * /api/v1/availability/doctor/{adminId}/users:
 *   get:
 *     summary: Get users who have appointments with a specific doctor
 *     tags: [Availability]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: adminId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Admin ID (doctor)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Users with appointments retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get('/doctor/:adminId/users', 
  authMiddleware.protect, 
  getUsersWithAppointments
);

module.exports = router;
