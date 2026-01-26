const { User, Admin } = require('../../models/index');
const { authService, tokenService, otpService, autoNotificationService } = require('../../services/index');
const AppError = require('../../utils/AppError');
const { 
  createdResponse, 
  successResponse, 
  failureResponse, 
  unauthorizedResponse 
} = require('../../utils/responseHandler');
const { buildImageUrl } = require('../../utils/mediaUtils');
const { validateRegister, validateLogin, validateVerifyOtp, validateResendOtp, validateForgotPassword, validateResetPassword } = require('../../utils/validation');

// Validation function for resend OTP with phone
const validateResendOTPWithPhone = (data) => {
  const schema = {
    email: Joi.string().email().optional(),
    phone: Joi.string().optional()
  };
  
  return Joi.object(schema).validate(data);
};
// Import login attempts functions from auth middleware
const { resetLoginAttemptsForIdentifier, incrementFailedAttempts } = require('../../middleware/auth.middleware');

// Helper function to validate image upload
const validateImageUpload = (req) => {
  let imagePath = null;
  if (req.uploadResult && req.uploadResult.success && req.uploadResult.file) {
    // Store just the filename with extension
    imagePath = req.uploadResult.file.filename;
  }
  return imagePath;
};

// Helper function to format user response
const formatUserResponse = (user) => {
  const userData = user.toJSON ? user.toJSON() : user;
  return {
    user_id: userData.user_id,
    full_name: userData.full_name,
    email: userData.email,
    phone: userData.phone,
    image: userData.image,
    imageUrl: buildImageUrl(userData.image, 'users'),
    is_active: userData.is_active
  };
};

// Helper function to handle OTP operations
const handleOTP = async (user, action = 'verify') => {
  const otpCode = otpService.generateOTP();
  await otpService.storeOTP(user.user_id, null, otpCode);
  
  // Send OTP via email if available
  if (user.email) {
    await otpService.sendOTPViaEmail(user, otpCode, action === 'reset' ? 'password-reset' : undefined);
  }
  
  // Send OTP via Telegram if phone and telegram chat ID are available
  if (user.phone && user.telegram_chat_id) {
    await otpService.sendOTPViaTelegram(user, otpCode, action === 'reset' ? 'password-reset' : undefined);
  }
  
  return otpCode;
};

// Helper function to handle token operations
const handleTokens = async (user) => {
  const tokens = await tokenService.generateTokens(user);
  return tokens;
};

// Helper function to handle logout operations
const handleLogout = async (token, refreshToken) => {
  // Verify the token to get its expiration time
  let decoded;
  try {
    decoded = tokenService.verifyToken(token);
  } catch (verifyError) {
    throw verifyError;
  }
  
  // Calculate expiration time for the token
  const expiresAt = new Date(decoded.exp * 1000);
  
  // Add token to blacklist
  await tokenService.blacklistToken(token, expiresAt);
  
  // Also delete the refresh token if provided
  if (refreshToken) {
    await tokenService.deleteRefreshToken(refreshToken);
  }
  
  return true;
};

/**
 * @desc    Register user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { full_name, email, password, phone } = req.body;

    // Validate input data using Joi
    const { error } = validateRegister({ full_name, email, password, phone });
    if (error) {
      return failureResponse(res, error.details.map(detail => detail.message).join(', '), 400);
    }

    // Check if an image was uploaded
    const imagePath = validateImageUpload(req);

    // Register user through auth service with image if available
    const result = await authService.registerUser({ 
      full_name, 
      email, 
      password, 
      phone,
      image: imagePath
    });

    // Generate OTP for email verification
    await handleOTP(result.user);

    // Send notification to admins about new user registration
    try {
      const adminUsers = await Admin.findAll({ 
        where: { role: 'admin' }
      });
      
      if (adminUsers.length > 0) {
        await autoNotificationService.createNewUserRegistrationNotification(
          adminUsers, 
          result.user
        );
      }
    } catch (notificationError) {
      console.error('Failed to send new user registration notification:', notificationError);
      // Don't fail the registration if notification fails
    }
    createdResponse(res, {
      user: formatUserResponse(result.user)
    }, 'User registered successfully. Please check your email for verification code.');
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

/**
 * @desc    Verify user email with OTP
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOTP = async (req, res, next) => {
  try {
    const { email, phone, otpCode } = req.body;

    // Validate input data using Joi
    const { error } = validateVerifyOtp({ email, phone, otpCode });
    if (error) {
      return failureResponse(res, error.details.map(detail => detail.message).join(', '), 400);
    }

    // Find user by email or phone
    let user;
    if (email) {
      user = await User.findOne({ where: { email } });
    } else if (phone) {
      user = await User.findOne({ where: { phone } });
    }
    
    if (!user) {
      return failureResponse(res, 'User not found', 404);
    }

    // Validate OTP
    let isValid;
    try {
      isValid = await otpService.validateOTP(user.user_id, null, otpCode); // Pass null for admin_id
    } catch (otpError) {
      // Handle database schema errors specifically
      if (otpError.message && otpError.message.includes('Unknown column')) {
        return failureResponse(res, 'Database schema error. Please ensure all migrations have been run.', 500);
      }
      throw otpError; // Re-throw if it's a different error
    }
    
    if (!isValid) {
      return failureResponse(res, 'Invalid or expired OTP', 400);
    }

    // Activate user account
    await user.update({ is_active: true });
    
    // Refresh user object to get updated values
    const updatedUser = await User.findByPk(user.user_id);

    // Generate tokens
    const tokens = await handleTokens(updatedUser);

    successResponse(res, {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: formatUserResponse(updatedUser)
    }, 'Account verified successfully');
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

/**
 * @desc    Resend OTP
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
const resendOTP = async (req, res, next) => {
  try {
    const { email, phone } = req.body;

    // Validate that either email or phone is provided
    if (!email && !phone) {
      return failureResponse(res, 'Either email or phone is required', 400);
    }

    // Find user by email or phone
    let user;
    if (email) {
      user = await User.findOne({ where: { email } });
    } else if (phone) {
      user = await User.findOne({ where: { phone } });
    }
    
    if (!user) {
      return failureResponse(res, 'User not found', 404);
    }

    // Generate new OTP
    const otpCode = otpService.generateOTP();
    await otpService.storeOTP(user.user_id, null, otpCode); // Pass null for admin_id
    
    // Send OTP via email
    if (user.email) {
      await otpService.sendOTPViaEmail(user, otpCode);
    }
    
    // Send OTP via Telegram if phone and telegram chat ID are available
    if (user.phone && user.telegram_chat_id) {
      await otpService.sendOTPViaTelegram(user, otpCode);
    }

    successResponse(res, null, 'OTP sent successfully. Please check your email and/or Telegram for the code.');
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, phone, password } = req.body;

    // Validate input data using Joi
    const { error } = validateLogin({ email, phone, password });
    if (error) {
      return failureResponse(res, error.details.map(detail => detail.message).join(', '), 400);
    }

    // Validate that either email or phone is provided
    if (!email && !phone) {
      return failureResponse(res, 'Either email or phone is required', 400);
    }

    // Login user through auth service
    const result = await authService.loginUser({ email, phone, password });

    // Check if user account is active
    if (result.user.is_active == 0 || result.user.is_active == false) {
      return unauthorizedResponse(res, 'Please verify your email or phone before logging in');
    }

    // Generate tokens
    const tokens = await handleTokens(result.user);

    // Reset login attempts after successful login
    const identifier = email || phone || req.ip;
    resetLoginAttemptsForIdentifier(identifier);
    
    successResponse(res, {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: formatUserResponse(result.user)
    }, 'Login successful');
  } catch (error) {
    // Increment failed login attempts
    const identifier = req.body.email || req.body.phone || req.ip;
    incrementFailedAttempts(identifier);
    
    next(new AppError(error.message, 401));
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // Check if authorization header exists
    if (!authHeader) {
      console.error('Logout error: No authorization header provided');
      return failureResponse(res, 'No authorization header provided', 400);
    }
    
    // Check if header starts with Bearer
    if (!authHeader.startsWith('Bearer ')) {
      console.error('Logout error: Invalid authorization header format');
      return failureResponse(res, 'Invalid authorization header format. Expected Bearer token.', 400);
    }
    
    const token = authHeader.split(' ')[1];
    
    // Check if token exists
    if (!token) {
      console.error('Logout error: No token provided');
      return failureResponse(res, 'No token provided', 400);
    }
    
    try {
      await handleLogout(token, req.body.refreshToken);
      successResponse(res, null, 'Logged out successfully');
    } catch (error) {
      console.error('Token verification error:', error.name, error.message);
      if (error.name === 'TokenExpiredError') {
        return failureResponse(res, 'Token has expired', 401);
      } else if (error.name === 'JsonWebTokenError') {
        return failureResponse(res, 'Invalid token format', 401);
      } else {
        return failureResponse(res, 'Token verification failed: ' + error.message, 401);
      }
    }
  } catch (error) {
    console.error('Unexpected logout error:', error.name, error.message, error.stack);
    // If token is invalid or expired, still return success for security reasons
    // This prevents attackers from knowing if a token was valid
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return successResponse(res, null, 'Logged out successfully');
    }
    next(new AppError('Unexpected error during logout: ' + error.message, 500));
  }
};

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh-tokens
 * @access  Public
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return failureResponse(res, 'Refresh token is required', 400);
    }
    
    const newAccessToken = await tokenService.refreshAccessToken(refreshToken);
    
    successResponse(res, {
      accessToken: newAccessToken,
      expiresIn: 15 * 60 // 15 minutes in seconds
    }, 'Token refreshed successfully');
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return failureResponse(res, 'Refresh token has expired', 401);
    }
    if (error.name === 'JsonWebTokenError') {
      return failureResponse(res, 'Invalid refresh token', 401);
    }
    next(new AppError(error.message, 401));
  }
};

/**
 * @desc    Request password reset (send OTP)
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email, phone } = req.body;
    
    // Validate that either email or phone is provided
    if (!email && !phone) {
      return failureResponse(res, 'Either email or phone is required', 400);
    }

    // Find user by email or phone
    let user;
    if (email) {
      user = await User.findOne({ where: { email } });
    } else if (phone) {
      user = await User.findOne({ where: { phone } });
    }
    
    if (!user) {
      return failureResponse(res, 'No user found with this email or phone number', 404);
    }
    
    // Generate new OTP
    const otpCode = otpService.generateOTP();
    await otpService.storeOTP(user.user_id, null, otpCode); // Pass null for admin_id
    
    // Send OTP via email
    if (user.email) {
      await otpService.sendOTPViaEmail(user, otpCode, 'password-reset');
    }
    
    // Send OTP via Telegram if phone and telegram chat ID are available
    if (user.phone && user.telegram_chat_id) {
      await otpService.sendOTPViaTelegram(user, otpCode, 'password-reset');
    }
    
    successResponse(res, null, 'Password reset OTP sent successfully. Please check your email and/or Telegram for the code.');
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

/**
 * @desc    Reset password with OTP
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
  try {
    const { email, phone, otpCode, newPassword } = req.body;
    
    // Validate that either email or phone is provided
    if (!email && !phone) {
      return failureResponse(res, 'Either email or phone is required', 400);
    }
    
    // Find user by email or phone
    let user;
    if (email) {
      user = await User.findOne({ where: { email } });
    } else if (phone) {
      user = await User.findOne({ where: { phone } });
    }
    
    if (!user) {
      return failureResponse(res, 'No user found with this email or phone number', 404);
    }
    
    // Verify OTP
    let isValid;
    try {
      isValid = await otpService.validateOTP(user.user_id, null, otpCode); // Pass null for admin_id
    } catch (otpError) {
      // Handle database schema errors specifically
      if (otpError.message && otpError.message.includes('Unknown column')) {
        return failureResponse(res, 'Database schema error. Please ensure all migrations have been run.', 500);
      }
      throw otpError; // Re-throw if it's a different error
    }
    
    if (!isValid) {
      return failureResponse(res, 'Invalid or expired OTP', 400);
    }
    
    // Update password
    await user.update({ password: newPassword });
    
    successResponse(res, null, 'Password reset successfully');
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

module.exports = {
  register,
  verifyOTP,
  resendOTP,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword
};

