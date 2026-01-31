const { paymentMethodService } = require('../services');
const AppError = require('../utils/AppError');
const { successResponse, createdResponse, failureResponse } = require('../utils/responseHandler');

// Helper function to validate admin permissions
const validateAdminPermission = (user) => {
  return user.role === 'admin' || user.role === 'super_admin' || user.role === 'doctor';
};

/**
 * @desc    Get all active payment methods (public)
 * @route   GET /api/v1/payment-methods
 * @access  Public
 */
const getActivePaymentMethods = async (req, res, next) => {
  try {
    const methods = await paymentMethodService.getActivePaymentMethods();
    successResponse(res, methods, 'Payment methods retrieved successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Get all payment methods (admin only)
 * @route   GET /api/v1/payment-methods/all
 * @access  Private (Admin/Doctor)
 */
const getAllPaymentMethods = async (req, res, next) => {
  try {
    // Check admin permissions
    if (!validateAdminPermission(req.user)) {
      return failureResponse(res, 'Not authorized to access payment methods', 403);
    }

    const methods = await paymentMethodService.getAllPaymentMethods();
    successResponse(res, methods, 'Payment methods retrieved successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Get payment method by ID
 * @route   GET /api/v1/payment-methods/:id
 * @access  Private (Admin/Doctor)
 */
const getPaymentMethodById = async (req, res, next) => {
  try {
    // Check admin permissions
    if (!validateAdminPermission(req.user)) {
      return failureResponse(res, 'Not authorized to access payment method', 403);
    }

    const { id } = req.params;
    const method = await paymentMethodService.getPaymentMethodById(id);
    successResponse(res, method, 'Payment method retrieved successfully');
  } catch (error) {
    if (error.message === 'Payment method not found') {
      return failureResponse(res, error.message, 404);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Create a new payment method
 * @route   POST /api/v1/payment-methods
 * @access  Private (Admin/Super Admin)
 */
const createPaymentMethod = async (req, res, next) => {
  try {
    // Allow doctors, admins, and super admins to create payment methods
    if (req.user.role !== 'doctor' && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return failureResponse(res, 'Only doctors, admins, and super admins can create payment methods', 403);
    }

    const { name, description, account_number, account_name, bank_name } = req.body;
    
    // Validate required fields
    if (!name) {
      return failureResponse(res, 'Payment method name is required', 400);
    }

    const methodData = {
      name,
      description,
      account_number,
      account_name,
      bank_name
    };

    // Handle QR code from media management middleware
    if (req.processedFiles && req.processedFiles.qr_code) {
      methodData.qr_code = req.processedFiles.qr_code[0].filename;
    }

    const method = await paymentMethodService.createPaymentMethod(methodData);
    createdResponse(res, method, 'Payment method created successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Update payment method
 * @route   PUT /api/v1/payment-methods/:id
 * @access  Private (Admin/Super Admin)
 */
const updatePaymentMethod = async (req, res, next) => {
  try {
    // Allow doctors, admins, and super admins to update payment methods
    if (req.user.role !== 'doctor' && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return failureResponse(res, 'Only doctors, admins, and super admins can update payment methods', 403);
    }

    const { id } = req.params;
    const { name, description, account_number, account_name, bank_name, is_active } = req.body;

    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (account_number !== undefined) updateData.account_number = account_number;
    if (account_name !== undefined) updateData.account_name = account_name;
    if (bank_name !== undefined) updateData.bank_name = bank_name;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Handle QR code from media management middleware
    if (req.processedFiles && req.processedFiles.qr_code) {
      updateData.qr_code = req.processedFiles.qr_code[0].filename;
    }

    const method = await paymentMethodService.updatePaymentMethod(id, updateData);
    successResponse(res, method, 'Payment method updated successfully');
  } catch (error) {
    if (error.message === 'Payment method not found') {
      return failureResponse(res, error.message, 404);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Delete payment method
 * @route   DELETE /api/v1/payment-methods/:id
 * @access  Private (Super Admin only)
 */
const deletePaymentMethod = async (req, res, next) => {
  try {
    // Allow doctors, admins, and super admins to delete payment methods
    if (req.user.role !== 'doctor' && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return failureResponse(res, 'Only doctors, admins, and super admins can delete payment methods', 403);
    }

    const { id } = req.params;
    await paymentMethodService.deletePaymentMethod(id);
    successResponse(res, null, 'Payment method deleted successfully');
  } catch (error) {
    if (error.message === 'Payment method not found') {
      return failureResponse(res, error.message, 404);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

module.exports = {
  getActivePaymentMethods,
  getAllPaymentMethods,
  getPaymentMethodById,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod
};
