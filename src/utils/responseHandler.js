/**
 * Response Handler Utility
 * 
 * This utility provides standardized response formats across the entire application.
 * It ensures consistency in API responses and makes it easy to modify response
 * structures in one place.
 * 
 * الوظيفة: معالج الاستجابات الموحد
الدور: توفير وظائف موحدة لتنسيق جميع استجابات API
التكامل: تُستخدم في المتحكمات (controllers) والوسيط (middleware) لإنشاء استجابات موحدة
 */

/**
 * Success Response
 * @param {Object} res - Express response object
 * @param {any} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    status: "success",
    message,
    ...(data && { data })
  });
};

/**
 * Failure Response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 400)
 * @param {Array} errors - Validation errors (optional)
 */
const failureResponse = (res, message = 'Bad Request', statusCode = 400, errors = null) => {
  const response = {
    status: "failure",
    message
  };
  
  if (errors) {
    response.errors = errors;
  }
  
  return res.status(statusCode).json(response);
};

/**
 * Error Response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 */
const errorResponse = (res, message = 'Internal Server Error', statusCode = 500) => {
  return res.status(statusCode).json({
    status: "error",
    message
  });
};

/**
 * Created Response
 * @param {Object} res - Express response object
 * @param {any} data - Response data
 * @param {string} message - Success message
 */
const createdResponse = (res, data, message = 'Resource created successfully') => {
  return res.status(201).json({
    status: "success",
    message,
    data
  });
};

/**
 * No Content Response
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 */
const noContentResponse = (res, message = 'No content') => {
  return res.status(204).json({
    status: "success",
    message
  });
};

/**
 * Unauthorized Response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const unauthorizedResponse = (res, message = 'Unauthorized') => {
  return res.status(401).json({
    status: "failure",
    message
  });
};

/**
 * Forbidden Response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const forbiddenResponse = (res, message = 'Forbidden') => {
  return res.status(403).json({
    status: "failure",
    message
  });
};

/**
 * Not Found Response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const notFoundResponse = (res, message = 'Resource not found') => {
  return res.status(404).json({
    status: "failure",
    message
  });
};

module.exports = {
  successResponse,
  failureResponse,
  errorResponse,
  createdResponse,
  noContentResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse
};