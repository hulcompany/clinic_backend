const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LandingImage = sequelize.define('LandingImage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id'
  },
  image: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'image'
  },
  section: {
    type: DataTypes.ENUM('hero', 'about', 'story'),
    allowNull: false,
    field: 'section'
  },
  display_order: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    field: 'display_order'
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
  tableName: 'landing_images',
  timestamps: false,
 
});

module.exports = LandingImage;