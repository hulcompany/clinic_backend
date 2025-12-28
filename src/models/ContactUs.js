const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ContactUs = sequelize.define('ContactUs', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id'
  },
  phone_numbers: {
    type: DataTypes.JSON,
    allowNull: false,
    field: 'phone_numbers'
  },
  social_media: {
    type: DataTypes.JSON,
    allowNull: false,
    field: 'social_media'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      isEmail: true
    },
    field: 'email'
  },
  address: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'address'
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
  tableName: 'contact_us',
  timestamps: true,
  underscored: true
});

module.exports = ContactUs;