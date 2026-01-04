const Joi = require('joi');

// Validation schema for user registration
const registerSchema = Joi.object({
  full_name: Joi.string().min(1).max(100).required().messages({
    'string.empty': 'Full name is required',
    'string.min': 'Full name must be at least 1 character long',
    'string.max': 'Full name cannot be more than 100 characters long'
  }),
  email: Joi.string().email().optional().allow(null, '').messages({
    'string.email': 'Please provide a valid email address'
  }),
  password: Joi.string().min(6).optional().allow(null, '').messages({
    'string.min': 'Password must be at least 6 characters long'
  }),
  phone: Joi.string().min(10).max(20).optional().allow(null, '').messages({
    'string.min': 'Phone number must be at least 10 characters long',
    'string.max': 'Phone number cannot be more than 20 characters long'
  })
}).custom((value, helpers) => {
  // Custom validation to ensure either email or phone is provided
  if ((!value.email || value.email.trim() === '') && (!value.phone || value.phone.trim() === '')) {
    return helpers.error('any.invalid');
  }
  return value;
}).messages({
  'any.invalid': 'Either email or phone number must be provided'
});

// Validation schema for user login
const loginSchema = Joi.object({
  email: Joi.string().email().optional().messages({
    'string.email': 'Please provide a valid email address'
  }),
  phone: Joi.string().min(10).max(20).optional().messages({
    'string.min': 'Phone number must be at least 10 characters long',
    'string.max': 'Phone number cannot be more than 20 characters long'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required'
  })
}).custom((value, helpers) => {
  // Custom validation to ensure either email or phone is provided
  if (!value.email && !value.phone) {
    return helpers.error('any.invalid');
  }
  return value;
}).messages({
  'any.invalid': 'Either email or phone number must be provided'
});

// Validation schema for OTP verification
const verifyOtpSchema = Joi.object({
  email: Joi.string().email().optional(),
  phone: Joi.string().min(10).max(20).optional(),
  otpCode: Joi.string().length(6).required()
}).custom((value, helpers) => {
  // Custom validation to ensure either email or phone is provided
  if (!value.email && !value.phone) {
    return helpers.error('any.invalid');
  }
  return value;
}).messages({
  'any.invalid': 'Either email or phone number must be provided'
});

// Validation schema for resending OTP
const resendOtpSchema = Joi.object({
  email: Joi.string().email().optional(),
  phone: Joi.string().min(10).max(20).optional()
}).custom((value, helpers) => {
  // Custom validation to ensure either email or phone is provided
  if (!value.email && !value.phone) {
    return helpers.error('any.invalid');
  }
  return value;
}).messages({
  'any.invalid': 'Either email or phone number must be provided'
});

// Validation schema for forgot password
const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().optional().messages({
    'string.email': 'Please provide a valid email address'
  }),
  phone: Joi.string().min(10).max(20).optional().messages({
    'string.min': 'Phone number must be at least 10 characters long',
    'string.max': 'Phone number cannot be more than 20 characters long'
  })
}).custom((value, helpers) => {
  // Custom validation to ensure either email or phone is provided
  if (!value.email && !value.phone) {
    return helpers.error('any.invalid');
  }
  return value;
}).messages({
  'any.invalid': 'Either email or phone number must be provided'
});

// Validation schema for resetting password
const resetPasswordSchema = Joi.object({
  email: Joi.string().email().optional().messages({
    'string.email': 'Please provide a valid email address'
  }),
  phone: Joi.string().min(10).max(20).optional().messages({
    'string.min': 'Phone number must be at least 10 characters long',
    'string.max': 'Phone number cannot be more than 20 characters long'
  }),
  otpCode: Joi.string().length(6).pattern(/^[0-9]+$/).required().messages({
    'string.length': 'OTP code must be exactly 6 digits',
    'string.pattern.base': 'OTP code must contain only digits',
    'any.required': 'OTP code is required'
  }),
  newPassword: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'New password is required'
  })
}).custom((value, helpers) => {
  // Custom validation to ensure either email or phone is provided
  if (!value.email && !value.phone) {
    return helpers.error('any.invalid');
  }
  return value;
}).messages({
  'any.invalid': 'Either email or phone number must be provided'
});

// Validate registration data
const validateRegister = (data) => {
  return registerSchema.validate(data, { abortEarly: false });
};

// Validate login data
const validateLogin = (data) => {
  return loginSchema.validate(data, { abortEarly: false });
};

// Validate OTP verification data
const validateVerifyOtp = (data) => {
  return verifyOtpSchema.validate(data, { abortEarly: false });
};

// Validate resend OTP data
const validateResendOtp = (data) => {
  return resendOtpSchema.validate(data, { abortEarly: false });
};

// Validate forgot password data
const validateForgotPassword = (data) => {
  return forgotPasswordSchema.validate(data, { abortEarly: false });
};

// Validate reset password data
const validateResetPassword = (data) => {
  return resetPasswordSchema.validate(data, { abortEarly: false });
};

module.exports = {
  validateRegister,
  validateLogin,
  validateVerifyOtp,
  validateResendOtp,
  validateForgotPassword,
  validateResetPassword
};
