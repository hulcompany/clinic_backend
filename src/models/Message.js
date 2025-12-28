const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { buildMediaUrl } = require('../utils/mediaUtils');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id'
  },
  chat_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'chat_id'
  },
  sender_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'sender_id'
  },
  message_type: {
    type: DataTypes.ENUM('text', 'image', 'video', 'audio'),
    defaultValue: 'text',
    field: 'message_type'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'content'
  },
    
  file: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'file'
  },
  
  // Virtual field to get the full URL
  file_url: {
    type: DataTypes.VIRTUAL,
    get() {
      const rawValue = this.getDataValue('file');
      if (!rawValue) return null;
      
      // If it's already a full URL, return as is
      if (rawValue.startsWith('http')) {
        return rawValue;
      }
      
      // Otherwise, build the full URL using the media utility
      // Determine media type from file extension
      const mediaType = rawValue.match(/\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i) ? 'videos' : 
                       rawValue.match(/\.(mp3|wav|aac|ogg|flac)$/i) ? 'audios' : 'images';
      return buildMediaUrl(rawValue, mediaType, 'messages');
    }
  },
  read_at: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'read_at'
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
  tableName: 'messages',
  timestamps: true,
  underscored: true
});

module.exports = Message;