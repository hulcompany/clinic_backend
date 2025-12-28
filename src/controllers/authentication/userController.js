const { User } = require('../../models/index');
const AppError = require('../../utils/AppError');
const { userService } = require('../../services/index');
const { 
  successResponse, 
  failureResponse, 
  notFoundResponse 
} = require('../../utils/responseHandler');

// Helper function to validate image upload
const validateImageUpload = (req) => {
  let imagePath = null;
  if (req.file) {
    imagePath = req.file.filename;
  } else if (req.files && req.files.length > 0) {
    // For multiple files, take the first one
    imagePath = req.files[0].filename;
  }
  return imagePath;
};

// @desc    Get authenticated user's own profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    // req.user is set by the authentication middleware
    const user = await userService.getUserById(req.user.user_id);
    
    if (!user) {
      return notFoundResponse(res, 'User not found');
    }
    
    successResponse(res, {
      data: user
    }, 'Profile fetched successfully');
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

// @desc    Update authenticated user's own profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    // Update user fields (only allow updating certain fields)
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
    
    const updatedUser = await userService.updateUser(req.user.user_id, updates);
    
    successResponse(res, {
      data: updatedUser
    }, 'Profile updated successfully');
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
  try {
    // Get pagination parameters from query, with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const result = await userService.getAllUsers(page, limit);
    
    successResponse(res, {
      data: result.users,
      pagination: result.pagination
    }, 'Users fetched successfully');
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
const getUser = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    
    if (!user) {
      return notFoundResponse(res, 'User not found');
    }
    
    successResponse(res, {
      data: user
    }, 'User fetched successfully');
  } catch (error) {
    if (error.statusCode === 404) {
      return notFoundResponse(res, 'User not found');
    }
    next(new AppError(error.message, 500));
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res, next) => {
  try {
    // Update user fields
    const updates = { ...req.body };
    
    // Add image path if it was uploaded (set by middleware)
    const imagePath = validateImageUpload(req);
    if (imagePath) {
      updates.image = imagePath;
    }
    
    const updatedUser = await userService.updateUser(req.params.id, updates);
    
    successResponse(res, {
      data: updatedUser
    }, 'User updated successfully');
  } catch (error) {
    if (error.statusCode === 404) {
      return notFoundResponse(res, 'User not found');
    }
    next(new AppError(error.message, 500));
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id);
    
    successResponse(res, null, 'User deleted successfully');
  } catch (error) {
    if (error.statusCode === 404) {
      return notFoundResponse(res, 'User not found');
    }
    next(new AppError(error.message, 500));
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getUsers,
  getUser,
  updateUser,
  deleteUser  
};