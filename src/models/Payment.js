const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  consultation_fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'consultation_fee'
  },
  payment_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'payment_amount'
  },
  payment_proof: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'payment_proof' // Image filename of payment proof
  },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'rejected'),
    defaultValue: 'pending',
    field: 'status'
  },
  verified_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'verified_by',
    references: {
      model: 'admins',
      key: 'user_id'
    }
  },
  verified_at: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'verified_at'
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'rejection_reason'
  },
  consultation_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'consultation_id',
    references: {
      model: 'consultations',
      key: 'id'
    }
  },
  payment_method_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'payment_method_id',
    references: {
      model: 'payment_methods',
      key: 'id'
    }
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
  tableName: 'payments',
  timestamps: false
});

module.exports = Payment;
