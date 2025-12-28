const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Blog = sequelize.define('Blog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id'
  },
  title: {
    type: DataTypes.JSON,
    allowNull: false,
    field: 'title'
  },
  slug: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'slug'
  },
  content: {
    type: DataTypes.JSON,
    allowNull: false,
    field: 'content'
  },
  excerpt: {
    type: DataTypes.JSON,
    allowNull: false,
    field: 'excerpt'
  },
  featured_image: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'featured_image'
  },
  author_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'author_id'
  },
  status: {
    type: DataTypes.ENUM('draft', 'published'),
    defaultValue: 'draft',
    field: 'status'
  },
  published_at: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'published_at'
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
  tableName: 'blog',
  timestamps: false,
  underscored: true
});

module.exports = Blog;