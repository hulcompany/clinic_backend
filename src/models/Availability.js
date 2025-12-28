const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Availability = sequelize.define('Availability', {
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
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'date'
  },
  start_time: {
    type: DataTypes.TIME,
    allowNull: false,
    field: 'start_time'
  },
  end_time: {
    type: DataTypes.TIME,
    allowNull: true,
    field: 'end_time'
  },
  is_booked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_booked'
  },
  booked_by_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'booked_by_user_id'
  },
  status: {
    type: DataTypes.ENUM('available', 'unavailable', 'cancelled'),
    defaultValue: 'available',
    field: 'status'
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
  session_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'session_id',
    references: {
      model: 'sessions',
      key: 'id'
    }
  },
  join_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'join_enabled'
  },
  reminder_sent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'reminder_sent'
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
  tableName: 'availability',
  timestamps: true,
  underscored: true
});

module.exports = Availability;