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

      // Validate input: require at least one of userId or adminId
      if (userIdParam == null && adminIdParam == null) {
        throw new Error('Either userIdParam or adminIdParam must be provided when creating a refresh token.');
      }

      // Build the data object, include only provided ID fields
      const data = {
        token,
        expiresAt: expiresAtParam
      };

      // Use loose null check so undefined and null are both treated as "not provided"
      if (userIdParam != null) {
        data.userId = userIdParam;
      }
      if (adminIdParam != null) {
        data.adminId = adminIdParam;
      }

      const refreshToken = await RefreshToken.create(data);

      return refreshToken;
    } catch (error) {
      console.error('Error creating refresh token:', error);

      // Detect common MySQL "Field 'user_id' doesn't have a default value" and give a more actionable message
      if (error.message && error.message.includes("Field 'user_id' doesn't have a default value")) {
        throw new Error(
          "Failed to store refresh token: database requires 'user_id' to have a value. " +
          "Provide userIdParam when creating tokens, or update the DB schema to allow a NULL user_id (or provide a default)."
        );
      }

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

  // Get refresh tokens by user ID (or admin ID). Accepts either param; builds where clause from provided values.
  async getRefreshTokensByUserId(userIdParam, adminIdParam) {
    try {
      const where = {};
      if (userIdParam != null) where.userId = userIdParam;
      if (adminIdParam != null) where.adminId = adminIdParam;

      if (Object.keys(where).length === 0) {
        throw new Error('Either userIdParam or adminIdParam must be provided to query refresh tokens.');
      }

      const refreshTokens = await RefreshToken.findAll({ where });

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

  // Delete refresh tokens by user ID (or admin ID). Accepts either param; builds where clause from provided values.
  async deleteRefreshTokensByUserId(userIdParam, adminIdParam) {
    try {
      const where = {};
      if (userIdParam != null) where.userId = userIdParam;
      if (adminIdParam != null) where.adminId = adminIdParam;

      if (Object.keys(where).length === 0) {
        throw new Error('Either userIdParam or adminIdParam must be provided to delete refresh tokens.');
      }

      await RefreshToken.destroy({ where });

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
