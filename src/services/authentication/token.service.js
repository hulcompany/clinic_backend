const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { generateToken, verifyToken } = require('../../config/jwt');
const { Op } = require('sequelize');
const refreshTokenRepository = require('../../repositories/authentication/refreshToken.repository');
const blacklistedTokenRepository = require('../../repositories/authentication/blacklistedToken.repository');
const userRepository = require('../../repositories/authentication/user.repository');
const adminRepository = require('../../repositories/authentication/admin.repository');

class TokenService {
    constructor() {
        this.accessTokenSecret = process.env.JWT_SECRET;
        this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
        this.accessTokenExpiry = process.env.JWT_EXPIRE || '15m';
        this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRE || '7d';
    }

    // Generate Access Token
    generateAccessToken(user, userType = 'user') {
        return generateToken(
            {
                id: user.user_id,
                email: user.email,
                role: user.role || userType
            }
        );
    }

    // Generate Refresh Token
    async generateRefreshToken(user, userType = 'user') {
        const refreshToken = generateToken(
            { 
                id: user.user_id,
                type: userType // 'user' or 'admin'
            }
        );
        
        // Save in DB
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
        
        // Delete any existing refresh tokens for this user/admin
        if (userType === 'user') {
            await this.deleteAllUserTokens(user.user_id, 'user');
        } else {
            await this.deleteAllUserTokens(user.user_id, 'admin');
        }
        
        const tokenData = {
            token: refreshToken,
            expires_at: expiresAt
        };
        
        if (userType === 'user') {
            tokenData.user_id = user.user_id;
        } else {
            tokenData.admin_id = user.user_id;
        }
        
        // Validate that we have the required user ID
        if (userType === 'user' && (!user || !user.user_id)) {
            throw new Error('User ID is required for user token generation');
        }
        
        if (userType === 'admin' && (!user || !user.user_id)) {
            throw new Error('Admin ID is required for admin token generation');
        }
        
        // Log parameters for debugging
        console.log('Storing refresh token with params:', {
            token: refreshToken,
            userId: userType === 'user' ? user.user_id : null,
            adminId: userType === 'admin' ? user.user_id : null,
            expiresAt: expiresAt,
            userType: userType,
            user: user ? { user_id: user.user_id, email: user.email } : null
        });
        
        // Store refresh token with appropriate user/admin ID
        const userIdValue = userType === 'user' ? user.user_id : null;
        const adminIdValue = userType === 'admin' ? user.user_id : null;
        
        await refreshTokenRepository.storeRefreshToken(
            refreshToken, 
            userIdValue, 
            adminIdValue, 
            expiresAt
        );
        
        return refreshToken;
    }

    // Generate Tokens
    async generateTokens(user, userType = 'user') {
        const accessToken = this.generateAccessToken(user, userType);
        const refreshToken = await this.generateRefreshToken(user, userType);
        
        return {
            accessToken,
            refreshToken,
            expiresIn: 15 * 60 // 15 minutes in seconds
        };
    }

    // Refresh Access Token using Refresh Token
    async refreshAccessToken(refreshToken) {
        try {
            // Verify Refresh Token
            const payload = verifyToken(refreshToken);
            
            // Check if it's in DB
            const storedToken = await refreshTokenRepository.getRefreshTokenByToken(refreshToken);
            
            if (!storedToken) throw new Error('Invalid refresh token');
            
            // Check if expired
            if (storedToken.expires_at < new Date()) {
                throw new Error('Refresh token has expired');
            }
            
            if (payload.type === 'user') {
                const user = await userRepository.getUserById(payload.id);
                if (!user) throw new Error('User not found');
                
                // Create new Access Token
                return this.generateAccessToken(user, 'user');
            } else {
                const admin = await adminRepository.getAdminById(payload.id);
                if (!admin) throw new Error('Admin not found');
                
                // Create new Access Token
                return this.generateAccessToken(admin, 'admin');
            }
            
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw error; // Re-throw token expiration errors
            }
            throw new Error('Invalid refresh token');
        }
    }

    // Verify Token
    verifyToken(token, isRefresh = false) {
        try {
            return verifyToken(token);
        } catch (error) {
            // Log the specific error for debugging
            console.error('Token verification failed:', error.name, error.message);
            // Re-throw token expiration and invalid token errors
            if (error.name === 'TokenExpiredError') {
                throw error;
            }
            if (error.name === 'JsonWebTokenError') {
                throw error;
            }
            throw new Error('Invalid token: ' + error.message);
        }
    }

    // Blacklist token (for logout)
    async blacklistToken(token, expiresAt) {
        try {
            const result = await blacklistedTokenRepository.blacklistToken(token, expiresAt);
            return result;
        } catch (error) {
            console.error('Error blacklisting token:', error.name, error.message);
            throw new Error('Failed to blacklist token: ' + error.message);
        }
    }

    // Delete Refresh Token
    async deleteRefreshToken(token) {
        try {
            const result = await refreshTokenRepository.deleteRefreshTokenByToken(token);
            return result;
        } catch (error) {
            console.error('Error deleting refresh token:', error.name, error.message);
            throw new Error('Failed to delete refresh token: ' + error.message);
        }
    }

    // Delete all Refresh Tokens for user/admin
    async deleteAllUserTokens(userId, userType = 'user') {
        try {
            if (userType === 'user') {
                await refreshTokenRepository.deleteRefreshTokensByUserId(userId, null);
            } else {
                await refreshTokenRepository.deleteRefreshTokensByUserId(null, userId);
            }
            return true;
        } catch (error) {
            console.error('Error deleting user tokens:', error);
            return false;
        }
    }
    
    // Clean up expired blacklisted tokens (safe cleanup that preserves recently blacklisted tokens)
    async cleanupExpiredBlacklistedTokens() {
        try {
            // Get current time
            const now = new Date();
            
            // Delete tokens that:
            // 1. Have expired (expiresAt < now)
            // 2. Were created more than 1 hour ago
            const oneHourAgo = new Date();
            oneHourAgo.setHours(oneHourAgo.getHours() - 1);
            
            const result = await blacklistedTokenRepository.cleanupExpiredTokens();
            
            console.log(`Cleaned up ${result} expired blacklisted tokens`);
            return result;
        } catch (error) {
            console.error('Error cleaning up expired blacklisted tokens:', error);
            throw new Error('Failed to cleanup expired blacklisted tokens: ' + error.message);
        }
    }
}

module.exports = new TokenService();