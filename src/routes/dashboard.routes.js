const express = require('express');
const router = express.Router();
const { getAdminDashboardOverview } = require('../controllers/dashboard.controller');
const authMiddleware = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Admin dashboard overview and statistics
 */

/**
 * @swagger
 * /api/v1/dashboard/admin-overview:
 *   get:
 *     summary: Get admin dashboard overview with statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [day, week, month, year, all]
 *         description: Time period filter
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Dashboard overview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     profile:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *                         status:
 *                           type: string
 *                         registration_date:
 *                           type: string
 *                           format: date-time
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         active_consultations:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: integer
 *                             today:
 *                               type: integer
 *                             this_week:
 *                               type: integer
 *                             this_month:
 *                               type: integer
 *                             this_year:
 *                               type: integer
 *                         medical_records:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: integer
 *                             today:
 *                               type: integer
 *                             this_week:
 *                               type: integer
 *                             this_month:
 *                               type: integer
 *                             this_year:
 *                               type: integer
 *                         scheduled_appointments:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: integer
 *                             today:
 *                               type: integer
 *                             this_week:
 *                               type: integer
 *                             this_month:
 *                               type: integer
 *                             this_year:
 *                               type: integer
 *                         articles:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: integer
 *                             today:
 *                               type: integer
 *                             this_week:
 *                               type: integer
 *                             this_month:
 *                               type: integer
 *                             this_year:
 *                               type: integer
 *                         registered_patients:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: integer
 *                             today:
 *                               type: integer
 *                             this_week:
 *                               type: integer
 *                             this_month:
 *                               type: integer
 *                             this_year:
 *                               type: integer
 *                         patient_satisfaction_rate:
 *                           type: object
 *                           properties:
 *                             average:
 *                               type: number
 *                               format: float
 *                             today:
 *                               type: number
 *                               format: float
 *                             this_week:
 *                               type: number
 *                               format: float
 *                             this_month:
 *                               type: number
 *                               format: float
 *                             this_year:
 *                               type: number
 *                               format: float
 *                     filters:
 *                       type: object
 *                       properties:
 *                         current_filter:
 *                           type: string
 *                         date_range:
 *                           type: string
 *                 message:
 *                   type: string
 *                   example: "Admin dashboard overview retrieved successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

// Protected routes
router.get('/admin-overview', authMiddleware.protect, getAdminDashboardOverview);

module.exports = router;
