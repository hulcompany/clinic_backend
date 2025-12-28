/**
 * OTP Service
 * 
 * This service handles OTP generation, storage, validation, and email sending.
 * 
 * 
 * 
 * 
Handlebars هو مكتبة تُستخدم لمعالجة القوالب (Template Engine) في JavaScript. وظائفه الرئيسية:
معالجة القوالب: يسمح لك بكتابة قوالب HTML مع متغيرات وعبارات منطقية، ثم ملء هذه القوالب ببيانات حقيقية.
التركيب: يستخدم علامات خاصة مثل {{variable}} لإدراج المتغيرات و {{#if}} للشروط.
إعادة الاستخدام: يمكنك كتابة قالب مرة واحدة واستخدامه много مرات مع بيانات مختلفة.
الفصل بين العرض والمنطق: يساعد على فصل تصميم الواجهة عن المنطق البرمجي.
 */

const otpRepository = require('../../repositories/authentication/otp.repository');
// Log environment variables for debugging (without exposing the password)
console.log('Environment Variables Check:', {
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_SECURE: process.env.SMTP_SECURE,
  SMTP_USER: process.env.SMTP_USER,
  EMAIL_FROM: process.env.EMAIL_FROM
  // Note: Not logging SMTP_PASS for security
});

const crypto = require('crypto');
const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');

/**
 * Create email transporter
 * @returns {Object} Nodemailer transporter
 */
const createTransporter = () => {
  // Log configuration for debugging
  console.log('SMTP Configuration:', {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER
    // Note: Don't log the password for security reasons
  });
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  
  console.log('Transporter created successfully');
  return transporter;
};

/**
 * Generate a random 6-digit OTP
 * @returns {string} 6-digit OTP code
 */
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Store OTP for a user or admin
 * @param {number|null} userId - User ID (null if admin)
 * @param {number|null} adminId - Admin ID (null if user)
 * @param {string} otpCode - OTP code
 * @returns {Promise<Otp>} Created OTP record
 */
const storeOTP = async (userId, adminId, otpCode) => {
  try {
    const otp = await otpRepository.storeOTP(userId, adminId, otpCode);
    return otp;
  } catch (error) {
    // Handle database schema errors specifically
    if (error.message && error.message.includes('Unknown column')) {
      throw new Error('Database schema error. Please ensure all migrations have been run.');
    }
    throw error; // Re-throw if it's a different error
  }
};

/**
 * Validate OTP for a user or admin
 * @param {number|null} userId - User ID (null if admin)
 * @param {number|null} adminId - Admin ID (null if user)
 * @param {string} otpCode - OTP code to validate
 * @returns {Promise<boolean>} True if OTP is valid, false otherwise
 */
const validateOTP = async (userId, adminId, otpCode) => {
  try {
    const isValid = await otpRepository.validateOTP(userId, adminId, otpCode);
    return isValid;
  } catch (error) {
    // Handle database schema errors specifically
    if (error.message && error.message.includes('Unknown column')) {
      throw new Error('Database schema error. Please ensure all migrations have been run.');
    }
    throw error; // Re-throw if it's a different error
  }
};

/**
 * Send OTP via email using template
 * @param {User|Admin} user - User or Admin object
 * @param {string} otpCode - OTP code to send
 * @param {string} context - Context for email (default: 'verification')
 */
const sendOTPViaEmail = async (user, otpCode, context = 'verification') => {
  try {
    // Determine template path based on context
    const templatePath = context === 'password-reset' 
      ? path.join(__dirname, '../../templates/emails/password-reset.html')
      : path.join(__dirname, '../../templates/emails/otp.html');
    
    const templateSource = await fs.readFile(templatePath, 'utf8');
    
    // Read logo file and convert to base64
    const logoPath = path.join(__dirname, '../../../public/assets/logo/logo.png');
    let logoBase64 = '';
    try {
      const logoBuffer = await fs.readFile(logoPath);
      logoBase64 = logoBuffer.toString('base64');
      console.log('Logo loaded successfully. Base64 length:', logoBase64.length);
    } catch (logoError) {
      console.warn('Could not read logo file:', logoError.message);
    }
    
    // Compile the template
    const template = handlebars.compile(templateSource);
    
    // Prepare template data
    const templateData = {
      name: user.full_name,
      otpCode: otpCode,
      expiresIn: '10 minutes',
      currentYear: new Date().getFullYear(),
      siteUrl: process.env.DOMAIN || 'http://localhost:3000',
      logoBase64: logoBase64
    };
    
    console.log('Template data:', {
      name: user.full_name,
      hasLogo: !!logoBase64,
      logoLength: logoBase64.length,
      siteUrl: process.env.DOMAIN || 'http://localhost:3000'
    });
    
    // Generate HTML from template
    const html = template(templateData);
    
    // Log if logo is in HTML (first 500 characters)
    if (logoBase64) {
      console.log('HTML contains base64 logo:', html.includes(logoBase64.substring(0, 50)));
      console.log('HTML preview (first 500 chars):', html.substring(0, 500));
    }
    
    // Create transporter
    const transporter = createTransporter();
    
    // Define email options based on context
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: context === 'password-reset' 
        ? 'Password Reset OTP' 
        : 'Account Verification OTP',
      html: html
    };
    
    // Log email options for debugging
    console.log('Email options:', {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: mailOptions.subject
      // Note: Don't log the HTML content for brevity
    });
    
    // Log email options for debugging
    console.log('Email options:', {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: mailOptions.subject
      // Note: Don't log the HTML content for brevity
    });
    
    // Log email options for debugging
    console.log('Email options:', {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: mailOptions.subject
      // Note: Don't log the HTML content for brevity
    });
    
    // Send email
    console.log('Attempting to send email...');
    // Log the transporter object (without sensitive data)
    console.log('Transporter info:', {
      // Add any non-sensitive transporter info here if needed
    });
    // Verify transporter connection
    try {
      await transporter.verify();
      console.log('Transporter connection verified');
    } catch (verifyError) {
      console.error('Transporter verification failed:', verifyError.message);
      console.error('Verification error details:', verifyError);
      throw verifyError;
    }
    await transporter.sendMail(mailOptions);
    console.log(`OTP ${otpCode} sent successfully to ${user.email}`);
  } catch (error) {
    console.error('Failed to send OTP email:', error.message);
    console.error('Error details:', error);
    console.error('Stack trace:', error.stack);
    throw new Error('Failed to send verification email. Please try again later.');
  }
};

module.exports = {
  generateOTP,
  storeOTP,
  validateOTP,
  sendOTPViaEmail
};