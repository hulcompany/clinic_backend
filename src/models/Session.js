const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Session = sequelize.define('Session', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id'
  },
  admin_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'admin_id'
  },
  link: {
    type: DataTypes.STRING(500),
    allowNull: false,
    field: 'link'
  },
  link_type: {
    type: DataTypes.ENUM('google_meet', 'whatsapp', 'zoom', 'teams', 'other'),
    allowNull: false,
    field: 'link_type'
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
  tableName: 'sessions',
  timestamps: true,
  underscored: true
});

module.exports = Session;