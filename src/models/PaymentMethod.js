const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PaymentMethod = sequelize.define('PaymentMethod', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'name'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'description'
  },
  account_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'account_number'
  },
  account_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'account_name'
  },
  bank_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'bank_name'
  },
  default_fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'default_fee'
  },
  qr_code: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'qr_code' // Image filename for QR code
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'payment_methods',
  timestamps: false
});

module.exports = PaymentMethod;
