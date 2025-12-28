const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id'
  },
  rating: {
    type: DataTypes.TINYINT,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    },
    field: 'rating'
  },
  comment: {
    type: DataTypes.JSON,
    allowNull: false,
    field: 'comment'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'reviews',
  timestamps: true,
  underscored: true
});

module.exports = Review;