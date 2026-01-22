/**
 * Security and Error Handling Service
 * Handles failed verification attempts and security measures
 */

class SecurityErrorHandlingService {
  constructor() {
    this.failedAttempts = new Map(); // Track failed attempts by IP/user
    this.blockedUsers = new Set();   // Temporarily blocked users
    this.MAX_ATTEMPTS = 5;           // Max failed attempts before temporary block
    this.BLOCK_DURATION = 30 * 60 * 1000; // 30 minutes block duration
  }

  /**
   * Record failed verification attempt
   * @param {string} identifier - User ID, IP address, or phone number
   * @param {string} reason - Reason for failure
   * @param {Object} requestData - Request data for logging
   * @returns {Object} Attempt recording result
   */
  recordFailedAttempt(identifier, reason, requestData = {}) {
    try {
      const now = Date.now();
      const attemptData = {
        timestamp: now,
        reason,
        requestData,
        attemptNumber: 1
      };

      if (this.failedAttempts.has(identifier)) {
        const existingAttempts = this.failedAttempts.get(identifier);
        const recentAttempts = existingAttempts.filter(
          attempt => now - attempt.timestamp < this.BLOCK_DURATION
        );
        
        attemptData.attemptNumber = recentAttempts.length + 1;
        recentAttempts.push(attemptData);
        this.failedAttempts.set(identifier, recentAttempts);
      } else {
        this.failedAttempts.set(identifier, [attemptData]);
      }

      console.log(`Failed verification attempt recorded for ${identifier}:`, {
        reason,
        attemptNumber: attemptData.attemptNumber,
        totalRecentAttempts: this.failedAttempts.get(identifier).length
      });

      // Check if user should be temporarily blocked
      const shouldBlock = this.shouldBlockUser(identifier);
      
      if (shouldBlock) {
        this.blockUser(identifier);
        return {
          blocked: true,
          message: 'تم حظر المحاولة مؤقتاً بسبب محاولات فاشلة متكررة',
          blockDuration: this.BLOCK_DURATION
        };
      }

      return {
        blocked: false,
        attemptNumber: attemptData.attemptNumber,
        remainingAttempts: this.MAX_ATTEMPTS - attemptData.attemptNumber,
        message: `محاولة فاشلة #${attemptData.attemptNumber}`
      };

    } catch (error) {
      console.error('Error recording failed attempt:', error.message);
      return {
        blocked: false,
        error: 'Error recording attempt'
      };
    }
  }

  /**
   * Check if user should be blocked based on failed attempts
   * @param {string} identifier - User identifier
   * @returns {boolean} Whether user should be blocked
   */
  shouldBlockUser(identifier) {
    const attempts = this.failedAttempts.get(identifier) || [];
    const recentAttempts = attempts.filter(
      attempt => Date.now() - attempt.timestamp < this.BLOCK_DURATION
    );
    
    return recentAttempts.length >= this.MAX_ATTEMPTS;
  }

  /**
   * Temporarily block a user
   * @param {string} identifier - User identifier
   */
  blockUser(identifier) {
    this.blockedUsers.add(identifier);
    console.log(`User ${identifier} temporarily blocked`);
    
    // Automatically unblock after block duration
    setTimeout(() => {
      this.unblockUser(identifier);
    }, this.BLOCK_DURATION);
  }

  /**
   * Unblock a user
   * @param {string} identifier - User identifier
   */
  unblockUser(identifier) {
    this.blockedUsers.delete(identifier);
    console.log(`User ${identifier} unblocked`);
  }

  /**
   * Check if user is blocked
   * @param {string} identifier - User identifier
   * @returns {boolean} Whether user is blocked
   */
  isUserBlocked(identifier) {
    return this.blockedUsers.has(identifier);
  }

  /**
   * Clear failed attempts for a user
   * @param {string} identifier - User identifier
   */
  clearFailedAttempts(identifier) {
    this.failedAttempts.delete(identifier);
    console.log(`Cleared failed attempts for ${identifier}`);
  }

  /**
   * Get security statistics
   * @returns {Object} Security statistics
   */
  getSecurityStats() {
    return {
      totalFailedAttempts: Array.from(this.failedAttempts.values())
        .reduce((sum, attempts) => sum + attempts.length, 0),
      currentlyBlocked: this.blockedUsers.size,
      activeTracking: this.failedAttempts.size
    };
  }

  /**
   * Log security event
   * @param {string} eventType - Type of security event
   * @param {Object} eventData - Event data
   */
  logSecurityEvent(eventType, eventData) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      ...eventData
    };
    
    console.log('SECURITY EVENT:', logEntry);
    
    // In production, you might want to:
    // - Send to security monitoring system
    // - Store in separate security logs
    // - Alert security team for critical events
  }

  /**
   * Validate request security
   * @param {Object} req - Express request object
   * @returns {Object} Validation result
   */
  validateRequestSecurity(req) {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'Unknown';
    const userId = req.user?.user_id || 'anonymous';

    // Check if IP is blocked
    if (this.isUserBlocked(ip)) {
      this.logSecurityEvent('BLOCKED_REQUEST', {
        ip,
        userId,
        reason: 'IP temporarily blocked due to failed attempts'
      });
      
      return {
        valid: false,
        reason: 'IP address temporarily blocked',
        blocked: true
      };
    }

    // Check if user is blocked
    if (userId !== 'anonymous' && this.isUserBlocked(userId)) {
      this.logSecurityEvent('BLOCKED_REQUEST', {
        ip,
        userId,
        reason: 'User temporarily blocked due to failed attempts'
      });
      
      return {
        valid: false,
        reason: 'User temporarily blocked',
        blocked: true
      };
    }

    // Rate limiting check (simple implementation)
    const now = Date.now();
    const windowSize = 60000; // 1 minute window
    const maxRequests = 10;   // Max 10 requests per minute
    
    // This is a simplified rate limiting - in production use redis or similar
    const requestKey = `${ip}:${Math.floor(now / windowSize)}`;
    
    // Basic rate limiting logic would go here
    // For now, we'll allow the request
    return {
      valid: true,
      ip,
      userId,
      userAgent
    };
  }

  /**
   * Handle verification abuse detection
   * @param {string} phone - Phone number being verified
   * @param {string} ip - IP address
   * @param {Object} userData - User data
   * @returns {Object} Abuse detection result
   */
  detectVerificationAbuse(phone, ip, userData = {}) {
    const now = Date.now();
    const abuseIndicators = [];

    // Check phone number abuse
    const phoneAttempts = this.failedAttempts.get(phone) || [];
    const recentPhoneAttempts = phoneAttempts.filter(
      attempt => now - attempt.timestamp < 3600000 // 1 hour
    );
    
    if (recentPhoneAttempts.length > 3) {
      abuseIndicators.push('Multiple failed attempts for same phone number');
    }

    // Check IP abuse
    const ipAttempts = this.failedAttempts.get(ip) || [];
    const recentIpAttempts = ipAttempts.filter(
      attempt => now - attempt.timestamp < 3600000 // 1 hour
    );
    
    if (recentIpAttempts.length > 5) {
      abuseIndicators.push('Multiple failed attempts from same IP');
    }

    // Check pattern abuse (same user trying different phones)
    if (userData.userId) {
      const userAttempts = this.failedAttempts.get(userData.userId) || [];
      const recentUserAttempts = userAttempts.filter(
        attempt => now - attempt.timestamp < 3600000 // 1 hour
      );
      
      if (recentUserAttempts.length > 3) {
        abuseIndicators.push('Multiple phone verification attempts by same user');
      }
    }

    const isAbusive = abuseIndicators.length > 0;
    
    if (isAbusive) {
      this.logSecurityEvent('VERIFICATION_ABUSE_DETECTED', {
        phone,
        ip,
        userId: userData.userId,
        indicators: abuseIndicators
      });
    }

    return {
      abusive: isAbusive,
      indicators: abuseIndicators,
      riskLevel: abuseIndicators.length > 2 ? 'high' : 
                abuseIndicators.length > 0 ? 'medium' : 'low'
    };
  }

  /**
   * Cleanup old records
   */
  cleanupOldRecords() {
    const now = Date.now();
    const cleanupThreshold = 24 * 60 * 60 * 1000; // 24 hours

    // Clean up old failed attempts
    for (const [identifier, attempts] of this.failedAttempts.entries()) {
      const recentAttempts = attempts.filter(
        attempt => now - attempt.timestamp < cleanupThreshold
      );
      
      if (recentAttempts.length === 0) {
        this.failedAttempts.delete(identifier);
      } else {
        this.failedAttempts.set(identifier, recentAttempts);
      }
    }

    console.log('Security records cleaned up');
  }
}

// Export singleton instance
module.exports = new SecurityErrorHandlingService();
