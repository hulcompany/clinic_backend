/**
 * Custom Application Error Class
 * 
 * This class extends the built-in Error class to provide a standardized
 * error handling mechanism across the application.
 * 
 * الوظيفة: فئة خطأ مخصصة تمتد من Error القياسية
الدور: توفير هيكل موحد للأخطاء في التطبيق
التكامل: تُستخدم في جميع أنحاء التطبيق لإنشاء أخطاء موحدة
 */

class AppError extends Error {
  /**
   * Create a new AppError instance
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code (default: 500)
   * @param {Array} errors - Array of validation errors (optional)
   */
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;