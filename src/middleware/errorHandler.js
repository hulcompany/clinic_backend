/**
 * Global Error Handler Middleware
 * 
 * This middleware provides a unified error response format across the entire application.
 */

const AppError = require('../utils/AppError');
const { handleDatabaseError } = require('../utils/databaseErrorHandler');
const { 
  errorResponse, 
  failureResponse,
  unauthorizedResponse
} = require('../utils/responseHandler');

/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const errorHandler = (err, req, res, next) => {
  // Log error details for debugging
  console.error('Error Details:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Default error response
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong!';
  
  // Handle JWT token expiration errors
  if (err.name === 'TokenExpiredError') {
    return unauthorizedResponse(res, 'Token has expired. Please log in again or refresh your token.');
  }
  
  // Handle invalid JWT token errors
  if (err.name === 'JsonWebTokenError') {
    return unauthorizedResponse(res, 'Invalid token. Please log in again.');
  }
  
  // Handle database errors automatically
  const dbError = handleDatabaseError(err);
  if (dbError && !err.statusCode) { // Don't override if error is from controller
    statusCode = dbError.statusCode;
    message = dbError.message;
  }
  
  // For operational errors, use the error message
  if (err.isOperational) {
    return failureResponse(res, message, statusCode, err.errors);
  }
  
  // For programming errors in development, send detailed error
  if (process.env.NODE_ENV === 'development') {
    return errorResponse(res, message, statusCode);
  }
  
  // For programming errors in production, send generic message
  return errorResponse(res, 'Something went wrong!', statusCode);
};

/**
 * Handle invalid route requests
 */
const handleNotFound = (req, res, next) => {
  const error = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
  next(error);
};

module.exports = {
  errorHandler,
  handleNotFound
};