const notificationRepository = require('../repositories/notification.repository');
const AppError = require('../utils/AppError');

class NotificationService {
  // Create a new notification
  async createNotification(data) {
    try {
      // Validate required fields
      if (!data.user_id || !data.title || !data.message) {
        throw new AppError('User ID, title, and message are required', 400);
      }

      // Prepare notification data
      const notificationData = {
        user_id: data.user_id,
        title: data.title,
        message: data.message,
        type: data.type || 'system',
        related_id: data.related_id || null,
        target_route: data.target_route || null
      };

      const notification = await notificationRepository.createNotification(notificationData);
      return notification;
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new AppError(error.message, 404);
      }
      throw new AppError('Failed to create notification: ' + error.message, 500);
    }
  }

  // Get all notifications for a user
  async getUserNotifications(userId, page = 1, limit = 10, filters = {}) {
    try {
      // Add authorization check if needed
      const result = await notificationRepository.getUserNotifications(userId, page, limit, filters);
      return result;
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new AppError(error.message, 404);
      }
      throw new AppError('Failed to get notifications: ' + error.message, 500);
    }
  }

  // Get notification by ID
  async getNotificationById(id) {
    try {
      const notification = await notificationRepository.getNotificationById(id);
      return notification;
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new AppError(error.message, 404);
      }
      throw new AppError('Failed to get notification: ' + error.message, 500);
    }
  }

  // Update notification (typically to mark as read)
  async updateNotification(id, data) {
    try {
      const notification = await notificationRepository.updateNotification(id, data);
      return notification;
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new AppError(error.message, 404);
      }
      throw new AppError('Failed to update notification: ' + error.message, 500);
    }
  }

  // Mark notification as read
  async markAsRead(id) {
    try {
      const notification = await notificationRepository.updateNotification(id, { is_read: true });
      return notification;
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new AppError(error.message, 404);
      }
      throw new AppError('Failed to mark notification as read: ' + error.message, 500);
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId) {
    try {
      const result = await notificationRepository.markAllAsRead(userId);
      return result;
    } catch (error) {
      throw new AppError('Failed to mark all notifications as read: ' + error.message, 500);
    }
  }

  // Delete notification
  async deleteNotification(id) {
    try {
      const result = await notificationRepository.deleteNotification(id);
      return result;
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new AppError(error.message, 404);
      }
      throw new AppError('Failed to delete notification: ' + error.message, 500);
    }
  }

  // Get count of unread notifications for a user
  async getUnreadCount(userId) {
    try {
      const count = await notificationRepository.getUnreadCount(userId);
      return count;
    } catch (error) {
      throw new AppError('Failed to get unread count: ' + error.message, 500);
    }
  }

  // Create a notification for an appointment
  async createAppointmentNotification(userId, appointmentData) {
    try {
      const notificationData = {
        user_id: userId,
        title: 'Appointment Reminder',
        message: `You have an appointment scheduled for ${appointmentData.date} at ${appointmentData.time}.`,
        type: 'appointment',
        related_id: appointmentData.appointmentId,
        target_route: `/appointments/${appointmentData.appointmentId}`
      };

      const notification = await this.createNotification(notificationData);
      return notification;
    } catch (error) {
      throw new AppError('Failed to create appointment notification: ' + error.message, 500);
    }
  }

  // Create a notification for a message
  async createMessageNotification(userId, messageData) {
    try {
      const notificationData = {
        user_id: userId,
        title: 'New Message',
        message: `You have a new message from ${messageData.senderName}: ${messageData.preview}`,
        type: 'message',
        related_id: messageData.messageId,
        target_route: `/messages/${messageData.messageId}`
      };

      const notification = await this.createNotification(notificationData);
      return notification;
    } catch (error) {
      throw new AppError('Failed to create message notification: ' + error.message, 500);
    }
  }

  // Create a system notification
  async createSystemNotification(userId, title, message) {
    try {
      const notificationData = {
        user_id: userId,
        title: title,
        message: message,
        type: 'system',
        target_route: null
      };

      const notification = await this.createNotification(notificationData);
      return notification;
    } catch (error) {
      throw new AppError('Failed to create system notification: ' + error.message, 500);
    }
  }

  // Create a broadcast notification for all users
  async createBroadcastNotification(title, message, type = 'system', target_route = null) {
    try {
      const { User } = require('../models');
      
      // Get all active users
      const users = await User.findAll({
        where: { is_active: true },
        attributes: ['user_id']
      });
      
      const notificationPromises = [];
      
      // Create a notification for each user
      for (const user of users) {
        const notificationData = {
          user_id: user.user_id,
          title: title,
          message: message,
          type: type,
          target_route: target_route
        };
        
        notificationPromises.push(this.createNotification(notificationData));
      }
      
      // Execute all notification creations concurrently
      const results = await Promise.all(notificationPromises);
      
      return {
        success: true,
        message: `Broadcast notification sent to ${results.length} users`,
        totalUsers: results.length
      };
    } catch (error) {
      throw new AppError('Failed to create broadcast notification: ' + error.message, 500);
    }
  }
}

module.exports = new NotificationService();