/**
 * Blacklisted Token Repository for Data Access
 * 
 * This repository provides a centralized data access layer for all blacklisted token-related operations.
 * It abstracts database interactions for blacklisted tokens, providing a consistent interface
 * for the token service.
 */

const { BlacklistedToken } = require('../../models/index');
const { Op } = require('sequelize');

class BlacklistedTokenRepository {
  // Add token to blacklist
  async blacklistToken(token, expiresAtParam) {
    try {
      const blacklistedToken = await BlacklistedToken.create({
        token,
        expiresAt: expiresAtParam
      });
      
      return blacklistedToken;
    } catch (error) {
      throw new Error('Failed to blacklist token: ' + error.message);
    }
  }

  // Check if token is blacklisted
  async isTokenBlacklisted(token) {
    try {
      const blacklistedToken = await BlacklistedToken.findOne({
        where: { token }
      });
      
      return !!blacklistedToken;
    } catch (error) {
      throw new Error('Failed to check if token is blacklisted: ' + error.message);
    }
  }

  // Get blacklisted token by token value
  async getBlacklistedTokenByToken(token) {
    try {
      const blacklistedToken = await BlacklistedToken.findOne({
        where: { token }
      });
      
      return blacklistedToken;
    } catch (error) {
      throw new Error('Failed to get blacklisted token: ' + error.message);
    }
  }

  // Clean up expired blacklisted tokens
  async cleanupExpiredTokens() {
    try {
      const deletedCount = await BlacklistedToken.destroy({
        where: {
          expiresAt: {
            [Op.lt]: new Date()
          }
        }
      });
      
      return deletedCount;
    } catch (error) {
      throw new Error('Failed to clean up expired blacklisted tokens: ' + error.message);
    }
  }
}

module.exports = new BlacklistedTokenRepository();