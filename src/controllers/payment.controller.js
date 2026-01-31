const { paymentService } = require('../services');
const AppError = require('../utils/AppError');
const { successResponse, createdResponse, failureResponse } = require('../utils/responseHandler');
const { User, Admin } = require('../models');
const { hasPermission } = require('../config/roles');

// Helper function to validate admin permissions
const validateAdminPermission = (user) => {
  return user.role === 'admin' || user.role === 'super_admin' || user.role === 'doctor';
};

/**
 * @desc    Create a new payment request
 * @route   POST /api/v1/payments
 * @access  Private (User)
 */
const createPayment = async (req, res, next) => {
  try {
    // Only users can create payment requests
    if (req.user.role !== 'user') {
      return failureResponse(res, 'Only users can create payment requests', 403);
    }

    const { consultation_fee, payment_amount, payment_method_id } = req.body;
    
    // Validate required fields
    if (!consultation_fee) {
      return failureResponse(res, 'Consultation fee is required', 400);
    }

    // Check if user already has a pending payment
    const existingPendingPayment = await paymentService.getPaymentsByUserId(req.user.user_id, 'pending');
    if (existingPendingPayment.length > 0) {
      return failureResponse(res, 'You already have a pending payment request', 400);
    }

    // Check if user already has a paid payment
    const hasPaid = await paymentService.hasPaidConsultation(req.user.user_id);
    if (hasPaid) {
      return failureResponse(res, 'You have already paid for consultation', 400);
    }

    // Handle payment proof upload (using same pattern as services)
    let paymentProofData = null;
    if (req.file) {
      paymentProofData = req.file.filename;
      console.log('Payment proof filename set:', paymentProofData);
    } else {
      console.log('No payment proof file uploaded');
    }
    
    const paymentData = {
      user_id: req.user.user_id,
      consultation_fee: parseFloat(consultation_fee),
      payment_amount: payment_amount ? parseFloat(payment_amount) : null,
      payment_method_id: payment_method_id || null,
      payment_proof: paymentProofData
    };

    const payment = await paymentService.createPayment(paymentData);
    
    createdResponse(res, payment, 'Payment request created successfully. Please wait for verification.');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Get payment by ID
 * @route   GET /api/v1/payments/:id
 * @access  Private (User/Admin)
 */
const getPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const payment = await paymentService.getPaymentById(id);
    
    // Check permissions
    if (req.user.role === 'user' && payment.user_id !== req.user.user_id) {
      return failureResponse(res, 'Not authorized to access this payment', 403);
    }
    
    successResponse(res, payment, 'Payment retrieved successfully');
  } catch (error) {
    if (error.message === 'Payment not found') {
      return failureResponse(res, error.message, 404);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Get user's payments
 * @route   GET /api/v1/payments/my-payments
 * @access  Private (User)
 */
const getUserPayments = async (req, res, next) => {
  try {
    const { status } = req.query;
    
    const payments = await paymentService.getPaymentsByUserId(req.user.user_id, status);
    
    successResponse(res, payments, 'Payments retrieved successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Get all payments (admin only)
 * @route   GET /api/v1/payments
 * @access  Private (Admin/Doctor)
 */
const getAllPayments = async (req, res, next) => {
  try {
    // Check admin permissions
    if (!validateAdminPermission(req.user)) {
      return failureResponse(res, 'Not authorized to access payments', 403);
    }

    const { status } = req.query;
    
    const payments = await paymentService.getAllPayments(status);
    
    successResponse(res, payments, 'Payments retrieved successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Verify/reject payment
 * @route   PUT /api/v1/payments/:id/status
 * @access  Private (Admin/Doctor/Super Admin)
 */
const updatePaymentStatus = async (req, res, next) => {
  try {
    // Check admin permissions
    if (!validateAdminPermission(req.user)) {
      return failureResponse(res, 'Not authorized to update payment status', 403);
    }

    const { id } = req.params;
    const { status, rejection_reason } = req.body;
    
    // Validate status
    if (!['paid', 'rejected'].includes(status)) {
      return failureResponse(res, 'Invalid status. Must be "paid" or "rejected"', 400);
    }

    const updateData = { status };
    
    if (status === 'rejected' && rejection_reason) {
      updateData.rejection_reason = rejection_reason;
    }

    const payment = await paymentService.updatePaymentStatus(id, updateData, req.user.user_id);
    
    const message = status === 'paid' 
      ? 'Payment verified successfully' 
      : 'Payment rejected successfully';
    
    successResponse(res, payment, message);
  } catch (error) {
    if (error.message === 'Payment not found') {
      return failureResponse(res, error.message, 404);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Check if user can create consultation (has paid)
 * @route   GET /api/v1/payments/can-create-consultation
 * @access  Private (User)
 */
const canCreateConsultation = async (req, res, next) => {
  try {
    const hasPaid = await paymentService.hasPaidConsultation(req.user.user_id);
    
    successResponse(res, { can_create: hasPaid }, 'Payment status checked successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

module.exports = {
  createPayment,
  getPaymentById,
  getUserPayments,
  getAllPayments,
  updatePaymentStatus,
  canCreateConsultation
};
