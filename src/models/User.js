const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'user_id'
  },
  full_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'full_name'
  },
  email: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: true,
    validate: {
      isEmail: true
    },
    field: 'email'
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'password'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'phone'
  },
  role: {
    type: DataTypes.STRING(50),
    defaultValue: 'user',
    field: 'role'
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'User profile image filename with extension',
    field: 'image'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Account activation status',
    field: 'is_active'
  },
  is_restricted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Restricted access - only doctors can view',
    field: 'is_restricted'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  telegram_chat_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Telegram chat ID for the user',
    field: 'telegram_chat_id'
  }
}, {
  tableName: 'users',
  timestamps: false,
  validate: {
    // Custom validation to ensure either email or phone is provided
    eitherEmailOrPhone() {
      if ((!this.email || this.email.trim() === '') && (!this.phone || this.phone.trim() === '')) {
        throw new Error('Either email or phone must be provided');
      }
      // If email is provided, account should be inactive until verified (only on creation)
      if (this.email && this.email.trim() !== '' && !this.user_id) {
        this.is_active = false;
      }
    }
  },
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Method to match user entered password to hashed password in database
User.prototype.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = User;
