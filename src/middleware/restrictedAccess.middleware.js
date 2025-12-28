const { User } = require('../models/index');
const { forbiddenResponse, notFoundResponse } = require('../utils/responseHandler');

/**
 * Middleware to check if a user can access a restricted user
 * Only doctors can access restricted users
 */
const checkRestrictedAccess = async (req, res, next) => {
  try {
    // Get the user ID from the request parameters
    const userId = req.params.id;
    
    // If no user ID in params, proceed (might be a general request)
    if (!userId) {
      return next();
    }
    
    // Find the target user
    const targetUser = await User.findByPk(userId);
    
    // If user doesn't exist, let the controller handle it
    if (!targetUser) {
      return next();
    }
    
    // If the user is not restricted (0), anyone with proper permissions can access
    // If the user is restricted (1), only doctors can access
    if (targetUser.is_restricted == 0) { // Using == to handle both 0 and false
      return next();
    }
    
    // If the user is restricted, only doctors can access
    // req.user is set by the authentication middleware
    if (!req.user) {
      return forbiddenResponse(res, 'Access denied');
    }
    
    // Check if the requesting user is a doctor
    if (req.user.role === 'doctor' || req.user.role === 'admin' || req.user.role === 'super_admin') {
      return next();
    }
    
    // If not a doctor, deny access
    return forbiddenResponse(res, 'Access to this user is restricted to doctors only');
  } catch (error) {
    console.error('Error in restricted access middleware:', error);
    return next(error);
  }
};

module.exports = {
  checkRestrictedAccess
};