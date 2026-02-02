const notificationService = require('./notification.service');
const { User, Admin, Availability, Consultation } = require('../models');

class AutoNotificationService {
  // إنشاء إشعار حجز موعد جديد (للدكتور)
  async createNewBookingNotificationForDoctor(doctorId, availabilityData, userData) {
    try {
      const notificationData = {
        user_id: doctorId,
        title: {
          "en": "New Appointment Booking",
          "ar": "حجز موعد جديد"
        },
        message: {
          "en": `Patient ${userData.full_name} has booked an appointment for ${availabilityData.date} at ${availabilityData.time}`,
          "ar": `المريض ${userData.full_name} قام بحجز موعد في ${availabilityData.date} الساعة ${availabilityData.time}`
        },
        type: 'appointment',
        related_id: availabilityData.id,
        target_route: `/availability/${availabilityData.id}`
      };

      return await notificationService.createNotification(notificationData);
    } catch (error) {
      console.error('Failed to create new booking notification for doctor:', error);
      throw error;
    }
  }

  // إنشاء إشعار إلغاء حجز (للدكتور)
  async createBookingCancellationNotificationForDoctor(doctorId, availabilityData, userData) {
    try {
      const notificationData = {
        user_id: doctorId,
        title: {
          "en": "Appointment Cancelled",
          "ar": "إلغاء موعد"
        },
        message: {
          "en": `Patient ${userData.full_name} has cancelled their appointment for ${availabilityData.date} at ${availabilityData.time}`,
          "ar": `المريض ${userData.full_name} قام بإلغاء موعده في ${availabilityData.date} الساعة ${availabilityData.time}`
        },
        type: 'appointment',
        related_id: availabilityData.id,
        target_route: null
      };

      return await notificationService.createNotification(notificationData);
    } catch (error) {
      console.error('Failed to create cancellation notification for doctor:', error);
      throw error;
    }
  }

  // إنشاء إشعار انضمام مريض للجلسة (للدكتور)
  async createPatientJoinedSessionNotification(doctorId, sessionData, userData) {
    try {
      const notificationData = {
        user_id: doctorId,
        title: {
          "en": "Patient Joined Session",
          "ar": "انضمام مريض للجلسة"
        },
        message: {
          "en": `Patient ${userData.full_name} has joined the session`,
          "ar": `المريض ${userData.full_name} انضم للجلسة`
        },
        type: 'message',
        related_id: sessionData.id,
        target_route: `/sessions/${sessionData.id}`
      };

      return await notificationService.createNotification(notificationData);
    } catch (error) {
      console.error('Failed to create patient joined notification:', error);
      throw error;
    }
  }

  // إنشاء إشعار تسجيل مستخدم جديد (للأدمن)
  async createNewUserRegistrationNotification(adminUsers, userData) {
    try {
      const promises = adminUsers.map(async (admin) => {
        const notificationData = {
          user_id: admin.user_id,
          title: {
            "en": "New User Registration",
            "ar": "تسجيل مستخدم جديد"
          },
          message: {
            "en": `New user ${userData.full_name} has registered with email ${userData.email}`,
            "ar": `مستخدم جديد ${userData.full_name} قام بالتسجيل بالبريد ${userData.email}`
          },
          type: 'system',
          related_id: null,
          target_route: `/users/${userData.user_id}`
        };

        return await notificationService.createNotification(notificationData);
      });

      return await Promise.all(promises);
    } catch (error) {
      console.error('Failed to create new user registration notifications:', error);
      throw error;
    }
  }
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

  async createPaymentVerificationNotification(userId, paymentData) {
    try {
      const amount = paymentData.payment_amount || paymentData.consultation_fee;
      const notificationData = {
        user_id: userId,
        title: {
          "en": "Payment Verified",
          "ar": "تم توثيق الدفع"
        },
        message: {
          "en": `Your payment (#${paymentData.id}) has been verified. Amount: ${amount}`,
          "ar": `تم توثيق دفعتك رقم ${paymentData.id}. المبلغ: ${amount}`
        },
        type: 'system',
        related_id: paymentData.id,
        target_route: `/payments/${paymentData.id}`
      };
      return await notificationService.createNotification(notificationData);
    } catch (error) {
      console.error('Failed to create payment verification notification:', error);
      throw error;
    }
  }

  async createPaymentRejectionNotification(userId, paymentData) {
    try {
      const amount = paymentData.payment_amount || paymentData.consultation_fee;
      const reasonEn = paymentData.rejection_reason || 'No reason provided';
      const reasonAr = paymentData.rejection_reason || 'بدون سبب مذكور';
      const notificationData = {
        user_id: userId,
        title: {
          "en": "Payment Rejected",
          "ar": "تم رفض الدفع"
        },
        message: {
          "en": `Your payment (#${paymentData.id}) was rejected. Amount: ${amount}. Reason: ${reasonEn}`,
          "ar": `تم رفض دفعتك رقم ${paymentData.id}. المبلغ: ${amount}. السبب: ${reasonAr}`
        },
        type: 'system',
        related_id: paymentData.id,
        target_route: `/payments/${paymentData.id}`
      };
      return await notificationService.createNotification(notificationData);
    } catch (error) {
      console.error('Failed to create payment rejection notification:', error);
      throw error;
    }
  }
}

module.exports = new AutoNotificationService();
