const { Admin, User } = require('../../models/index');
const { adminService, tokenService, otpService } = require('../../services/index');
const AppError = require('../../utils/AppError');
const { successResponse, createdResponse, failureResponse ,unauthorizedResponse} = require('../../utils/responseHandler');
const { validateRegister,validateLogin, validateVerifyOtp, validateResendOtp, validateForgotPassword, validateResetPassword } = require('../../utils/validation');

 
const { buildImageUrl } = require('../../utils/mediaUtils');
// Import login attempts functions from auth middleware
const { resetLoginAttemptsForIdentifier, incrementFailedAttempts } = require('../../middleware/auth.middleware');

// Helper function to validate admin permissions
const validateAdminPermissions = async (admin, requiredRole) => {
  if (requiredRole === 'doctor' && admin.role !== 'doctor' && admin.role !== 'admin' && admin.role !== 'super_admin') {
    return false; // Return false to indicate unauthorized access
  }
  return true; // Return true to indicate authorized access
};

// Helper function to validate image upload
const validateImageUpload = (req) => {
  let imagePath = null;
  if (req.files && req.files.length > 0) {
    imagePath = req.files[0].filename;
  } else if (req.file) {
    imagePath = req.file.filename;
  }
  return imagePath;
};

// Helper function to format admin response
const formatAdminResponse = (admin) => {
  const adminData = admin.toJSON ? admin.toJSON() : admin;
  return {
    user_id: adminData.user_id,
    full_name: adminData.full_name,
    email: adminData.email,
    phone: adminData.phone,
    role: adminData.role,
    image: adminData.image,
    imageUrl: buildImageUrl(adminData.image, 'admins'),
    is_active: adminData.is_active
  };
};

// Helper function to handle OTP operations
const handleOTP = async (admin, action = 'verify') => {
  const otpCode = otpService.generateOTP();
  await otpService.storeOTP(null, admin.user_id, otpCode);
  
  if (admin.email) {
    await otpService.sendOTPViaEmail(admin, otpCode, action === 'reset' ? 'password-reset' : undefined);
  }
  
  return otpCode;
};

// Helper function to handle token operations
const handleTokens = async (admin) => {
  const tokens = await tokenService.generateTokens(admin, 'admin');
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
 * @desc    Get authenticated admin's own profile
 * @route   GET /api/admin/profile
 * @access  Private
 */
const getProfile = async (req, res, next) => {
  try {
    // req.user is set by the authentication middleware
    const admin = await Admin.findByPk(req.user.user_id, {
      attributes: { exclude: ['password'] } // Exclude password from results
    });
    
    if (!admin) {
      return failureResponse(res, 'Admin not found', 404);
    }
    
    successResponse(res, {
      data: formatAdminResponse(admin)
    }, 'Profile fetched successfully');
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

/**
 * @desc    Update authenticated admin's own profile
 * @route   PUT /api/admin/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    // req.user is set by the authentication middleware
    const admin = await Admin.findByPk(req.user.user_id);
    
    if (!admin) {
      return failureResponse(res, 'Admin not found', 404);
    }
    
    // Update admin fields (only allow updating certain fields)
    const allowedFields = ['full_name', 'email', 'phone'];
    const updates = {};
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    
    // Add image path if it was uploaded (set by middleware)
    const imagePath = validateImageUpload(req);
    if (imagePath) {
      updates.image = imagePath;
    }
    
    const updatedAdmin = await admin.update(updates);
    
    successResponse(res, {
      data: formatAdminResponse(updatedAdmin)
    }, 'Profile updated successfully');
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

/**
 * @desc    Toggle user restriction status (only accessible by doctors)
 * @route   PUT /api/admin/users/:id/toggle-restriction
 * @access  Private/Admin (Doctors only)
 */
const toggleUserRestriction = async (req, res, next) => {
  try {
    // Check if the requesting admin is a doctor
    const isAuthorized = await validateAdminPermissions(req.user, 'doctor');
    if (!isAuthorized) {
      return unauthorizedResponse(res, 'Only doctors can modify user access restrictions');
    }
    
    const userId = req.params.id;
    
    // Find the user
    const user = await User.findByPk(userId);
    
    if (!user) {
      return failureResponse(res, 'User not found', 404);
    }
    
    // Toggle the user restriction status (0 or 1 for boolean in database)
    const newRestrictionStatus = user.is_restricted ? 0 : 1;
    await user.update({ is_restricted: newRestrictionStatus });
    
    const message = newRestrictionStatus 
      ? 'User access restricted successfully. Only doctors can now access this user.'
      : 'User access unrestricted successfully. All authorized users can now access this user.';
    
    successResponse(res, {
      data: {
        ...user.toJSON(),
        is_restricted: newRestrictionStatus
      }
    }, message);
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

/**
 * @desc    Register admin (doctor or secretary)
 * @route   POST /api/admin/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { full_name, email, password, phone, role } = req.body;

    // Validate input data using Joi
    const { error } = validateRegister({ full_name, email, password, phone });
    if (error) {
      return failureResponse(res, error.details.map(detail => detail.message).join(', '), 400);
    }

    // Check if an image was uploaded
    const imagePath = validateImageUpload(req);

    // Register admin through admin service with image if available
    const result = await adminService.registerAdmin({ 
      full_name, 
      email, 
      password, 
      phone,
      image: imagePath,
      role: role || 'doctor' // Default to 'doctor' if not specified
    });

    // Generate OTP for email verification
    await handleOTP(result.admin);

    createdResponse(res, {
      admin: formatAdminResponse(result.admin)
    }, 'Admin registered successfully. Please check your email for verification code.');
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

/**
 * @desc    Verify admin email with OTP
 * @route   POST /api/admin/verify-otp
 * @access  Public
 */
const verifyOTP = async (req, res, next) => {
  try {
    const { email, otpCode } = req.body;

    // Validate input data using Joi
    const { error } = validateVerifyOtp({ email, otpCode });
    if (error) {
      return failureResponse(res, error.details.map(detail => detail.message).join(', '), 400);
    }

    // Find admin by email
    const admin = await Admin.findOne({ where: { email } });
    if (!admin) {
      return failureResponse(res, 'Admin not found', 404);
    }

    // Validate OTP
    let isValid;
    try {
      isValid = await otpService.validateOTP(null, admin.user_id, otpCode); // Pass null for user_id, admin_id for admin
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

    // Activate admin account
    await admin.update({ is_active: true });
    
    // Refresh admin object to get updated values
    const updatedAdmin = await Admin.findByPk(admin.user_id);

    // Generate tokens
    const tokens = await handleTokens(updatedAdmin);

    successResponse(res, {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      admin: formatAdminResponse(admin)
    }, 'Email verified successfully. Your account is now active.');
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

/**
 * @desc    Resend OTP for admin email verification
 * @route   POST /api/admin/resend-otp
 * @access  Public
 */
const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Validate input data using Joi
    const { error } = validateResendOtp({ email });
    if (error) {
      return failureResponse(res, error.details.map(detail => detail.message).join(', '), 400);
    }

    // Find admin by email
    const admin = await Admin.findOne({ where: { email } });
    if (!admin) {
      return failureResponse(res, 'Admin not found', 404);
    }

    // Check if admin is already active
    if (admin.is_active) {
      return failureResponse(res, 'Account is already verified', 400);
    }

    // Generate new OTP
    const otpCode = otpService.generateOTP();
    await otpService.storeOTP(null, admin.user_id, otpCode); // Pass null for user_id, admin_id for admin
    
    // Send OTP via email
    if (admin.email) {
      await otpService.sendOTPViaEmail(admin, otpCode);
    }

    successResponse(res, null, 'OTP sent successfully. Please check your email.');
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

/**
 * @desc    Login admin
 * @route   POST /api/admin/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input data using Joi
    const { error } = validateLogin({ email, password });
    if (error) {
      return failureResponse(res, error.details.map(detail => detail.message).join(', '), 400);
    }

    // Login admin through admin service (includes verification check)
    const result = await adminService.loginAdmin({ email, password });

    // Check if admin account is active
    if (result.admin.is_active == 0 || result.admin.is_active == false) {
      return unauthorizedResponse(res, 'Please verify your email before logging in');
    }

    // Generate tokens
    const tokens = await handleTokens(result.admin);

    // Reset login attempts after successful login
    const identifier = email || req.body.phone || req.ip;
    resetLoginAttemptsForIdentifier(identifier);
    
    successResponse(res, {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      admin: formatAdminResponse(result.admin)
    }, 'Login successful');
  } catch (error) {
    // Increment failed login attempts
    const identifier = req.body.email || req.body.phone || req.ip;
    incrementFailedAttempts(identifier);
    
    next(new AppError(error.message, 401));
  }
};

/**
 * @desc    Logout admin
 * @route   POST /api/admin/logout
 * @access  Private
 */
const logout = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // Check if authorization header exists
    if (!authHeader) {
      console.error('Admin logout error: No authorization header provided');
      return failureResponse(res, 'No authorization header provided', 400);
    }
    
    // Check if header starts with Bearer
    if (!authHeader.startsWith('Bearer ')) {
      console.error('Admin logout error: Invalid authorization header format');
      return failureResponse(res, 'Invalid authorization header format. Expected Bearer token.', 400);
    }
    
    const token = authHeader.split(' ')[1];
    
    // Check if token exists
    if (!token) {
      console.error('Admin logout error: No token provided');
      return failureResponse(res, 'No token provided', 400);
    }
    
    try {
      await handleLogout(token, req.body.refreshToken);
      successResponse(res, null, 'Logged out successfully');
    } catch (error) {
      console.error('Admin token verification error:', error.name, error.message);
      if (error.name === 'TokenExpiredError') {
        return failureResponse(res, 'Token has expired', 401);
      } else if (error.name === 'JsonWebTokenError') {
        return failureResponse(res, 'Invalid token format', 401);
      } else {
        return failureResponse(res, 'Token verification failed: ' + error.message, 401);
      }
    }
  } catch (error) {
    console.error('Unexpected admin logout error:', error.name, error.message, error.stack);
    // If token is invalid or expired, still return success for security reasons
    // This prevents attackers from knowing if a token was valid
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return successResponse(res, null, 'Logged out successfully');
    }
    next(new AppError('Unexpected error during admin logout: ' + error.message, 500));
  }
};

/**
 * @desc    Request password reset (send OTP)
 * @route   POST /api/admin/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    // Validate input data using Joi
    const { error } = validateForgotPassword({ email });
    if (error) {
      return failureResponse(res, error.details.map(detail => detail.message).join(', '), 400);
    }
    
    // Find admin by email
    const admin = await Admin.findOne({ where: { email } });
    if (!admin) {
      return failureResponse(res, 'No admin found with this email address', 404);
    }
    
    // Generate new OTP
    const otpCode = otpService.generateOTP();
    await otpService.storeOTP(null, admin.user_id, otpCode); // Pass null for user_id, admin_id for admin
    
    // Send OTP via email
    await otpService.sendOTPViaEmail(admin, otpCode, 'password-reset');
    
    successResponse(res, null, 'Password reset OTP sent successfully. Please check your email.');
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

/**
 * @desc    Reset password with OTP
 * @route   POST /api/admin/reset-password
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
  try {
    const { email, otpCode, newPassword } = req.body;
    
    // Validate input data using Joi
    const { error } = validateResetPassword({ email, otpCode, newPassword });
    if (error) {
      return failureResponse(res, error.details.map(detail => detail.message).join(', '), 400);
    }
    
    // Find admin by email
    const admin = await Admin.findOne({ where: { email } });
    if (!admin) {
      return failureResponse(res, 'No admin found with this email address', 404);
    }
    
    // Verify OTP
    let isValid;
    try {
      isValid = await otpService.validateOTP(null, admin.user_id, otpCode); // Pass null for user_id, admin_id for admin
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
    await admin.update({ password: newPassword });
    
    successResponse(res, null, 'Password reset successfully');
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

/**
 * @desc    Register secretary by doctor
 * @route   POST /api/admin/register-secretary
 * @access  Private (Doctor only)
 */
const registerSecretaryByDoctor = async (req, res, next) => {
  try {
    // Check if the requesting admin is a doctor
    const isAuthorized = await validateAdminPermissions(req.user, 'doctor');
    if (!isAuthorized) {
      return unauthorizedResponse(res, 'Only doctors can register secretaries');
    }
    
    const { full_name, email, password, phone, role } = req.body;
    
    // Validate input data using Joi
    const { error } = validateRegister({ full_name, email, password, phone });
    if (error) {
      return failureResponse(res, error.details.map(detail => detail.message).join(', '), 400);
    }
    
    // Check if an image was uploaded
    const imagePath = validateImageUpload(req);
    
    // Register secretary through admin service with supervisor_id set to doctor's ID
    const result = await adminService.registerSecretaryByDoctor(req.user.user_id, { 
      full_name, 
      email, 
      password, 
      phone,
      image: imagePath,
      role: role || 'secretary' // Default to 'secretary' if not specified
    });
    
    // Generate OTP for email verification
    await handleOTP(result.admin);
    
    createdResponse(res, {
      admin: formatAdminResponse(result.admin)
    }, 'Secretary registered successfully and assigned to you. Please check your email for verification code.');
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

/**
 * @desc    Assign secretary to doctor
 * @route   PUT /api/admin/secretaries/:secretaryId/assign-to-doctor/:doctorId
 * @access  Private (Admin only)
 */
const assignSecretaryToDoctor = async (req, res, next) => {
  try {
    const { secretaryId, doctorId } = req.params;
    
    // Only admins can assign secretaries to doctors
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return unauthorizedResponse(res, 'Only admins can assign secretaries to doctors');
    }
    
    const result = await adminService.assignSecretaryToDoctor(secretaryId, doctorId);
    
    successResponse(res, {
      admin: formatAdminResponse(result.admin)
    }, 'Secretary assigned to doctor successfully');
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

/**
 * @desc    Get secretaries by doctor
 * @route   GET /api/admin/doctors/:doctorId/secretaries
 * @access  Private (Doctor or Admin only)
 */
const getSecretariesByDoctor = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    
    // Check if the requesting user is authorized to view this information
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && req.user.user_id != doctorId) {
      return unauthorizedResponse(res, 'You can only view secretaries assigned to you');
    }
    
    const result = await adminService.getSecretariesByDoctor(doctorId);
    
    successResponse(res, {
      secretaries: result.secretaries.map(secretary => formatAdminResponse(secretary))
    }, 'Secretaries retrieved successfully');
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

module.exports = {
  getProfile,
  updateProfile,
  toggleUserRestriction, // Single function to toggle restriction
  register,
  verifyOTP,
  resendOTP,
  login,
  logout,
  forgotPassword,
  resetPassword,
  registerSecretaryByDoctor,
  assignSecretaryToDoctor,
  getSecretariesByDoctor
};