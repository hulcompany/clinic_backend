const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BeforeAfter = sequelize.define('BeforeAfter', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id'
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'title'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'description'
  },
  before_image: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'before_image'
  },
  after_image: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'after_image'
  },
  service_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'service_id'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'user_id'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'sort_order'
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
  tableName: 'before_after',
  timestamps: true,
  underscored: true
});

module.exports = BeforeAfter;
