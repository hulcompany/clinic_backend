/**
 * OTP Model
 * 
 * This model represents one-time password codes used for user verification.
 * Each OTP is associated with a user and has an expiration time.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = () => sequelize.models.User;
const Admin = () => sequelize.models.Admin;
//تجنب التبعية الدائرية:   تمنع حدوث تضارب عند تحميل النماذج.

const Otp = sequelize.define('Otp', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User(),  
      key: 'user_id'
    }
  },
  admin_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Admin(),  
      key: 'user_id'
      }
  },
  user_type: {
    type: DataTypes.ENUM('user', 'admin'),
    allowNull: false,
    defaultValue: 'user'
  },
  otp_code: {
    type: DataTypes.STRING(6),
    allowNull: false
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'otp_codes',
  timestamps: false,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['admin_id']
    }
  ]
});

module.exports = Otp;