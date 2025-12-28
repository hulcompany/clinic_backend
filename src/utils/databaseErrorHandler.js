/**
 * Database Error Handler Utility
 * 
 * This utility handles database errors from different database systems
 * and converts them into user-friendly error messages.
 * 
 * الوظيفة: معالج أخطاء قواعد البيانات
الدور: تحويل أخطاء قواعد البيانات التقنية إلى رسائل مفهومة للمستخدم
التكامل: تُستخدم في errorHandler لمعالجة أخطاء قواعد البيانات تلقائيًا

 */

/**
 * Detect database type from error
 * @param {Error} error - Error object
 * @returns {string} Database type
 */
function detectDatabaseType(error) {
  // MySQL errors
  if (typeof error?.code === 'string' && error.code.startsWith('ER_')) {
    return 'mysql';
  }

  // PostgreSQL errors
  if (typeof error?.code === 'string' && (error.code.startsWith('23') || error.code === '23505')) {
    return 'postgresql';
  }

  // SQLite errors
  if (error?.code === 'SQLITE_CONSTRAINT' || error?.code === 'SQLITE_ERROR') {
    return 'sqlite';
  }

  // Default
  return 'unknown';
}

/**
 * Handle MySQL errors
 * @param {Error} error - Error object
 * @returns {Object} Handled error object
 */
function handleMySQLError(error) {
  let statusCode = 500;
  let message = "Database error";
  
  switch (error.code) {
    case 'ER_NO_REFERENCED_ROW_2':
      statusCode = 400;
      message = "Cannot delete: referenced by other records";
      break;
      
    case 'ER_DUP_ENTRY':
      statusCode = 409;
      message = "Record already exists";
      break;
      
    case 'ER_NO_SUCH_TABLE':
      statusCode = 500;
      message = "Database table not found";
      break;
      
    case 'ER_BAD_FIELD_ERROR':
      statusCode = 400;
      message = "Invalid field name";
      break;
      
    case 'ER_DATA_TOO_LONG':
      statusCode = 400;
      message = "Data too long for field";
      break;
  }
  
  return { statusCode, message };
}

/**
 * Handle PostgreSQL errors
 * @param {Error} error - Error object
 * @returns {Object} Handled error object
 */
function handlePostgreSQLError(error) {
  let statusCode = 500;
  let message = "Database error";
  
  switch (error.code) {
    case '23505': // unique_violation
      statusCode = 409;
      message = "Record already exists";
      break;
      
    case '23503': // foreign_key_violation
      statusCode = 400;
      message = "Cannot delete: referenced by other records";
      break;
      
    case '42P01': // undefined_table
      statusCode = 500;
      message = "Database table not found";
      break;
      
    case '42703': // undefined_column
      statusCode = 400;
      message = "Invalid field name";
      break;
  }
  
  return { statusCode, message };
}

/**
 * Handle SQLite errors
 * @param {Error} error - Error object
 * @returns {Object} Handled error object
 */
function handleSQLiteError(error) {
  let statusCode = 500;
  let message = "Database error";
  
  switch (error.code) {
    case 'SQLITE_CONSTRAINT':
      statusCode = 400;
      message = "Constraint violation";
      break;
      
    case 'SQLITE_ERROR':
      statusCode = 500;
      message = "Database operation failed";
      break;
  }
  
  return { statusCode, message };
}

/**
 * Unified database error handler
 * @param {Error} error - Error object
 * @returns {Object} Handled error object
 */
function handleDatabaseError(error) {
  const dbType = detectDatabaseType(error);
  
  switch (dbType) {
    case 'mysql':
      return handleMySQLError(error);
      
    case 'postgresql':
      return handlePostgreSQLError(error);
      
    case 'sqlite':
      return handleSQLiteError(error);
      
    default:
      return {
        statusCode: 500,
        message: "Database error occurred"
      };
  }
}

module.exports = {
  handleDatabaseError,
  detectDatabaseType
};