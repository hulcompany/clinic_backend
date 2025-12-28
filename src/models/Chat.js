const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Chat = sequelize.define('Chat', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id'
  },
  consultation_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'consultation_id'
  },
  last_message_at: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_message_at'
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
  tableName: 'chats',
  timestamps: true,
  underscored: true
});

module.exports = Chat;