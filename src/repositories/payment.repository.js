const { Payment, User, Admin, Consultation } = require('../models');
const AppError = require('../utils/AppError');

class PaymentRepository {
  /**
   * Create a new payment request
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Created payment
   */
  async createPayment(paymentData) {
    try {
      const payment = await Payment.create(paymentData);
      
      // Fetch with associations
      const result = await Payment.findByPk(payment.id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['user_id', 'full_name', 'email', 'phone']
          },
          {
            model: Admin,
            as: 'verifier',
            attributes: ['user_id', 'full_name'],
            required: false
          }
        ]
      });
      
      return result;
    } catch (error) {
      throw new AppError('Failed to create payment: ' + error.message, 500);
    }
  }

  /**
   * Get payment by ID
   * @param {number} id - Payment ID
   * @returns {Promise<Object>} Payment
   */
  async getPaymentById(id) {
    try {
      const payment = await Payment.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['user_id', 'full_name', 'email', 'phone']
          },
          {
            model: Admin,
            as: 'verifier',
            attributes: ['user_id', 'full_name'],
            required: false
          },
          {
            model: Consultation,
            as: 'consultation',
            attributes: ['id', 'initial_issue', 'status'],
            required: false
          }
        ]
      });
      
      if (!payment) {
        throw new AppError('Payment not found', 404);
      }
      
      return payment;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch payment: ' + error.message, 500);
    }
  }

  /**
   * Get payments by user ID
   * @param {number} userId - User ID
   * @param {string} status - Payment status filter
   * @returns {Promise<Array>} Payments
   */
  async getPaymentsByUserId(userId, status = null) {
    try {
      const whereClause = { user_id: userId };
      if (status) {
        whereClause.status = status;
      }
      
      const payments = await Payment.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['user_id', 'full_name', 'email', 'phone']
          },
          {
            model: Admin,
            as: 'verifier',
            attributes: ['user_id', 'full_name'],
            required: false
          }
        ],
        order: [['created_at', 'DESC']]
      });
      
      return payments;
    } catch (error) {
      throw new AppError('Failed to fetch payments: ' + error.message, 500);
    }
  }

  /**
   * Get all payments (for admin/staff)
   * @param {string} status - Payment status filter
   * @returns {Promise<Array>} Payments
   */
  async getAllPayments(status = null) {
    try {
      const whereClause = {};
      if (status) {
        whereClause.status = status;
      }
      
      const payments = await Payment.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['user_id', 'full_name', 'email', 'phone']
          },
          {
            model: Admin,
            as: 'verifier',
            attributes: ['user_id', 'full_name'],
            required: false
          }
        ],
        order: [['created_at', 'DESC']]
      });
      
      return payments;
    } catch (error) {
      throw new AppError('Failed to fetch payments: ' + error.message, 500);
    }
  }

  /**
   * Update payment status
   * @param {number} id - Payment ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated payment
   */
  async updatePayment(id, updateData) {
    try {
      const [updatedRowsCount, updatedPayments] = await Payment.update(updateData, {
        where: { id },
        returning: true
      });
      
      if (updatedRowsCount === 0) {
        throw new AppError('Payment not found', 404);
      }
      
      // Return the updated payment with associations
      const updatedPayment = await Payment.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['user_id', 'full_name', 'email', 'phone']
          },
          {
            model: Admin,
            as: 'verifier',
            attributes: ['user_id', 'full_name'],
            required: false
          }
        ]
      });
      
      return updatedPayment;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update payment: ' + error.message, 500);
    }
  }

  /**
   * Check if user has paid consultation fee
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} Has paid consultation
   */
  async hasPaidConsultation(userId) {
    try {
      const paidPayment = await Payment.findOne({
        where: {
          user_id: userId,
          status: 'paid'
        },
        order: [['created_at', 'DESC']]
      });
      
      return !!paidPayment;
    } catch (error) {
      throw new AppError('Failed to check payment status: ' + error.message, 500);
    }
  }

  /**
   * Link payment to consultation
   * @param {number} paymentId - Payment ID
   * @param {number} consultationId - Consultation ID
   * @returns {Promise<Object>} Updated payment
   */
  async linkToConsultation(paymentId, consultationId) {
    try {
      const payment = await this.updatePayment(paymentId, {
        consultation_id: consultationId
      });
      return payment;
    } catch (error) {
      throw new AppError('Failed to link payment to consultation: ' + error.message, 500);
    }
  }
}

module.exports = new PaymentRepository();
