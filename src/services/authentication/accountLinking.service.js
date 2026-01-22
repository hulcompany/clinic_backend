const { User } = require('../../models');
const secureNumberMatchingService = require('./secureNumberMatching.service');

/**
 * Automatic Account Linking Service
 * Links user accounts with Telegram after successful phone verification
 */

class AccountLinkingService {
  /**
   * Link user account with Telegram chat ID
   * @param {number} userId - User database ID
   * @param {string} telegramChatId - Telegram chat ID
   * @param {string} verifiedPhoneNumber - Verified phone number
   * @returns {Promise<Object>} Linking result
   */
  async linkAccountWithTelegram(userId, telegramChatId, verifiedPhoneNumber) {
    try {
      console.log('Linking account with Telegram:', {
        userId,
        telegramChatId,
        verifiedPhoneNumber
      });

      // Find user by ID
      const user = await User.findByPk(userId);
      if (!user) {
        return {
          success: false,
          message: 'المستخدم غير موجود'
        };
      }

      // Check if already linked
      if (user.telegram_chat_id) {
        return {
          success: true,
          message: 'الحساب مربوط بالفعل مع Telegram',
          alreadyLinked: true
        };
      }

      // Update user record with Telegram information
      await user.update({
        telegram_chat_id: telegramChatId,
        phone_verified: true,
        phone_verified_at: new Date(),
        updated_at: new Date()
      });

      console.log('Account successfully linked with Telegram for user:', userId);

      return {
        success: true,
        message: 'تم ربط الحساب بنجاح مع Telegram',
        user: {
          id: user.id,
          email: user.email,
          telegram_chat_id: telegramChatId,
          phone_verified: true
        }
      };

    } catch (error) {
      console.error('Error linking account with Telegram:', error.message);
      return {
        success: false,
        message: 'حدث خطأ أثناء ربط الحساب مع Telegram',
        error: error.message
      };
    }
  }

  /**
   * Unlink Telegram from user account
   * @param {number} userId - User database ID
   * @returns {Promise<Object>} Unlinking result
   */
  async unlinkTelegramFromAccount(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        return {
          success: false,
          message: 'المستخدم غير موجود'
        };
      }

      if (!user.telegram_chat_id) {
        return {
          success: true,
          message: 'الحساب غير مربوط مع Telegram'
        };
      }

      // Remove Telegram linking
      await user.update({
        telegram_chat_id: null,
        phone_verified: false,
        phone_verified_at: null,
        updated_at: new Date()
      });

      console.log('Telegram successfully unlinked from user:', userId);

      return {
        success: true,
        message: 'تم فك ربط الحساب من Telegram',
        user: {
          id: user.id,
          email: user.email,
          telegram_chat_id: null,
          phone_verified: false
        }
      };

    } catch (error) {
      console.error('Error unlinking Telegram from account:', error.message);
      return {
        success: false,
        message: 'حدث خطأ أثناء فك ربط الحساب من Telegram',
        error: error.message
      };
    }
  }

  /**
   * Get linked Telegram information for user
   * @param {number} userId - User database ID
   * @returns {Promise<Object>} Telegram linking information
   */
  async getTelegramLinkingInfo(userId) {
    try {
      const user = await User.findByPk(userId, {
        attributes: ['id', 'email', 'telegram_chat_id', 'phone_verified', 'phone_verified_at']
      });

      if (!user) {
        return {
          linked: false,
          message: 'المستخدم غير موجود'
        };
      }

      const isLinked = !!user.telegram_chat_id;

      return {
        linked: isLinked,
        userId: user.id,
        email: user.email,
        telegramChatId: user.telegram_chat_id,
        phoneVerified: user.phone_verified,
        phoneVerifiedAt: user.phone_verified_at,
        message: isLinked ? 'الحساب مربوط مع Telegram' : 'الحساب غير مربوط مع Telegram'
      };

    } catch (error) {
      console.error('Error getting Telegram linking info:', error.message);
      return {
        linked: false,
        message: 'حدث خطأ أثناء الحصول على معلومات الربط',
        error: error.message
      };
    }
  }

  /**
   * Verify if account linking is secure
   * @param {number} userId - User database ID
   * @param {string} userInputPhoneNumber - Phone number entered by user
   * @param {string} telegramVerifiedPhoneNumber - Phone number verified by Telegram
   * @returns {Promise<Object>} Security verification result
   */
  async verifySecureLinking(userId, userInputPhoneNumber, telegramVerifiedPhoneNumber) {
    try {
      // Perform secure number matching
      const matchingResult = secureNumberMatchingService.comparePhoneNumbers(
        userInputPhoneNumber,
        telegramVerifiedPhoneNumber
      );

      if (!matchingResult.match) {
        return {
          secure: false,
          message: 'عدم تطابق أرقام الهواتف - لا يمكن ربط الحساب بشكل آمن',
          reason: matchingResult.reason
        };
      }

      // Generate security report
      const securityReport = secureNumberMatchingService.generateSecurityReport(
        userInputPhoneNumber,
        telegramVerifiedPhoneNumber,
        false // not linked yet
      );

      return {
        secure: true,
        message: 'تم التحقق الآمن - يمكن ربط الحساب',
        matchingResult,
        securityReport,
        securityLevel: securityReport.securityLevel
      };

    } catch (error) {
      console.error('Error verifying secure linking:', error.message);
      return {
        secure: false,
        message: 'حدث خطأ أثناء التحقق الآمن',
        error: error.message
      };
    }
  }

  /**
   * Process complete secure linking workflow
   * @param {number} userId - User database ID
   * @param {string} userInputPhoneNumber - Phone number entered by user
   * @param {string} telegramChatId - Telegram chat ID
   * @param {string} telegramVerifiedPhoneNumber - Phone number verified by Telegram
   * @returns {Promise<Object>} Complete linking result
   */
  async processSecureLinking(userId, userInputPhoneNumber, telegramChatId, telegramVerifiedPhoneNumber) {
    try {
      console.log('Processing secure linking workflow:', {
        userId,
        userInputPhoneNumber,
        telegramChatId,
        telegramVerifiedPhoneNumber
      });

      // Step 1: Verify secure linking is possible
      const securityCheck = await this.verifySecureLinking(
        userId,
        userInputPhoneNumber,
        telegramVerifiedPhoneNumber
      );

      if (!securityCheck.secure) {
        return {
          success: false,
          message: securityCheck.message,
          reason: securityCheck.reason
        };
      }

      // Step 2: Link the account
      const linkingResult = await this.linkAccountWithTelegram(
        userId,
        telegramChatId,
        telegramVerifiedPhoneNumber
      );

      if (!linkingResult.success) {
        return linkingResult;
      }

      // Step 3: Return complete success result
      return {
        success: true,
        message: 'تم ربط الحساب بنجاح وآمن',
        securityLevel: securityCheck.securityLevel,
        user: linkingResult.user,
        matchingDetails: securityCheck.matchingResult
      };

    } catch (error) {
      console.error('Error in secure linking process:', error.message);
      return {
        success: false,
        message: 'حدث خطأ أثناء عملية الربط الآمن',
        error: error.message
      };
    }
  }
}

module.exports = new AccountLinkingService();
