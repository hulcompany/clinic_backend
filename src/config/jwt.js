const jwt = require('jsonwebtoken');

/**
 * JWT Utility Functions
 * 
 * This file contains utility functions for generating and verifying JWT tokens.
 * Used in:
 * - middleware/auth.js: For protecting routes and verifying user tokens
 * - services/token.service.js: As a fallback for token operations
 */

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    // Re-throw the error with more context
    if (error.name === 'TokenExpiredError') {
      throw error;
    }
    if (error.name === 'JsonWebTokenError') {
      throw error;
    }
    throw new Error('Token verification failed: ' + error.message);
  }
};

module.exports = {
  generateToken,
  verifyToken,
};