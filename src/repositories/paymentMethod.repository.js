const { PaymentMethod } = require('../models');
const AppError = require('../utils/AppError');

class PaymentMethodRepository {
  /**
   * Get all active payment methods
   * @returns {Promise<Array>} Payment methods
   */
  async getActivePaymentMethods() {
    try {
      const methods = await PaymentMethod.findAll({
        where: { is_active: true },
        order: [['name', 'ASC']]
      });
      return methods;
    } catch (error) {
      throw new AppError('Failed to fetch payment methods: ' + error.message, 500);
    }
  }

  /**
   * Get all payment methods (admin only)
   * @returns {Promise<Array>} Payment methods
   */
  async getAllPaymentMethods() {
    try {
      const methods = await PaymentMethod.findAll({
        order: [['created_at', 'DESC']]
      });
      return methods;
    } catch (error) {
      throw new AppError('Failed to fetch payment methods: ' + error.message, 500);
    }
  }

  /**
   * Get payment method by ID
   * @param {number} id - Payment method ID
   * @returns {Promise<Object>} Payment method
   */
  async getPaymentMethodById(id) {
    try {
      const method = await PaymentMethod.findByPk(id);
      if (!method) {
        throw new AppError('Payment method not found', 404);
      }
      return method;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch payment method: ' + error.message, 500);
    }
  }

  /**
   * Create a new payment method
   * @param {Object} methodData - Payment method data
   * @returns {Promise<Object>} Created payment method
   */
  async createPaymentMethod(methodData) {
    try {
      const method = await PaymentMethod.create(methodData);
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
      const [updatedRowsCount, updatedMethods] = await PaymentMethod.update(updateData, {
        where: { id },
        returning: true
      });
      
      if (updatedRowsCount === 0) {
        throw new AppError('Payment method not found', 404);
      }
      
      return updatedMethods[0];
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update payment method: ' + error.message, 500);
    }
  }

  /**
   * Delete payment method
   * @param {number} id - Payment method ID
   * @returns {Promise<void>}
   */
  async deletePaymentMethod(id) {
    try {
      const deletedRowsCount = await PaymentMethod.destroy({
        where: { id }
      });
      
      if (deletedRowsCount === 0) {
        throw new AppError('Payment method not found', 404);
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete payment method: ' + error.message, 500);
    }
  }
}

module.exports = new PaymentMethodRepository();
