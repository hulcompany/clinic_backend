const jwt = require('jsonwebtoken');
const { User, Admin } = require('../models/index');
const { verifyToken } = require('../config/jwt');

// Protect routes - check if user is authenticated
const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = verifyToken(token);

      // Get user/admin from the token based on role
      if (decoded.role === 'admin') {
        req.user = await Admin.findByPk(decoded.id);
        req.userType = 'admin';
      } else {
        req.user = await User.findByPk(decoded.id);
        req.userType = 'user';
      }

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, user not found'
        });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'User not authorized to access this route'
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorize
};