const { Blog, Admin } = require('../models');
const { Op } = require('sequelize');

class BlogRepository {
  // Create a new blog post
  async createBlog(blogData) {
    try {
      return await Blog.create(blogData);
    } catch (error) {
      throw error;
    }
  }

  // Get all blog posts with optional filters
  async getAllBlogs(page = 1, limit = 10, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      
      const queryOptions = {
        include: [
          {
            model: Admin,
            as: 'author',
            attributes: ['user_id', 'full_name', 'role', 'image'],
            where: { is_active: true } // Only include active authors
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      };

      // Apply filters if provided
      if (filters.status) {
        queryOptions.where = {
          ...queryOptions.where,
          status: filters.status
        };
      }

      if (filters.search) {
        queryOptions.where = {
          ...queryOptions.where,
          [Op.or]: [
            { '$title.ar$': { [Op.like]: `%${filters.search}%` } },
            { '$title.en$': { [Op.like]: `%${filters.search}%` } },
            { '$content.ar$': { [Op.like]: `%${filters.search}%` } },
            { '$content.en$': { [Op.like]: `%${filters.search}%` } }
          ]
        };
      }

      const result = await Blog.findAndCountAll(queryOptions);

      return {
        blogs: result.rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(result.count / limit),
          totalItems: result.count,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Get the latest 3 blog posts
  async getLatestBlogs() {
    try {
      return await Blog.findAll({
        include: [
          {
            model: Admin,
            as: 'author',
            attributes: ['user_id', 'full_name', 'role', 'image'],
            where: { is_active: true } // Only include active authors
          }
        ],
        where: { status: 'published' },
        order: [['published_at', 'DESC']],
        limit: 3
      });
    } catch (error) {
      throw error;
    }
  }

  // Get blog post by ID
  async getBlogById(id) {
    try {
      return await Blog.findByPk(id, {
        include: [
          {
            model: Admin,
            as: 'author',
            attributes: ['user_id', 'full_name', 'role', 'image']
          }
        ]
      });
    } catch (error) {
      throw error;
    }
  }

  // Get blog post by slug
  async getBlogBySlug(slug) {
    try {
      return await Blog.findOne({
        where: { slug },
        include: [
          {
            model: Admin,
            as: 'author',
            attributes: ['user_id', 'full_name', 'role', 'image']
          }
        ]
      });
    } catch (error) {
      throw error;
    }
  }

  // Get blogs by author ID
  async getBlogsByAuthorId(authorId, page = 1, limit = 10, status = null) {
    try {
      const offset = (page - 1) * limit;
      
      const queryOptions = {
        include: [
          {
            model: Admin,
            as: 'author',
            attributes: ['user_id', 'full_name', 'role', 'image']
          }
        ],
        where: { author_id: authorId },
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      };

      if (status) {
        queryOptions.where.status = status;
      }

      const result = await Blog.findAndCountAll(queryOptions);

      return {
        blogs: result.rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(result.count / limit),
          totalItems: result.count,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Update blog post
  async updateBlog(id, updateData) {
    try {
      const blog = await Blog.findByPk(id);
      if (!blog) {
        throw new Error('Blog not found');
      }

      return await blog.update(updateData);
    } catch (error) {
      throw error;
    }
  }

  // Delete blog post
  async deleteBlog(id) {
    try {
      const blog = await Blog.findByPk(id);
      if (!blog) {
        throw new Error('Blog not found');
      }

      return await blog.destroy();
    } catch (error) {
      throw error;
    }
  }

  // Check if a blog belongs to an author
  async isBlogAuthor(blogId, authorId) {
    try {
      const blog = await Blog.findOne({
        where: {
          id: blogId,
          author_id: authorId
        }
      });

      return !!blog;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new BlogRepository();