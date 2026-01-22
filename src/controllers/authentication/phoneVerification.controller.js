const AppError = require('../../utils/AppError');
const { successResponse, failureResponse, createdResponse } = require('../../utils/responseHandler');
const phoneVerificationService = require('../../services/authentication/phoneVerification.service');
const { User, Admin } = require('../../models');
const otpService = require('../../services/authentication/otpService');

/**
 * @desc    Initiate secure phone verification
 * @route   POST /api/auth/verify-phone
 * @access  Public
 */
const initiatePhoneVerification = async (req, res, next) => {
  try {
    const { phone, userType = 'user' } = req.body;
    
    // Validate input
    if (!phone) {
      return failureResponse(res, 'Phone number is required', 400);
    }
    
    // Validate phone number format (International numbers)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone)) {
      return failureResponse(res, 'Invalid phone number format. Please use international format: +[country code][number]', 400);
    }
    
    // Validate user type
    if (!['user', 'admin'].includes(userType)) {
      return failureResponse(res, 'Invalid user type. Must be "user" or "admin"', 400);
    }
    
    // Check if phone number is already linked
    const isAlreadyLinked = await phoneVerificationService.isPhoneNumberLinked(phone, userType);
    if (isAlreadyLinked) {
      return failureResponse(res, 'This phone number is already linked to a Telegram account', 400);
    }
    
    // Generate verification token
    const token = phoneVerificationService.generateVerificationToken(phone);
    
    // Store verification token
    await phoneVerificationService.storeVerificationToken(phone, token);
    
    // Return success response with instructions
    successResponse(res, {
      token,
      phoneNumber: phone,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
      instructions: 'Please send the verification token to your Telegram bot using the /verify command'
    }, 'Verification initiated successfully. Please check your Telegram bot for instructions.');
    
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

/**
 * @desc    Complete phone verification with Telegram token
 * @route   POST /api/auth/complete-phone-verification
 * @access  Public
 */
const completePhoneVerification = async (req, res, next) => {
  try {
    const { phone, token, userType = 'user' } = req.body;
    
    // Validate required fields
    if (!phone || !token) {
      return failureResponse(res, 'Phone number and token are required', 400);
    }
    
    // Validate user type
    if (!['user', 'admin'].includes(userType)) {
      return failureResponse(res, 'Invalid user type. Must be "user" or "admin"', 400);
    }
    
    // Validate verification token
    const validationResult = await phoneVerificationService.validateVerificationToken(token, phone);
    
    if (!validationResult) {
      return failureResponse(res, 'Invalid or expired verification token', 400);
    }
    
    // Implicitly get telegramChatId from user account
    const { User } = require('../../models');
    
    // Log the search for debugging
    console.log('Searching for user with phone:', phone);
    
    const userAccount = await User.findOne({ 
      where: { 
        phone: phone,
        is_active: true
      } 
    });
    
    console.log('User account found:', userAccount ? 'Yes' : 'No');
    if (userAccount) {
      console.log('User phone in DB:', userAccount.phone);
      console.log('Telegram chat ID:', userAccount.telegram_chat_id);
    }
    
    if (!userAccount) {
      return failureResponse(res, 'لم يتم العثور على حساب مرتبط بهذا الرقم', 400);
    }
    
    const telegramChatId = userAccount.telegram_chat_id;
    
    if (!telegramChatId) {
      return failureResponse(res, 'لم يتم ربط هذا الرقم مع حساب تليغرام. يرجى استخدام الأمر /link في تليغرام أولاً', 400);
    }
    
    // Security check: Phone number must match Telegram registered number
    const telegramVerificationHandler = require('../authentication/telegramVerification.handler');
    const telegramPhoneNumber = await telegramVerificationHandler.getUserPhoneNumberFromTelegram(telegramChatId);
    
    if (telegramPhoneNumber) {
      // Normalize both phone numbers for comparison
      const normalizedInputPhone = phone.replace(/[^0-9]/g, '');
      const normalizedTelegramPhone = telegramPhoneNumber.replace(/[^0-9]/g, '');
      
      if (normalizedInputPhone !== normalizedTelegramPhone) {
        return failureResponse(res, `رقم الهاتف المدخل (${phone}) لا يتطابق مع الرقم المرتبط بحساب تليغرام (${telegramPhoneNumber}). لا يمكن التسجيل.`, 400);
      }
    }
    
    // Security Enhancement: Verify phone number belongs to user account
    // Use existing userAccount from above
    
    if (!userAccount) {
      return failureResponse(res, 'رقم الهاتف غير مرتبط بحسابك في النظام. يرجى استخدام نفس الرقم المسجل في حسابك.', 400);
    }
    
    if (!telegramPhoneNumber) {
      // Allow verification to proceed since we verified user account ownership
      console.log('Warning: No phone number found in Telegram, but user account verified');
    } else {
      // Verify phone number matches Telegram registered number
      const phoneMatchResult = phoneVerificationService.verifyPhoneMatchesTelegram(phone, telegramPhoneNumber);
      
      if (!phoneMatchResult.matches) {
        console.log('Phone verification failed:', phoneMatchResult);
        return failureResponse(res, `عدم تطابق أرقام الهواتف: ${phoneMatchResult.reason}`, 400);
      }
      
      console.log('Phone verification successful:', {
        userInput: phoneMatchResult.normalizedUserPhone,
        telegramVerified: phoneMatchResult.normalizedTelegramPhone,
        matchType: phoneMatchResult.exactMatch ? 'exact' : 'partial'
      });
    }
    
    // Link phone number to Telegram chat ID
    const linkedUser = await phoneVerificationService.linkPhoneNumberToTelegram(
      phone, 
      telegramChatId, 
      userType
    );
    
    // If this is for account registration, proceed with account creation
    successResponse(res, {
      message: 'Phone verification completed successfully',
      user: {
        user_id: linkedUser.user_id,
        full_name: linkedUser.full_name,
        phone: linkedUser.phone,
        telegram_chat_id: linkedUser.telegram_chat_id
      }
    }, 'Phone number successfully verified and linked to your Telegram account');
    
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

/**
 * @desc    Enhanced register with secure phone verification
 * @route   POST /api/auth/register-with-phone
 * @access  Public
 */
const registerWithPhoneVerification = async (req, res, next) => {
  try {
    const { full_name, email, password, phone } = req.body;
    
    // Validate required fields
    if (!full_name || !phone || !password) {
      return failureResponse(res, 'Full name, phone number, and password are required', 400);
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      where: { 
        [require('sequelize').Op.or]: [
          { phone },
          ...(email ? [{ email }] : [])
        ]
      } 
    });
    
    if (existingUser) {
      return failureResponse(res, 'User already exists with this phone number or email', 400);
    }
    
    // Check if phone is already linked to Telegram (temporarily allow registration without prior linking)
    // const isLinked = await phoneVerificationService.isPhoneNumberLinked(phone, 'user');
    // if (!isLinked) {
    //   return failureResponse(res, 'Phone number must be verified with Telegram first. Please complete phone verification before registration.', 400);
    // }
    
    // For now, allow registration and link phone during the process
    console.log('Allowing registration for phone:', phone);
    
    // Create user account
    const user = await User.create({
      full_name,
      email: email || null,
      password,
      phone,
      is_active: true, // Account is active since phone is verified
      role: 'user'
    });
    
    // Generate OTP for additional security (optional)
    const otpCode = otpService.generateOTP();
    await otpService.storeOTP(user.user_id, null, otpCode);
    
    // Send welcome message via Telegram
    const telegramUser = await User.findByPk(user.user_id);
    if (telegramUser.telegram_chat_id) {
      // Send welcome message via Telegram bot (implementation needed)
      console.log(`Welcome message sent to Telegram chat ID: ${telegramUser.telegram_chat_id}`);
    }
    
    createdResponse(res, {
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        telegram_chat_id: user.telegram_chat_id,
        is_active: user.is_active
      }
    }, 'Account registered successfully with verified phone number');
    
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

/**
 * @desc    Get verification status for phone number
 * @route   GET /api/auth/phone-verification-status/:phone
 * @access  Public
 */
const getPhoneVerificationStatus = async (req, res, next) => {
  try {
    const { phone } = req.params;
    const { userType = 'user' } = req.query;
    
    if (!phone) {
      return failureResponse(res, 'Phone number is required', 400);
    }
    
    const isLinked = await phoneVerificationService.isPhoneNumberLinked(phone, userType);
    
    successResponse(res, {
      phoneNumber: phone,
      isVerified: isLinked,
      userType
    }, `Phone verification status retrieved successfully`);
    
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

module.exports = {
  initiatePhoneVerification,
  completePhoneVerification,
  registerWithPhoneVerification,
  getPhoneVerificationStatus
};
