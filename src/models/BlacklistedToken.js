const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class BlacklistedToken extends Model {}

BlacklistedToken.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  token: {
    type: DataTypes.STRING(500),
    allowNull: false,
    unique: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'expires_at' // Map to the actual database column name
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at' // Map to the actual database column name
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at' // Map to the actual database column name
  }
}, {
  sequelize,
  modelName: 'BlacklistedToken',
  tableName: 'blacklisted_tokens',
  timestamps: true,
  updatedAt: 'updatedAt' // Explicitly specify the updatedAt field
});

module.exports = BlacklistedToken;