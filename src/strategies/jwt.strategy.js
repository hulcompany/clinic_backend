/**
 * JWT Strategy for Passport.js
 * 
 * This file implements the JWT authentication strategy for Passport.js.
 * It verifies JWT tokens sent in the Authorization header and checks
 * if they have been blacklisted for enhanced security.
 * 
 * Features:
 * - Verifies JWT tokens using the secret key from environment variables
 * - Checks if tokens have been blacklisted (invalidated)
 * - Authenticates users based on the user ID stored in the token payload
 */

const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const { User, Admin, BlacklistedToken } = require('../models/index');
const { unauthorizedResponse, errorResponse } = require('../utils/responseHandler');

// JWT strategy options
const opts = {
  // Extract JWT from Authorization header as Bearer token
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  // Secret key for verifying the token signature
  secretOrKey: process.env.JWT_SECRET
};

/**
 * JWT Strategy Implementation
 * 
 * This strategy extracts the JWT from the Authorization header,
 * verifies its signature, and then looks up the user based on
 * the ID stored in the token payload.
 * 
 * @param {Object} payload - Decoded JWT payload containing user ID
 * @param {Function} done - Callback function to indicate success/failure
 */
const jwtStrategy = new JwtStrategy(opts, async (payload, done) => {
  try {
    // Find user by ID from JWT payload
    // The token contains 'id' field, not 'user_id'
    // First try to find as user
    let user = await User.findByPk(payload.id);
    
    if (user) {
      // User found, authentication successful
      // Add userType to the user object for downstream middleware
      user.userType = 'user';
      return done(null, user);
    }
    
    // If not found as user, try to find as admin
    let admin = await Admin.findByPk(payload.id);
    
    if (admin) {
      // Admin found, authentication successful
      // Add userType to the admin object for downstream middleware
      admin.userType = 'admin';
      return done(null, admin);
    }
    
    // Neither user nor admin found, authentication failed
    return done(null, false);
  } catch (error) {
    // Error occurred during authentication
    return done(error, false);
  }
});

/**
 * Middleware to Check Blacklisted Tokens
 * 
 * This middleware checks if a JWT token has been invalidated
 * by looking it up in the blacklisted tokens database table.
 * This is useful for immediate token invalidation on logout.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const checkBlacklistedToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      // Check if token is blacklisted
      const blacklistedToken = await BlacklistedToken.findOne({
        where: { token }
      });
      
      if (blacklistedToken) {
        // Token has been invalidated, deny access
        return unauthorizedResponse(res, 'Token has been invalidated');
      }
    }
    // Token is valid, continue with authentication
    next();
  } catch (error) {
    // Error occurred during blacklist check
    console.error('Error checking token validity:', error);
    next(new Error('Error checking token validity'));
  }
};

module.exports = {
  jwtStrategy,
  checkBlacklistedToken
};