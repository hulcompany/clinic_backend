const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
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
  title: {
    type: DataTypes.JSON,
    allowNull: false,
    field: 'title'
  },
  message: {
    type: DataTypes.JSON,
    allowNull: false,
    field: 'message'
  },
  type: {
    type: DataTypes.ENUM(['appointment', 'message', 'system']),
    defaultValue: 'system',
    field: 'type'
  },
  related_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'related_id'
  },
  target_route: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'target_route'
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_read'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  tableName: 'notifications',
  timestamps: false,
  underscored: true
});

module.exports = Notification;