const blogRepository = require('../repositories/blog.repository');
const AppError = require('../utils/AppError');

class BlogService {
  // Create a new blog post
  async createBlog(authorId, data) {
    try {
      // Validate required fields
      if (!data.title || !data.content || !data.excerpt) {
        throw new AppError('Title, content, and excerpt are required', 400);
      }

      // Generate slug from English title if available, otherwise from Arabic title
      let slug = '';
      if (data.title.en) {
        slug = this.generateSlug(data.title.en);
      } else if (data.title.ar) {
        slug = this.generateSlug(data.title.ar);
      } else {
        throw new AppError('Title in at least one language is required', 400);
      }

      // Check if slug already exists
      const existingBlog = await blogRepository.getBlogBySlug(slug);
      if (existingBlog) {
        // Add a number to make it unique
        let counter = 1;
        let newSlug = `${slug}-${counter}`;
        while (await blogRepository.getBlogBySlug(newSlug)) {
          counter++;
          newSlug = `${slug}-${counter}`;
        }
        slug = newSlug;
      }

      // Prepare blog data
      const blogData = {
        title: data.title,
        slug,
        content: data.content,
        excerpt: data.excerpt,
        featured_image: data.featured_image || null,
        author_id: authorId,
        status: data.status || 'draft'
      };

      // If status is published, set published_at
      if (data.status === 'published') {
        blogData.published_at = new Date();
      }

      const blog = await blogRepository.createBlog(blogData);
      return blog;
    } catch (error) {
      if (error.message.includes('Blog not found')) {
        throw new AppError('Blog not found', 404);
      }
      throw new AppError('Failed to create blog: ' + error.message, 500);
    }
  }

  // Get all blog posts (public)
  async getAllBlogs(page = 1, limit = 10, filters = {}) {
    try {
      // Add status filter to only show published posts by default
      if (!filters.status) {
        filters.status = 'published';
      }

      const result = await blogRepository.getAllBlogs(page, limit, filters);
      return result;
    } catch (error) {
      throw new AppError('Failed to get blogs: ' + error.message, 500);
    }
  }

  // Get the latest 3 blog posts (public)
  async getLatestBlogs() {
    try {
      const blogs = await blogRepository.getLatestBlogs();
      return blogs;
    } catch (error) {
      throw new AppError('Failed to get latest blogs: ' + error.message, 500);
    }
  }

  // Get blog post by ID (public)
  async getBlogById(id) {
    try {
      const blog = await blogRepository.getBlogById(id);
      if (!blog) {
        throw new AppError('Blog not found', 404);
      }
      return blog;
    } catch (error) {
      if (error.message.includes('Blog not found')) {
        throw new AppError('Blog not found', 404);
      }
      throw new AppError('Failed to get blog: ' + error.message, 500);
    }
  }

  // Get blog post by slug (public)
  async getBlogBySlug(slug) {
    try {
      const blog = await blogRepository.getBlogBySlug(slug);
      if (!blog) {
        throw new AppError('Blog not found', 404);
      }
      return blog;
    } catch (error) {
      if (error.message.includes('Blog not found')) {
        throw new AppError('Blog not found', 404);
      }
      throw new AppError('Failed to get blog: ' + error.message, 500);
    }
  }

  // Get blogs by author ID (private)
  async getBlogsByAuthorId(authorId, page = 1, limit = 10, status = null) {
    try {
      const result = await blogRepository.getBlogsByAuthorId(authorId, page, limit, status);
      return result;
    } catch (error) {
      throw new AppError('Failed to get author blogs: ' + error.message, 500);
    }
  }

  // Update blog post
  async updateBlog(id, authorId, data) {
    try {
      // Prepare update data
      const updateData = {};
      
      if (data.title) {
        updateData.title = data.title;
        
        // Regenerate slug if title changed
        let slug = '';
        if (data.title.en) {
          slug = this.generateSlug(data.title.en);
        } else if (data.title.ar) {
          slug = this.generateSlug(data.title.ar);
        }
        
        // Check if new slug is different from current and if it already exists
        const currentBlog = await blogRepository.getBlogById(id);
        if (currentBlog && currentBlog.slug !== slug) {
          // Check if slug already exists
          const existingBlog = await blogRepository.getBlogBySlug(slug);
          if (existingBlog) {
            // Add a number to make it unique
            let counter = 1;
            let newSlug = `${slug}-${counter}`;
            while (await blogRepository.getBlogBySlug(newSlug)) {
              counter++;
              newSlug = `${slug}-${counter}`;
            }
            slug = newSlug;
          }
          updateData.slug = slug;
        }
      }
      
      if (data.content) updateData.content = data.content;
      if (data.excerpt) updateData.excerpt = data.excerpt;
      if (data.featured_image !== undefined) updateData.featured_image = data.featured_image;
      if (data.status) {
        updateData.status = data.status;
        // If status is changing to published and published_at is not set, set it to now
        const currentBlog = await blogRepository.getBlogById(id);
        if (data.status === 'published' && (!currentBlog.published_at || currentBlog.status !== 'published')) {
          updateData.published_at = new Date();
        } else if (data.status !== 'published') {
          // If status is changing from published to something else, clear published_at
          updateData.published_at = null;
        }
      }

      const updatedBlog = await blogRepository.updateBlog(id, updateData);
      return updatedBlog;
    } catch (error) {
      if (error.message.includes('Blog not found')) {
        throw new AppError('Blog not found', 404);
      }
      if (error.message.includes('Not authorized')) {
        throw new AppError('Not authorized to update this blog post', 403);
      }
      throw new AppError('Failed to update blog: ' + error.message, 500);
    }
  }

  // Delete blog post
  async deleteBlog(id, authorId) {
    try {
      const result = await blogRepository.deleteBlog(id);
      return result;
    } catch (error) {
      if (error.message.includes('Blog not found')) {
        throw new AppError('Blog not found', 404);
      }
      if (error.message.includes('Not authorized')) {
        throw new AppError('Not authorized to delete this blog post', 403);
      }
      throw new AppError('Failed to delete blog: ' + error.message, 500);
    }
  }

  // Toggle blog post status
  async toggleBlogStatus(id, authorId) {
    try {
      const blog = await blogRepository.getBlogById(id);
      if (!blog) {
        throw new AppError('Blog not found', 404);
      }

      // Toggle the status
      const newStatus = blog.status === 'published' ? 'draft' : 'published';
      
      // Update the published_at field based on status
      const updateData = {
        status: newStatus
      };
      
      if (newStatus === 'published' && !blog.published_at) {
        updateData.published_at = new Date();
      } else if (newStatus === 'draft') {
        updateData.published_at = null;
      }
      
      const updatedBlog = await blogRepository.updateBlog(id, updateData);
      return updatedBlog;
    } catch (error) {
      if (error.message.includes('Blog not found')) {
        throw new AppError('Blog not found', 404);
      }
      if (error.message.includes('Not authorized')) {
        throw new AppError('Not authorized to toggle status for this blog post', 403);
      }
      throw new AppError('Failed to toggle blog status: ' + error.message, 500);
    }
  }

  // Helper function to generate slug from title
  generateSlug(title) {
    return title
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
  }
}

module.exports = new BlogService();