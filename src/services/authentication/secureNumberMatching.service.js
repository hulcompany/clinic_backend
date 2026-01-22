/**
 * Secure Number Matching Service
 * Compares user-entered phone number with Telegram-verified phone number
 */

class SecureNumberMatchingService {
  /**
   * Normalize phone number format for comparison
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
   * Compare two phone numbers securely
   * @param {string} userInputNumber - Number entered by user
   * @param {string} telegramVerifiedNumber - Number verified by Telegram
   * @returns {Object} Comparison result
   */
  comparePhoneNumbers(userInputNumber, telegramVerifiedNumber) {
    try {
      const normalizedUserInput = this.normalizePhoneNumber(userInputNumber);
      const normalizedTelegram = this.normalizePhoneNumber(telegramVerifiedNumber);
      
      console.log('Comparing phone numbers:', {
        userInput: userInputNumber,
        telegram: telegramVerifiedNumber,
        normalizedUserInput,
        normalizedTelegram
      });
      
      // Check if both numbers are valid
      if (!normalizedUserInput || !normalizedTelegram) {
        return {
          match: false,
          reason: 'Invalid phone number format',
          normalizedUserInput,
          normalizedTelegram
        };
      }
      
      // Direct comparison
      const isExactMatch = normalizedUserInput === normalizedTelegram;
      
      // Partial matching for common variations (last 7 digits)
      const userLast7 = normalizedUserInput.slice(-7);
      const telegramLast7 = normalizedTelegram.slice(-7);
      const isPartialMatch = userLast7 === telegramLast7;
      
      return {
        match: isExactMatch || isPartialMatch,
        exactMatch: isExactMatch,
        partialMatch: isPartialMatch,
        reason: isExactMatch ? 'Exact match' : 
               isPartialMatch ? 'Partial match (last 7 digits)' : 
               'No match',
        normalizedUserInput,
        normalizedTelegram
      };
      
    } catch (error) {
      console.error('Error comparing phone numbers:', error.message);
      return {
        match: false,
        reason: 'Comparison error',
        error: error.message
      };
    }
  }

  /**
   * Validate phone number format
   * @param {string} phoneNumber - Phone number to validate
   * @returns {Object} Validation result
   */
  validatePhoneNumber(phoneNumber) {
    if (!phoneNumber) {
      return {
        valid: false,
        reason: 'Phone number is required'
      };
    }
    
    // Remove spaces and special characters for validation
    const cleanNumber = phoneNumber.replace(/\s+/g, '');
    
    // Check for valid Syrian mobile number patterns
    const syrianPatterns = [
      /^(\+963|00963|963)?(9[2-9]\d{7})$/, // +9639xxxxxxxx or 9xxxxxxxx
      /^(0)?(9[2-9]\d{7})$/ // 09xxxxxxxx
    ];
    
    const isValidSyrian = syrianPatterns.some(pattern => pattern.test(cleanNumber));
    
    // Check for international format
    const internationalPattern = /^\+[1-9]\d{1,14}$/;
    const isValidInternational = internationalPattern.test(cleanNumber);
    
    const isValid = isValidSyrian || isValidInternational;
    
    return {
      valid: isValid,
      format: isValidSyrian ? 'syrian' : 
             isValidInternational ? 'international' : 
             'invalid',
      cleanNumber: cleanNumber,
      reason: isValid ? 'Valid phone number' : 'Invalid phone number format'
    };
  }

  /**
   * Generate security report for phone number verification
   * @param {string} userInputNumber - User input number
   * @param {string} telegramNumber - Telegram verified number
   * @param {boolean} isLinked - Whether numbers are already linked
   * @returns {Object} Security report
   */
  generateSecurityReport(userInputNumber, telegramNumber, isLinked) {
    const comparison = this.comparePhoneNumbers(userInputNumber, telegramNumber);
    const userInputValidation = this.validatePhoneNumber(userInputNumber);
    const telegramValidation = this.validatePhoneNumber(telegramNumber);
    
    const securityLevel = isLinked ? 'high' :
                         comparison.match ? 'medium' :
                         'low';
    
    return {
      securityLevel,
      userInput: {
        original: userInputNumber,
        normalized: comparison.normalizedUserInput,
        valid: userInputValidation.valid,
        format: userInputValidation.format
      },
      telegram: {
        original: telegramNumber,
        normalized: comparison.normalizedTelegram,
        valid: telegramValidation.valid,
        format: telegramValidation.format
      },
      comparison: {
        match: comparison.match,
        exactMatch: comparison.exactMatch,
        partialMatch: comparison.partialMatch,
        reason: comparison.reason
      },
      alreadyLinked: isLinked,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new SecureNumberMatchingService();
