// In-memory store for login attempts (in production, use Redis or database)
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 5 * 60 * 1000; // 5 minutes

// Periodically clean up old login attempts to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [identifier, attempts] of loginAttempts.entries()) {
    // Remove entries that haven't been accessed in over an hour
    if (now - attempts.lastAttempt > 60 * 60 * 1000) {
      loginAttempts.delete(identifier);
    }
  }
}, 30 * 60 * 1000); // Run every 30 minutes

const passport = require('passport');
const rateLimit = require('express-rate-limit');
const { tokenService } = require('../services/index');
const { checkBlacklistedToken } = require('../strategies/jwt.strategy');
const { hasAnyPermission } = require('../config/roles');
const { 
  unauthorizedResponse, 
  failureResponse, 
  forbiddenResponse 
} = require('../utils/responseHandler');

const authMiddleware = {
    // Protect route with JWT and check for blacklisted tokens
    protect: (req, res, next) => {
        // Check if authorization header exists
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return unauthorizedResponse(res, 'Unauthorized access. Please provide a valid authentication token.');
        }
        
        // First check if token is blacklisted
        checkBlacklistedToken(req, res, (err) => {
            if (err) {
                return next(err);
            }
            
            // Then authenticate with JWT
            passport.authenticate('jwt', { session: false }, (err, user, info) => {
                if (err) {
                    return next(err);
                }
                
                if (!user) {
                    // Authentication failed - send proper error response
                    const message = info && info.message ? info.message : 'Unauthorized access. Please provide a valid authentication token.';
                    return unauthorizedResponse(res, message);
                }
                
                // Authentication successful
                req.user = user;
                next();
            })(req, res, next);
        });
    },
    
    // Authenticate with Local (email/password)
    localAuth: (req, res, next) => {
        passport.authenticate('local', { session: false }, (err, user, info) => {
            if (err) {
                return next(err);
            }
            
            if (!user) {
                // Authentication failed - send proper error response
                return unauthorizedResponse(res, info ? info.message : 'Invalid credentials');
            }
            
            // Authentication successful
            req.user = user;
            next();
        })(req, res, next);
    },
    
    // Custom middleware for Refresh Token
    refreshToken: async (req, res, next) => {
        try {
            const { refreshToken } = req.body;
            
            if (!refreshToken) {
                return failureResponse(res, 'Refresh token required', 401);
            }
            
            const newAccessToken = await tokenService.refreshAccessToken(refreshToken);
            
            req.newAccessToken = newAccessToken;
            next();
        } catch (error) {
            // Handle token expiration errors specifically
            if (error.name === 'TokenExpiredError') {
                return unauthorizedResponse(res, 'Refresh token has expired. Please log in again.');
            }
            
            return unauthorizedResponse(res, 'Invalid refresh token');
        }
    },
    
    // Authorization middleware with role-based access control
    authorize: (...requiredRoles) => {
        return (req, res, next) => {
            if (!req.user) {
                return unauthorizedResponse(res, 'Not authenticated');
            }
            
            // Check if user has any of the required roles
            if (!requiredRoles.includes(req.user.role)) {
                // Alternative: Check permissions instead of just roles
                // This allows for more granular control
                const requiredPermissions = requiredRoles;
                if (hasAnyPermission(req.user.role, requiredPermissions)) {
                    return next();
                }
                return forbiddenResponse(res, 'Not authorized');
            }
            
            next();
        };
    },
    
    // Permission-based authorization middleware
    permit: (...requiredPermissions) => {
        return (req, res, next) => {
            if (!req.user) {
                return unauthorizedResponse(res, 'Not authenticated');
            }
            
            // Check if user's role has any of the required permissions
            if (hasAnyPermission(req.user.role, requiredPermissions)) {
                return next();
            }
            
            return forbiddenResponse(res, 'Insufficient permissions');
        };
    },
    
    // Per-user login rate limiting
    loginRateLimit: (req, res, next) => {
        // Get identifier from request (email or phone)
        const identifier = req.body.email || req.body.phone || req.ip;
        
        // Get current time
        const now = Date.now();
        
        // Get user's login attempts
        let userAttempts = loginAttempts.get(identifier);
        
        // If no previous attempts, initialize
        if (!userAttempts) {
            userAttempts = { attempts: 0, lastAttempt: 0, lockedUntil: 0 };
            loginAttempts.set(identifier, userAttempts);
        } else {
            // Check if user is currently locked out
            if (userAttempts.lockedUntil > now) {
                const timeLeft = Math.ceil((userAttempts.lockedUntil - now) / 60000); // minutes
                return failureResponse(res, `Too many login attempts, please try again in ${timeLeft} minutes (lockout for 5 minutes)`);
            }
            
            // Reset attempts if last attempt was more than 5 minutes ago
            // But only if there was a previous attempt (lastAttempt > 0)
            if (userAttempts.lastAttempt > 0 && now - userAttempts.lastAttempt > LOCKOUT_TIME) {
                userAttempts.attempts = 0;
                // Update the map with reset attempts
                loginAttempts.set(identifier, userAttempts);
            }
        }
        
        // Continue to next middleware
        next();
    },
    
    // Reset login attempts after successful login
    resetLoginAttempts: (req, res, next) => {
        // Get identifier from request (email or phone)
        const identifier = req.body.email || req.body.phone || req.ip;
        
        // Reset attempts for this user (but keep the entry)
        const userAttempts = loginAttempts.get(identifier);
        if (userAttempts) {
            userAttempts.attempts = 0;
            userAttempts.lastAttempt = Date.now();
            loginAttempts.set(identifier, userAttempts);
        }
        
        // Continue to next middleware
        next();
    },
    
    // Function to reset login attempts (can be called from controllers)
    resetLoginAttemptsForIdentifier: (identifier) => {
        const userAttempts = loginAttempts.get(identifier);
        if (userAttempts) {
            // Reset attempts but keep the entry
            userAttempts.attempts = 0;
            userAttempts.lastAttempt = Date.now();
            loginAttempts.set(identifier, userAttempts);
        }
    },
    
    // Function to increment failed login attempts (can be called from controllers)
    incrementFailedAttempts: (identifier) => {
        if (loginAttempts) {
            let userAttempts = loginAttempts.get(identifier);
            
            // If no previous attempts, initialize
            if (!userAttempts) {
                userAttempts = { attempts: 0, lastAttempt: 0, lockedUntil: 0 };
            }
            
            const now = Date.now();
            
            // Reset attempts if last attempt was more than 5 minutes ago
            // But only if there was a previous attempt (lastAttempt > 0)
            if (userAttempts.lastAttempt > 0 && now - userAttempts.lastAttempt > LOCKOUT_TIME) {
                userAttempts.attempts = 0;
            }
            
            // Increment attempts
            userAttempts.attempts += 1;
            userAttempts.lastAttempt = now;
            
            // Lock user if they've exceeded max attempts
            if (userAttempts.attempts >= MAX_LOGIN_ATTEMPTS) {
                userAttempts.lockedUntil = now + LOCKOUT_TIME;
            }
            
            // Save updated attempts
            loginAttempts.set(identifier, userAttempts);
        }
    }
};

module.exports = {
  ...authMiddleware,
  resetLoginAttemptsForIdentifier: authMiddleware.resetLoginAttemptsForIdentifier,
  incrementFailedAttempts: authMiddleware.incrementFailedAttempts
};