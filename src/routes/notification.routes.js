const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Public routes (none for notifications - all require authentication)

// Private routes - only authenticated users can access
router.use(authMiddleware.protect);

// Get all notifications for the authenticated user
router.get('/', notificationController.getUserNotifications);

// Get notification by ID
router.get('/:id', notificationController.getNotificationById);

// Create a new notification (admin/super admin only)
router.post('/', 
  authMiddleware.protect,
  notificationController.createNotification
);

// Create a broadcast notification for all users (admin/super admin only)
router.post('/broadcast', 
  authMiddleware.protect,
  notificationController.createBroadcastNotification
);

// Update notification
router.put('/:id', 
  authMiddleware.protect,
  notificationController.updateNotification
);

// Mark notification as read (user can mark their own notifications as read, admin/super admin can mark any)
router.put('/:id/read', 
  authMiddleware.protect,
  notificationController.markAsRead
);

// Mark all notifications as read for the authenticated user
router.put('/mark-all-read', 
  authMiddleware.protect,
  notificationController.markAllAsRead
);

// Get count of unread notifications for the authenticated user
router.get('/unread-count', notificationController.getUnreadCount);

// Delete notification
router.delete('/:id', 
  authMiddleware.protect,
  notificationController.deleteNotification
);

module.exports = router;