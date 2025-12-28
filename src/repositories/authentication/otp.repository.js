/**
 * OTP Repository for Data Access
 * 
 * This repository provides a centralized data access layer for all OTP-related operations.
 * It abstracts database interactions for OTPs, providing a consistent interface
 * for the OTP service.
 */

const { Otp } = require('../../models/index');
const { Op } = require('sequelize');

class OtpRepository {
  // Store OTP for user or admin
  async storeOTP(user_id, admin_id, otp_code) {
    try {
      // Delete any existing OTPs for this user/admin
      await Otp.destroy({
        where: {
          user_id: user_id,
          admin_id: admin_id
        }
      });
      
      // Create new OTP record
      const otp = await Otp.create({
        user_id: user_id,
        admin_id: admin_id,
        otp_code: otp_code,
        expires_at: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now
      });
      
      return otp;
    } catch (error) {
      throw new Error('Failed to store OTP: ' + error.message);
    }
  }

  // Validate OTP for user or admin
  async validateOTP(user_id, admin_id, otp_code) {
    try {
      const otp = await Otp.findOne({
        where: {
          user_id: user_id,
          admin_id: admin_id,
          otp_code: otp_code
        }
      });
      
      // Check if OTP exists and hasn't expired
      if (!otp) {
        return false;
      }
      
      if (otp.expires_at < new Date()) {
        // OTP has expired, delete it
        await otp.destroy();
        return false;
      }
      
      // Valid OTP, delete it
      await otp.destroy();
      return true;
    } catch (error) {
      throw new Error('Failed to validate OTP: ' + error.message);
    }
  }

  // Get OTP by user or admin ID
  async getOTPByUserId(user_id, admin_id) {
    try {
      const otp = await Otp.findOne({
        where: {
          user_id: user_id,
          admin_id: admin_id
        }
      });
      
      return otp;
    } catch (error) {
      throw new Error('Failed to get OTP: ' + error.message);
    }
  }

  // Delete OTP by user or admin ID
  async deleteOTPByUserId(user_id, admin_id) {
    try {
      await Otp.destroy({
        where: {
          user_id: user_id,
          admin_id: admin_id
        }
      });
      
      return true;
    } catch (error) {
      throw new Error('Failed to delete OTP: ' + error.message);
    }
  }

  // Clean up expired OTPs
  async cleanupExpiredOTPs() {
    try {
      const deletedCount = await Otp.destroy({
        where: {
          expires_at: {
            [Op.lt]: new Date()
          }
        }
      });
      
      return deletedCount;
    } catch (error) {
      throw new Error('Failed to clean up expired OTPs: ' + error.message);
    }
  }
}

module.exports = new OtpRepository();