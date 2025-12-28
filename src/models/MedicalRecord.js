const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MedicalRecord = sequelize.define('MedicalRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  doctor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'doctor_id',
    references: {
      model: 'admins',
      key: 'user_id'
    }
  },
  consultation_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'consultation_id',
    references: {
      model: 'consultations',
      key: 'consultation_id'
    }
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'age'
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    allowNull: true,
    field: 'gender'
  },
  height: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'height'
  },
  weight: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'weight'
  },
  chronic_diseases: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'chronic_diseases'
  },
  allergies: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'allergies'
  },
  previous_surgeries: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'previous_surgeries'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'notes'
  },
  medical_attachments: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null,
    field: 'medical_attachments',
    get() {
      const value = this.getDataValue('medical_attachments');
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch (e) {
          return value;
        }
      }
      return value;
    },
    set(val) {
      this.setDataValue('medical_attachments', val);
    }
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
  tableName: 'medical_records',
  timestamps: false,
 
});

module.exports = MedicalRecord;