const paymentRepository = require('../repositories/payment.repository');
const AppError = require('../utils/AppError');

class PaymentService {
  /**
   * Create a new payment request
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Created payment
   */
  async createPayment(paymentData) {
    try {
      const payment = await paymentRepository.createPayment(paymentData);
      return payment;
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
      const payment = await paymentRepository.getPaymentById(id);
      return payment;
    } catch (error) {
      throw error; // Re-throw to preserve error codes
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
      const payments = await paymentRepository.getPaymentsByUserId(userId, status);
      return payments;
    } catch (error) {
      throw new AppError('Failed to get payments: ' + error.message, 500);
    }
  }

  /**
   * Get all payments (admin only)
   * @param {string} status - Payment status filter
   * @returns {Promise<Array>} Payments
   */
  async getAllPayments(status = null) {
    try {
      const payments = await paymentRepository.getAllPayments(status);
      return payments;
    } catch (error) {
      throw new AppError('Failed to get payments: ' + error.message, 500);
    }
  }

  /**
   * Update payment status (verify/reject)
   * @param {number} id - Payment ID
   * @param {Object} updateData - Update data
   * @param {number} verifierId - Verifier admin ID
   * @returns {Promise<Object>} Updated payment
   */
  async updatePaymentStatus(id, updateData, verifierId) {
    try {
      // Add verifier info
      const updatePayload = {
        ...updateData,
        verified_by: verifierId,
        verified_at: new Date()
      };

      const payment = await paymentRepository.updatePayment(id, updatePayload);
      return payment;
    } catch (error) {
      throw error; // Re-throw to preserve error codes
    }
  }

  /**
   * Check if user has paid for consultation
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} Has paid
   */
  async hasPaidConsultation(userId) {
    try {
      const hasPaid = await paymentRepository.hasPaidConsultation(userId);
      return hasPaid;
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
      const payment = await paymentRepository.linkToConsultation(paymentId, consultationId);
      return payment;
    } catch (error) {
      throw new AppError('Failed to link payment: ' + error.message, 500);
    }
  }
}

module.exports = new PaymentService();
