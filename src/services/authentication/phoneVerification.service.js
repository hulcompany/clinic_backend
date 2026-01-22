const crypto = require('crypto');

/**
 * Phone Verification Service
 * Handles secure phone number verification using Telegram
 */

class PhoneVerificationService {
  constructor() {
    this.verificationTokens = new Map(); // Store tokens in memory (use Redis in production)
    this.TOKEN_EXPIRY = parseInt(process.env.PHONE_VERIFICATION_EXPIRY) || 300; // 5 minutes
  }

  /**
   * Generate a unique verification token for phone number
   * @param {string} phoneNumber - Phone number to verify
   * @returns {string} 8-character verification token
   */
  generateVerificationToken(phoneNumber) {
    // Create unique token combining phone, timestamp, and random bytes
    const timestamp = Date.now().toString();
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const hashInput = `${phoneNumber}${timestamp}${randomBytes}`;
    
    const token = crypto
      .createHash('sha256')
      .update(hashInput)
      .digest('hex')
      .substring(0, 8)
      .toUpperCase();
    
    // Store token with expiration
    const expiryTime = Date.now() + (this.TOKEN_EXPIRY * 1000);
    this.verificationTokens.set(token, {
      phoneNumber,
      expiryTime,
      createdAt: Date.now()
    });
    
    console.log(`Generated verification token: ${token} for phone: ${phoneNumber}`);
    
    return token;
  }

  /**
   * Validate verification token
   * @param {string} token - Verification token
   * @param {string} phoneNumber - Phone number to validate against
   * @returns {Object} Validation result
   */
  validateVerificationToken(token, phoneNumber) {
    try {
      const tokenData = this.verificationTokens.get(token);
      
      if (!tokenData) {
        return {
          isValid: false,
          message: 'رمز التحقق غير صحيح أو منتهي الصلاحية'
        };
      }
      
      // Check expiration
      if (Date.now() > tokenData.expiryTime) {
        this.removeVerificationToken(token);
        return {
          isValid: false,
          message: 'رمز التحقق منتهي الصلاحية'
        };
      }
      
      // Check phone number match
      if (tokenData.phoneNumber !== phoneNumber) {
        return {
          isValid: false,
          message: 'رقم الهاتف غير متطابق'
        };
      }
      
      return {
        isValid: true,
        message: 'رمز التحقق صحيح',
        phoneNumber: tokenData.phoneNumber
      };
      
    } catch (error) {
      console.error('Error validating verification token:', error.message);
      return {
        isValid: false,
        message: 'خطأ في التحقق من الرمز'
      };
    }
  }

  /**
   * Remove used verification token
   * @param {string} token - Token to remove
   */
  removeVerificationToken(token) {
    this.verificationTokens.delete(token);
    console.log(`Removed verification token: ${token}`);
  }

  /**
   * Clean up expired tokens
   */
  cleanupExpiredTokens() {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [token, data] of this.verificationTokens.entries()) {
      if (now > data.expiryTime) {
        this.verificationTokens.delete(token);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired verification tokens`);
    }
  }

  /**
   * Get token information (for debugging)
   * @param {string} token - Token to lookup
   * @returns {Object|null} Token information or null
   */
  getTokenInfo(token) {
    const tokenData = this.verificationTokens.get(token);
    if (!tokenData) return null;
    
    return {
      phoneNumber: tokenData.phoneNumber,
      expiresAt: new Date(tokenData.expiryTime).toISOString(),
      isExpired: Date.now() > tokenData.expiryTime
    };
  }

  /**
   * Verify phone number matches Telegram registered number
   * @param {string} userInputPhone - Phone number entered by user
   * @param {string} telegramVerifiedPhone - Phone number from Telegram API
   * @returns {Object} Verification result
   */
  verifyPhoneMatchesTelegram(userInputPhone, telegramVerifiedPhone) {
    try {
      // Normalize both phone numbers for comparison
      const normalizedUserPhone = this.normalizePhoneNumber(userInputPhone);
      const normalizedTelegramPhone = this.normalizePhoneNumber(telegramVerifiedPhone);
      
      console.log('Phone verification comparison:', {
        userInput: userInputPhone,
        telegram: telegramVerifiedPhone,
        normalizedUser: normalizedUserPhone,
        normalizedTelegram: normalizedTelegramPhone
      });
      
      // Check if both numbers are valid
      if (!normalizedUserPhone || !normalizedTelegramPhone) {
        return {
          matches: false,
          reason: 'Invalid phone number format',
          normalizedUserPhone,
          normalizedTelegramPhone
        };
      }
      
      // Exact match check
      const exactMatch = normalizedUserPhone === normalizedTelegramPhone;
      
      // Partial match check (last 7 digits)
      const userLast7 = normalizedUserPhone.slice(-7);
      const telegramLast7 = normalizedTelegramPhone.slice(-7);
      const partialMatch = userLast7 === telegramLast7;
      
      return {
        matches: exactMatch || partialMatch,
        exactMatch,
        partialMatch,
        reason: exactMatch ? 'Exact match' : 
               partialMatch ? 'Partial match (last 7 digits)' : 
               'No match',
        normalizedUserPhone,
        normalizedTelegramPhone
      };
      
    } catch (error) {
      console.error('Error verifying phone match:', error.message);
      return {
        matches: false,
        reason: 'Verification error',
        error: error.message
      };
    }
  }

  /**
   * Normalize phone number format
   * @param {string} phoneNumber - Phone number to normalize
   * @returns {string} Normalized phone number
   */
  normalizePhoneNumber(phoneNumber) {
    if (!phoneNumber) return '';
    
    // Remove all non-digit characters except +
    let normalized = phoneNumber.replace(/[^\d+]/g, '');
    
    // Ensure international format (+country code)
    if (!normalized.startsWith('+')) {
      // Assume Syrian numbers start with 09 and convert to +963
      if (normalized.startsWith('09')) {
        normalized = '+963' + normalized.substring(2);
      } else if (normalized.startsWith('9')) {
        normalized = '+963' + normalized.substring(1);
      }
    }
    
    return normalized;
  }

  /**
   * Link phone number to Telegram chat ID
   * @param {string} phoneNumber - Phone number
   * @param {string} telegramChatId - Telegram chat ID
   * @returns {boolean} Success status
   */
  linkPhoneNumberToTelegram(phoneNumber, telegramChatId) {
    try {
      // In a real implementation, this would update the database
      // For now, we'll just log the linking
      console.log(`Linking phone ${phoneNumber} to Telegram chat ${telegramChatId}`);
      return true;
    } catch (error) {
      console.error('Error linking phone to Telegram:', error.message);
      return false;
    }
  }

  /**
   * Store verification token for a phone number
   * @param {string} phoneNumber - Phone number
   * @param {string} token - Verification token
   * @returns {boolean} Success status
   */
  storeVerificationToken(phoneNumber, token) {
    try {
      const expiryTime = Date.now() + (this.TOKEN_EXPIRY * 1000);
      this.verificationTokens.set(token, {
        phoneNumber,
        expiryTime,
        createdAt: Date.now()
      });
      
      console.log(`Stored verification token: ${token} for phone: ${phoneNumber}`);
      return true;
    } catch (error) {
      console.error('Error storing verification token:', error.message);
      return false;
    }
  }

  /**
   * Check if phone number is already linked to a Telegram account
   * @param {string} phoneNumber - Phone number to check
   * @returns {boolean} Whether phone number is linked
   */
  isPhoneNumberLinked(phoneNumber) {
    // In a real implementation, this would check the database
    // For now, we'll return false to allow new verifications
    console.log(`Checking if phone ${phoneNumber} is linked`);
    return false;
  }

  /**
   * Get total active tokens count
   * @returns {number} Active tokens count
   */
  getActiveTokensCount() {
    return this.verificationTokens.size;
  }
}

// Export singleton instance
module.exports = new PhoneVerificationService();
