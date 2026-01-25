const { notificationService } = require('./index');
const { User, Admin } = require('../models');

class AutoNotificationService {
  // إنشاء إشعار حجز موعد
  async createBookingNotification(userId, availabilityData) {
    try {
      const notificationData = {
        user_id: userId,
        title: {
          "en": "Booking Confirmation",
          "ar": "تأكيد الحجز"
        },
        message: {
          "en": `Your appointment has been booked successfully for ${availabilityData.date} at ${availabilityData.time}`,
          "ar": `تم تأكيد حجز موعدك بنجاح في تاريخ ${availabilityData.date} الساعة ${availabilityData.time}`
        },
        type: 'appointment',
        related_id: availabilityData.id,
        target_route: `/availability/${availabilityData.id}`
      };

      return await notificationService.createNotification(notificationData);
    } catch (error) {
      console.error('Failed to create booking notification:', error);
      throw error;
    }
  }

  // إنشاء إشعار إلغاء حجز
  async createCancellationNotification(userId, availabilityData) {
    try {
      const notificationData = {
        user_id: userId,
        title: {
          "en": "Booking Cancellation",
          "ar": "إلغاء الحجز"
        },
        message: {
          "en": `Your appointment for ${availabilityData.date} at ${availabilityData.time} has been cancelled`,
          "ar": `تم إلغاء موعدك في تاريخ ${availabilityData.date} الساعة ${availabilityData.time}`
        },
        type: 'appointment',
        related_id: availabilityData.id,
        target_route: null
      };

      return await notificationService.createNotification(notificationData);
    } catch (error) {
      console.error('Failed to create cancellation notification:', error);
      throw error;
    }
  }

  // إنشاء إشعار تفعيل/تعطيل الانضمام
  async createToggleJoinNotification(userId, availabilityData, isEnabled) {
    try {
      const statusText = isEnabled ? 'enabled' : 'disabled';
      const statusTextAr = isEnabled ? 'مفعل' : 'معطل';
      
      const notificationData = {
        user_id: userId,
        title: {
          "en": "Join Status Updated",
          "ar": "تحديث حالة الانضمام"
        },
        message: {
          "en": `Join functionality for your appointment on ${availabilityData.date} has been ${statusText}`,
          "ar": `تم ${statusTextAr} خاصية الانضمام لموعدك في تاريخ ${availabilityData.date}`
        },
        type: 'system',
        related_id: availabilityData.id,
        target_route: `/availability/${availabilityData.id}`
      };

      return await notificationService.createNotification(notificationData);
    } catch (error) {
      console.error('Failed to create toggle join notification:', error);
      throw error;
    }
  }

  // إنشاء إشعار إنشاء استشارة
  async createConsultationNotification(userId, consultationData) {
    try {
      const notificationData = {
        user_id: userId,
        title: {
          "en": "New Consultation Created",
          "ar": "إنشاء استشارة جديدة"
        },
        message: {
          "en": `A new consultation has been created. Consultation ID: ${consultationData.id}`,
          "ar": `تم إنشاء استشارة جديدة. رقم الاستشارة: ${consultationData.id}`
        },
        type: 'system',
        related_id: consultationData.id,
        target_route: `/consultations/${consultationData.id}`
      };

      return await notificationService.createNotification(notificationData);
    } catch (error) {
      console.error('Failed to create consultation notification:', error);
      throw error;
    }
  }

  // إنشاء إشعار تحديث حالة الاستشارة
  async createConsultationStatusNotification(userId, consultationData, newStatus) {
    try {
      const notificationData = {
        user_id: userId,
        title: {
          "en": "Consultation Status Updated",
          "ar": "تحديث حالة الاستشارة"
        },
        message: {
          "en": `Your consultation status has been updated to: ${newStatus}`,
          "ar": `تم تحديث حالة استشارتك إلى: ${newStatus}`
        },
        type: 'system',
        related_id: consultationData.id,
        target_route: `/consultations/${consultationData.id}`
      };

      return await notificationService.createNotification(notificationData);
    } catch (error) {
      console.error('Failed to create consultation status notification:', error);
      throw error;
    }
  }

  // إنشاء إشعار تحديث حالة الدردشة
  async createChatStatusNotification(userId, chatData, newStatus) {
    try {
      const statusText = newStatus ? 'activated' : 'deactivated';
      const statusTextAr = newStatus ? 'مفعلة' : 'معطلة';
      
      const notificationData = {
        user_id: userId,
        title: {
          "en": "Chat Status Updated",
          "ar": "تحديث حالة الدردشة"
        },
        message: {
          "en": `Your chat has been ${statusText}`,
          "ar": `تم ${statusTextAr} دردشتك`
        },
        type: 'message',
        related_id: chatData.id,
        target_route: `/chats/${chatData.id}`
      };

      return await notificationService.createNotification(notificationData);
    } catch (error) {
      console.error('Failed to create chat status notification:', error);
      throw error;
    }
  }
}

module.exports = new AutoNotificationService();
