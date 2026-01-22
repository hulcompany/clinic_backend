const crypto = require('crypto');
const { Op } = require('sequelize');
const { User, Admin } = require('../../models');

/**
 * Phone Verification Service
 * Handles secure phone number verification using Telegram
 */

class PhoneVerificationService {
  /**
   * Generate a unique verification token
   * @param {string} phoneNumber - Phone number to verify
   * @returns {string} Unique verification token
   */
  generateVerificationToken(phoneNumber) {
    // Create a unique token combining phone number, timestamp, and random bytes
    const timestamp = Date.now().toString();
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const hashInput = `${phoneNumber}${timestamp}${randomBytes}`;
    
    // Generate SHA-256 hash and take first 8 characters for shorter token
    const token = crypto
      .createHash('sha256')
      .update(hashInput)
      .digest('hex')
      .substring(0, 8)
      .toUpperCase();
    
    return token;
  }

  /**
   * Store verification token with expiration
   * @param {string} phoneNumber - Phone number being verified
   * @param {string} token - Generated verification token
   * @param {number} expiresInMinutes - Token expiration time in minutes (default: 15)
   * @returns {Object} Verification record
   */
  async storeVerificationToken(phoneNumber, token, expiresInMinutes = 15) {
    try {
      // Calculate expiration time
      const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
      
      // Store in temporary verification table or cache
      // For now, we'll use a simple in-memory approach
      // In production, this should use Redis or database table
      
      const verificationRecord = {
        phoneNumber,
        token,
        expiresAt,
        createdAt: new Date(),
        attempts: 0
      };
      
      // Store in application memory (should be replaced with Redis in production)
      if (!global.phoneVerifications) {
        global.phoneVerifications = new Map();
      }
      
      global.phoneVerifications.set(token, verificationRecord);
      
      // Clean up expired tokens periodically
      this.cleanupExpiredTokens();
      
      return verificationRecord;
    } catch (error) {
      throw new Error(`Failed to store verification token: ${error.message}`);
    }
  }

  /**
   * Validate verification token
   * @param {string} token - Token to validate
   * @param {string} phoneNumber - Expected phone number
   * @returns {Object|null} Verification record if valid, null if invalid/expired
   */
  async validateVerificationToken(token, phoneNumber) {
    try {
      if (!global.phoneVerifications) {
        return null;
      }
      
      const record = global.phoneVerifications.get(token);
      
      // Check if token exists
      if (!record) {
        return null;
      }
      
      // Check if token is expired
      if (record.expiresAt < new Date()) {
        global.phoneVerifications.delete(token);
        return null;
      }
      
      // Check if phone number matches
      if (record.phoneNumber !== phoneNumber) {
        // Increment failed attempts
        record.attempts += 1;
        
        // Delete token after too many failed attempts
        if (record.attempts >= 3) {
          global.phoneVerifications.delete(token);
        }
        
        return null;
      }
      
      // Valid token - remove it (one-time use)
      global.phoneVerifications.delete(token);
      
      return {
        phoneNumber: record.phoneNumber,
        verifiedAt: new Date()
      };
    } catch (error) {
      throw new Error(`Failed to validate verification token: ${error.message}`);
    }
  }

  /**
   * Cleanup expired verification tokens
   */
  cleanupExpiredTokens() {
    if (!global.phoneVerifications) return;
    
    const now = new Date();
    for (const [token, record] of global.phoneVerifications.entries()) {
      if (record.expiresAt < now) {
        global.phoneVerifications.delete(token);
      }
    }
  }

  /**
   * Link verified phone number to Telegram chat ID
   * @param {string} phoneNumber - Verified phone number
   * @param {string} telegramChatId - Telegram chat ID
   * @param {string} userType - 'user' or 'admin'
   * @returns {Object} Updated user/admin record
   */
  async linkPhoneNumberToTelegram(phoneNumber, telegramChatId, userType = 'user') {
    try {
      let userRecord;
      
      if (userType === 'user') {
        userRecord = await User.findOne({ 
          where: { 
            phone: phoneNumber,
            telegram_chat_id: null // Only link if not already linked
          } 
        });
        
        if (userRecord) {
          await userRecord.update({ telegram_chat_id: telegramChatId });
        }
      } else if (userType === 'admin') {
        userRecord = await Admin.findOne({ 
          where: { 
            phone: phoneNumber,
            telegram_chat_id: null // Only link if not already linked
          } 
        });
        
        if (userRecord) {
          await userRecord.update({ telegram_chat_id: telegramChatId });
        }
      }
      
      if (!userRecord) {
        throw new Error(`No unlinked ${userType} found with phone number ${phoneNumber}`);
      }
      
      return userRecord;
    } catch (error) {
      throw new Error(`Failed to link phone number to Telegram: ${error.message}`);
    }
  }

  /**
   * Check if phone number is already linked to a Telegram account
   * @param {string} phoneNumber - Phone number to check
   * @param {string} userType - 'user' or 'admin'
   * @returns {boolean} True if already linked, false otherwise
   */
  async isPhoneNumberLinked(phoneNumber, userType = 'user') {
    try {
      let userRecord;
      
      if (userType === 'user') {
        userRecord = await User.findOne({ 
          where: { 
            phone: phoneNumber,
            telegram_chat_id: { [Op.not]: null }
          } 
        });
      } else {
        userRecord = await Admin.findOne({ 
          where: { 
            phone: phoneNumber,
            telegram_chat_id: { [Op.not]: null }
          } 
        });
      }
      
      return !!userRecord;
    } catch (error) {
      throw new Error(`Failed to check phone number link status: ${error.message}`);
    }
  }

  /**
   * Get verification instructions message for Telegram
   * @param {string} token - Verification token
   * @param {string} phoneNumber - Phone number being verified
   * @returns {string} Formatted instruction message
   */
  getVerificationInstructions(token, phoneNumber) {
    return `
📱 *Phone Number Verification*

Hello! You've requested to verify the phone number: \`${phoneNumber}\`

To complete verification, please send the following command to this bot:

\`/verify ${token}\`

⚠️ *Important Notes:*
• This token expires in 15 minutes
• You can only use this token once
• Make sure you're sending from the same phone number you're verifying

If you didn't request this verification, please ignore this message.
    `.trim();
  }
}

module.exports = new PhoneVerificationService();
