const TelegramBot = require('node-telegram-bot-api');
const phoneVerificationService = require('../../services/authentication/phoneVerification.service');

/**
 * Handle verification request from Telegram bot
 * @param {string} verificationToken - Token received from user
 * @param {string} telegramChatId - Telegram chat ID
 * @param {string|null} userPhoneNumber - Phone number shared by user (if available)
 * @returns {Promise<Object>} Verification result
 */
const handleVerificationRequest = async (verificationToken, telegramChatId, userPhoneNumber = null) => {
  try {
    console.log('Processing verification request:', {
      verificationToken,
      telegramChatId,
      userPhoneNumber
    });

    // Initialize Telegram bot
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return {
        success: false,
        message: 'خطأ في إعداد بوت Telegram'
      };
    }

    const bot = new TelegramBot(token);

    // Get user's phone number from Telegram
    let telegramPhoneNumber = null;
    try {
      const chatInfo = await bot.getChat(telegramChatId);
      telegramPhoneNumber = chatInfo.phone_number;
      
      console.log('Telegram phone number retrieved:', telegramPhoneNumber);
    } catch (telegramError) {
      console.error('Error getting Telegram phone number:', telegramError.message);
      return {
        success: false,
        message: 'يرجى مشاركة رقم هاتفك مع بوت Telegram أولاً'
      };
    }

    if (!telegramPhoneNumber) {
      return {
        success: false,
        message: 'لم يتم العثور على رقم هاتف مرتبط بحسابك في Telegram'
      };
    }

    // Validate verification token and get associated phone number
    // This would typically involve calling your backend API
    // For now, we'll simulate the validation
    
    // In a real implementation, you'd make an HTTP request to:
    // POST /api/auth/complete-phone-verification
    // {
    //   "phone": telegramPhoneNumber,
    //   "token": verificationToken,
    //   "telegramChatId": telegramChatId
    // }
    
    // Simulate successful verification for demo purposes
    const isSuccess = Math.random() > 0.3; // 70% success rate
    
    if (isSuccess) {
      return {
        success: true,
        phoneNumber: telegramPhoneNumber,
        message: 'تم التحقق من رقم الهاتف وربطه بنجاح مع حساب Telegram'
      };
    } else {
      return {
        success: false,
        message: 'رمز التحقق غير صحيح أو منتهي الصلاحية'
      };
    }

  } catch (error) {
    console.error('Error processing verification request:', error.message);
    return {
      success: false,
      message: 'حدث خطأ أثناء معالجة طلب التحقق'
    };
  }
};

/**
 * Get user phone number from Telegram API
 * @param {string} telegramChatId - Telegram chat ID
 * @returns {Promise<string|null>} Phone number or null if not available
 */
const getUserPhoneNumberFromTelegram = async (telegramChatId) => {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new Error('Telegram bot token not configured');
    }

    const bot = new TelegramBot(token);
    
    // Method 1: Try to get phone from chat info
    try {
      const chatInfo = await bot.getChat(telegramChatId);
      
      console.log('Chat info retrieved:', {
        id: chatInfo.id,
        first_name: chatInfo.first_name,
        last_name: chatInfo.last_name,
        username: chatInfo.username,
        phone_number: chatInfo.phone_number
      });
      
      if (chatInfo.phone_number) {
        console.log('Phone number found in chat info:', chatInfo.phone_number);
        return chatInfo.phone_number;
      }
    } catch (chatError) {
      console.log('Could not get phone from chat info:', chatError.message);
    }
    
    // Method 2: Try to get phone from user info
    try {
      const userInfo = await bot.getChatMember(telegramChatId, telegramChatId);
      
      console.log('User info retrieved:', {
        user_id: userInfo.user?.id,
        first_name: userInfo.user?.first_name,
        last_name: userInfo.user?.last_name,
        username: userInfo.user?.username,
        phone_number: userInfo.user?.phone_number
      });
      
      if (userInfo.user?.phone_number) {
        console.log('Phone number found in user info:', userInfo.user.phone_number);
        return userInfo.user.phone_number;
      }
    } catch (userError) {
      console.log('Could not get phone from user info:', userError.message);
    }
    
    // Method 3: Try to get phone from message sender (if available)
    try {
      // This would require having a recent message from the user
      // For now, we'll return null
      console.log('No phone number found in any method');
    } catch (messageError) {
      console.log('Could not get phone from message:', messageError.message);
    }
    
    return null;
    
  } catch (error) {
    console.error('Error getting user phone number from Telegram:', error.message);
    return null;
  }
};

module.exports = {
  handleVerificationRequest,
  getUserPhoneNumberFromTelegram
};
