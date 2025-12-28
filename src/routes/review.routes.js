const express = require('express');
const { 
  getAllReviews, 
  getReviewById, 
  getReviewsByUserId, 
  createReview, 
  updateReview, 
  deleteReview, 
  toggleReviewStatus,
  getAverageRating
} = require('../controllers/review.controller');
const authMiddleware = require('../middleware/auth.middleware');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Customer reviews management
 */

/**
 * @swagger
 * /api/v1/reviews:
 *   get:
 *     summary: Get all reviews
 *     tags: [Reviews]
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
 *         description: Number of reviews per page (default: 10)
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *         description: Include inactive reviews (default: false)
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/', getAllReviews);

/**
 * @swagger
 * /api/v1/reviews/average-rating:
 *   get:
 *     summary: Get average rating
 *     tags: [Reviews]
 *     responses:
 *       200:
 *         description: Average rating retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/average-rating', getAverageRating);

/**
 * @swagger
 * /api/v1/reviews/{id}:
 *   get:
 *     summary: Get review by ID
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Review retrieved successfully
 *       404:
 *         description: Review not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', getReviewById);

/**
 * @swagger
 * /api/v1/reviews/user/{userId}:
 *   get:
 *     summary: Get reviews by user ID
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
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
 *         description: Number of reviews per page (default: 10)
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *         description: Include inactive reviews (default: false)
 *     responses:
 *       200:
 *         description: User reviews retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/user/:userId', getReviewsByUserId);

/**
 * @swagger
 * /api/v1/reviews:
 *   post:
 *     summary: Create a new review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *               - comment
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1 to 5 stars
 *               comment:
 *                 type: string
 *                 description: Review comment in JSON format {"ar": "التعليق", "en": "Comment"}
 *               user_id:
 *                 type: integer
 *                 description: User ID for the review (only admins, super admins, and doctors can specify this for other users)
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/', 
  authMiddleware.protect, 
  createReview
);

/**
 * @swagger
 * /api/v1/reviews/{id}:
 *   put:
 *     summary: Update review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Review ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1 to 5 stars
 *               comment:
 *                 type: string
 *                 description: Review comment in JSON format {"ar": "التعليق", "en": "Comment"}
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Review not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', 
  authMiddleware.protect, 
  updateReview
);

/**
 * @swagger
 * /api/v1/reviews/{id}:
 *   delete:
 *     summary: Delete review (soft delete)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Review not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', 
  authMiddleware.protect, 
  deleteReview
);

/**
 * @swagger
 * /api/v1/reviews/{id}/toggle-status:
 *   put:
 *     summary: Toggle review active status
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Review status updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Review not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id/toggle-status', 
  authMiddleware.protect, 
  toggleReviewStatus
);

module.exports = router;