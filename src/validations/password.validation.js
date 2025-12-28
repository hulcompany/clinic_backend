const Joi = require('joi');

// Forgot Password Validation Schema
const validateForgotPassword = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    })
  });
  
  return schema.validate(data);
};

// Reset Password Validation Schema
const validateResetPassword = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
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
  });
  
  return schema.validate(data);
};

module.exports = {
  validateForgotPassword,
  validateResetPassword
};