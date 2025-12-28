const { Notification, User } = require('../models');
const AppError = require('../utils/AppError');
const { Op } = require('sequelize');

class NotificationRepository {
  // Create a new notification
  async createNotification(notificationData) {
    try {
      const notification = await Notification.create(notificationData);
      return notification.toJSON();
    } catch (error) {
      throw new AppError('Failed to create notification: ' + error.message, 500);
    }
  }

  // Get all notifications for a user with pagination
  async getUserNotifications(userId, page = 1, limit = 10, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      
      const queryOptions = {
        where: { user_id: userId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['user_id', 'full_name', 'role', 'image'],
            where: { is_active: true } // Only include active users
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      };

      // Apply filters if provided
      if (filters.type) {
        queryOptions.where.type = filters.type;
      }
      
      if (filters.is_read !== undefined) {
        queryOptions.where.is_read = filters.is_read;
      }

      const result = await Notification.findAndCountAll(queryOptions);

      return {
        notifications: result.rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(result.count / limit),
          totalItems: result.count,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      throw new AppError('Failed to fetch notifications: ' + error.message, 500);
    }
  }

  // Get notification by ID
  async getNotificationById(id) {
    try {
      const notification = await Notification.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['user_id', 'full_name', 'role', 'image']
          }
        ]
      });
      
      if (!notification) {
        throw new AppError('Notification not found', 404);
      }
      
      return notification;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch notification: ' + error.message, 500);
    }
  }

  // Update notification (mark as read, etc.)
  async updateNotification(id, updateData) {
    try {
      const notification = await this.getNotificationById(id);
      await notification.update(updateData);
      return notification;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update notification: ' + error.message, 500);
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId) {
    try {
      const result = await Notification.update(
        { is_read: true },
        { where: { user_id: userId } }
      );
      return { updatedCount: result[0] };
    } catch (error) {
      throw new AppError('Failed to mark notifications as read: ' + error.message, 500);
    }
  }

  // Delete notification
  async deleteNotification(id) {
    try {
      const notification = await this.getNotificationById(id);
      await notification.destroy();
      return { message: 'Notification deleted successfully' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete notification: ' + error.message, 500);
    }
  }

  // Get count of unread notifications for a user
  async getUnreadCount(userId) {
    try {
      const count = await Notification.count({
        where: { 
          user_id: userId,
          is_read: false
        }
      });
      return count;
    } catch (error) {
      throw new AppError('Failed to count unread notifications: ' + error.message, 500);
    }
  }
}

module.exports = new NotificationRepository();