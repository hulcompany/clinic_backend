/**
 * Refresh Token Repository for Data Access
 * 
 * This repository provides a centralized data access layer for all refresh token-related operations.
 * It abstracts database interactions for refresh tokens, providing a consistent interface
 * for the token service.
 */

const { RefreshToken } = require('../../models/index');
const { Op } = require('sequelize');

class RefreshTokenRepository {
  // Store refresh token
  async storeRefreshToken(token, userIdParam, adminIdParam, expiresAtParam) {
    try {
      // Log parameters for debugging
      console.log('Creating refresh token with data:', {
        token,
        userId: userIdParam,
        adminId: adminIdParam,
        expiresAt: expiresAtParam
      });
      
      // Validate that exactly one of userId or adminId is provided (satisfies database constraint)
      if ((userIdParam === null && adminIdParam === null) || 
          (userIdParam !== null && adminIdParam !== null)) {
        throw new Error('Exactly one of userId or adminId must be provided');
      }
      
      // Create the record using model attributes, ensuring both fields are explicitly set
      // This ensures the database constraint is satisfied
      const attributes = {
        token,
        expiresAt: expiresAtParam
      };
      
      // Only set the appropriate ID field to avoid constraint violation
      if (userIdParam !== null) {
        attributes.userId = userIdParam;
        attributes.adminId = null;
      } else {
        attributes.adminId = adminIdParam;
        attributes.userId = null;
      }
      
      const refreshToken = await RefreshToken.create(attributes);
      
      return refreshToken;
    } catch (error) {
      console.error('Error creating refresh token:', error);
      throw new Error('Failed to store refresh token: ' + error.message);
    }
  }

  // Get refresh token by token value
  async getRefreshTokenByToken(token) {
    try {
      const refreshToken = await RefreshToken.findOne({
        where: { token }
      });
      
      return refreshToken;
    } catch (error) {
      throw new Error('Failed to get refresh token: ' + error.message);
    }
  }

  // Get refresh tokens by user ID
  async getRefreshTokensByUserId(userIdParam, adminIdParam) {
    try {
      // Validate that exactly one of userId or adminId is provided
      if ((userIdParam === null && adminIdParam === null) || 
          (userIdParam !== null && adminIdParam !== null)) {
        throw new Error('Exactly one of userId or adminId must be provided');
      }
      
      const refreshTokens = await RefreshToken.findAll({
        where: {
          userId: userIdParam,
          adminId: adminIdParam
        }
      });
      
      return refreshTokens;
    } catch (error) {
      throw new Error('Failed to get refresh tokens: ' + error.message);
    }
  }

  // Delete refresh token by token value
  async deleteRefreshTokenByToken(token) {
    try {
      await RefreshToken.destroy({
        where: { token }
      });
      
      return true;
    } catch (error) {
      throw new Error('Failed to delete refresh token: ' + error.message);
    }
  }

  // Delete refresh tokens by user ID
  async deleteRefreshTokensByUserId(userIdParam, adminIdParam) {
    try {
      // Validate that exactly one of userId or adminId is provided
      if ((userIdParam === null && adminIdParam === null) || 
          (userIdParam !== null && adminIdParam !== null)) {
        throw new Error('Exactly one of userId or adminId must be provided');
      }
      
      await RefreshToken.destroy({
        where: {
          userId: userIdParam,
          adminId: adminIdParam
        }
      });
      
      return true;
    } catch (error) {
      throw new Error('Failed to delete refresh tokens: ' + error.message);
    }
  }

  // Clean up expired refresh tokens
  async cleanupExpiredTokens() {
    try {
      const deletedCount = await RefreshToken.destroy({
        where: {
          expiresAt: {
            [Op.lt]: new Date()
          }
        }
      });
      
      return deletedCount;
    } catch (error) {
      throw new Error('Failed to clean up expired refresh tokens: ' + error.message);
    }
  }
}

module.exports = new RefreshTokenRepository();
