const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Consultation = sequelize.define('Consultation', {
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
  admin_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'admin_id'
  },
  initial_issue: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'initial_issue'
  },
  status: {
    type: DataTypes.ENUM('requested', 'active', 'closed'),
    defaultValue: 'requested',
    field: 'status'
  },
  medical_record_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'medical_record_id'
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
  tableName: 'consultations',
  timestamps: true,
  underscored: true
});

// Define associations
Consultation.associate = (models) => {
  Consultation.belongsTo(models.MedicalRecord, {
    foreignKey: 'medical_record_id',
    as: 'medicalRecord'
  });
};

module.exports = Consultation;
