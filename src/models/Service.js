const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Service = sequelize.define('Service', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id'
  },
  name: {
    type: DataTypes.JSON,
    allowNull: false,
    field: 'name'
  },
  description: {
    type: DataTypes.JSON,
    allowNull: false,
    field: 'description'
  },
  image: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'image'
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
  tableName: 'services',
  timestamps: true,
  underscored: true
});

module.exports = Service;