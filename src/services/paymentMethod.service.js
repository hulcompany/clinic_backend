const paymentMethodRepository = require('../repositories/paymentMethod.repository');
const AppError = require('../utils/AppError');

class PaymentMethodService {
  /**
   * Get all active payment methods
   * @returns {Promise<Array>} Payment methods
   */
  async getActivePaymentMethods() {
    try {
      const methods = await paymentMethodRepository.getActivePaymentMethods();
      return methods;
    } catch (error) {
      throw new AppError('Failed to get payment methods: ' + error.message, 500);
    }
  }

  /**
   * Get all payment methods (admin only)
   * @returns {Promise<Array>} Payment methods
   */
  async getAllPaymentMethods() {
    try {
      const methods = await paymentMethodRepository.getAllPaymentMethods();
      return methods;
    } catch (error) {
      throw new AppError('Failed to get payment methods: ' + error.message, 500);
    }
  }

  /**
   * Get payment method by ID
   * @param {number} id - Payment method ID
   * @returns {Promise<Object>} Payment method
   */
  async getPaymentMethodById(id) {
    try {
      const method = await paymentMethodRepository.getPaymentMethodById(id);
      return method;
    } catch (error) {
      throw error; // Re-throw to preserve error codes
    }
  }

  /**
   * Create a new payment method
   * @param {Object} methodData - Payment method data
   * @returns {Promise<Object>} Created payment method
   */
  async createPaymentMethod(methodData) {
    try {
      const method = await paymentMethodRepository.createPaymentMethod(methodData);
      return method;
    } catch (error) {
      throw new AppError('Failed to create payment method: ' + error.message, 500);
    }
  }

  /**
   * Update payment method
   * @param {number} id - Payment method ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated payment method
   */
  async updatePaymentMethod(id, updateData) {
    try {
      const method = await paymentMethodRepository.updatePaymentMethod(id, updateData);
      return method;
    } catch (error) {
      throw error; // Re-throw to preserve error codes
    }
  }

  /**
   * Delete payment method
   * @param {number} id - Payment method ID
   * @returns {Promise<void>}
   */
  async deletePaymentMethod(id) {
    try {
      await paymentMethodRepository.deletePaymentMethod(id);
    } catch (error) {
      throw error; // Re-throw to preserve error codes
    }
  }
}

module.exports = new PaymentMethodService();
