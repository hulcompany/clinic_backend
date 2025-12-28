const { blogService } = require('../services');
const AppError = require('../utils/AppError');
const { successResponse, createdResponse, failureResponse } = require('../utils/responseHandler');
const { Admin } = require('../models');
const { hasPermission } = require('../config/roles');

// Helper function to validate doctor/admin/super_admin permissions
const validateProfessionalPermission = (user) => {
  return user.role === 'doctor' || user.role === 'admin' || user.role === 'super_admin';
};

// Helper function to validate if user is a secretary for the same doctor
const validateSecretaryPermission = async (user, doctorId) => {
  if (user.role !== 'secretary') {
    return false;
  }
  
  // Check if the secretary is supervised by the specified doctor
  const secretary = await Admin.findByPk(user.user_id);
  return secretary && secretary.supervisor_id === doctorId;
};

// Helper function to validate blog author permissions
const validateBlogAuthorPermission = async (user, blogAuthorId) => {
  // Author can manage their own blog
  if (user.user_id === blogAuthorId) {
    return true;
  }
  
  // Doctors, admins, and super admins can manage any blog
  if (validateProfessionalPermission(user)) {
    return true;
  }
  
  // Secretary can manage blog if they are supervised by the blog's author (if the author is a doctor)
  if (user.role === 'secretary' && hasPermission(user.role, 'manage_blog_posts')) {
    return await validateSecretaryPermission(user, blogAuthorId);
  }
  
  return false;
};

/**
 * @desc    Get all blog posts (public)
 * @route   GET /api/v1/blogs
 * @access  Public
 */
const getAllBlogs = async (req, res, next) => {
  try {
    // Get pagination parameters from query, with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    // Get filter parameters
    const filters = {};
    
    // Status filter
    if (req.query.status) {
      filters.status = req.query.status;
    }
    
    // Search filter
    if (req.query.search) {
      filters.search = req.query.search;
    }
    
    const result = await blogService.getAllBlogs(page, limit, filters);
    
    successResponse(res, result, 'Blog posts retrieved successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Get latest 3 blog posts (public)
 * @route   GET /api/v1/blogs/latest
 * @access  Public
 */
const getLatestBlogs = async (req, res, next) => {
  try {
    const blogs = await blogService.getLatestBlogs();
    
    successResponse(res, blogs, 'Latest blog posts retrieved successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Get blog post by ID (public)
 * @route   GET /api/v1/blogs/:id
 * @access  Public
 */
const getBlogById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const blog = await blogService.getBlogById(id);
    
    successResponse(res, blog, 'Blog post retrieved successfully');
  } catch (error) {
    if (error.statusCode === 404) {
      return failureResponse(res, 'Blog post not found', 404);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Get blog post by slug (public)
 * @route   GET /api/v1/blogs/slug/:slug
 * @access  Public
 */
const getBlogBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    
    const blog = await blogService.getBlogBySlug(slug);
    
    successResponse(res, blog, 'Blog post retrieved successfully');
  } catch (error) {
    if (error.statusCode === 404) {
      return failureResponse(res, 'Blog post not found', 404);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Get blog posts by doctor ID
 * @route   GET /api/v1/blogs/doctor/:doctorId
 * @access  Private (Doctor, Doctor's Secretary, Admin, Super Admin, or Public for other doctors)
 */
const getBlogsByDoctorId = async (req, res, next) => {
  try {
    let doctorId;
    
    // If user is a doctor, they can only access their own blogs
    if (req.user.role === 'doctor') {
      doctorId = req.user.user_id;
    }
    // If user is a secretary, they can access their supervising doctor's blogs
    else if (req.user.role === 'secretary') {
      if (!hasPermission(req.user.role, 'manage_blog_posts')) {
        return failureResponse(res, 'Not authorized to access blog posts', 403);
      }
      
      const secretary = await Admin.findByPk(req.user.user_id);
      if (!secretary || !secretary.supervisor_id) {
        return failureResponse(res, 'Secretary must be assigned to a doctor', 403);
      }
      
      doctorId = secretary.supervisor_id;
    }
    // If user is admin or super admin, they can access any doctor's blogs
    else if (req.user.role === 'admin' || req.user.role === 'super_admin') {
      doctorId = parseInt(req.params.doctorId);
      if (!doctorId) {
        return failureResponse(res, 'Doctor ID is required for admin access', 400);
      }
    }
    // For other users (regular users), they can access any doctor's blogs
    else {
      doctorId = parseInt(req.params.doctorId);
      if (!doctorId) {
        return failureResponse(res, 'Doctor ID is required', 400);
      }
    }
    
    // Get pagination parameters from query, with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    // Get status filter
    const status = req.query.status;
    
    const result = await blogService.getBlogsByAuthorId(doctorId, page, limit, status);
    
    successResponse(res, result, 'Blog posts retrieved successfully');
  } catch (error) {
    if (error.statusCode === 403) {
      return failureResponse(res, error.message, 403);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Create a new blog post
 * @route   POST /api/v1/blogs
 * @access  Private (Doctor, Doctor's Secretary with permission, Admin, Super Admin)
 */
const createBlog = async (req, res, next) => {
  try {
    const { title, content, excerpt, status } = req.body;

    // Validate required fields
    if (!title || !content || !excerpt) {
      return failureResponse(res, 'Title, content, and excerpt are required', 400);
    }

    // Check permissions
    let authorId = req.user.user_id;

    // If the user is a secretary, verify they have the required permission
    if (req.user.role === 'secretary') {
      if (!hasPermission(req.user.role, 'manage_blog_posts')) {
        return failureResponse(res, 'Not authorized to create blog posts', 403);
      }

      // Verify that the secretary is supervised by a doctor
      const secretary = await Admin.findByPk(req.user.user_id);
      if (!secretary || !secretary.supervisor_id) {
        return failureResponse(res, 'Secretary must be assigned to a doctor', 403);
      }
      
      // The secretary will create the blog on behalf of their doctor
      authorId = secretary.supervisor_id;
    } else if (!validateProfessionalPermission(req.user)) {
      // Only doctors, admins, super admins, and authorized secretaries can create blogs
      return failureResponse(res, 'Not authorized to create blog posts', 403);
    }

    // Handle image upload if provided
    let imageData = null;
    if (req.file) {
      imageData = req.file.filename;
    }

    // Handle multilingual content properly
    let processedTitle = title;
    let processedContent = content;
    let processedExcerpt = excerpt;
    
    // Parse JSON strings if they're provided as strings
    if (typeof title === 'string') {
      try {
        processedTitle = JSON.parse(title);
      } catch (e) {
        // If parsing fails, treat as plain string and wrap in both languages
        processedTitle = { en: title, ar: title };
      }
    }
    
    if (typeof content === 'string') {
      try {
        processedContent = JSON.parse(content);
      } catch (e) {
        // If parsing fails, treat as plain string and wrap in both languages
        processedContent = { en: content, ar: content };
      }
    }
    
    if (typeof excerpt === 'string') {
      try {
        processedExcerpt = JSON.parse(excerpt);
      } catch (e) {
        // If parsing fails, treat as plain string and wrap in both languages
        processedExcerpt = { en: excerpt, ar: excerpt };
      }
    }
    
    // Ensure JSON fields are valid objects before passing to service
    if (typeof processedTitle !== 'object' || processedTitle === null) {
      processedTitle = { en: '', ar: '' };
    }
    if (typeof processedContent !== 'object' || processedContent === null) {
      processedContent = { en: '', ar: '' };
    }
    if (typeof processedExcerpt !== 'object' || processedExcerpt === null) {
      processedExcerpt = { en: '', ar: '' };
    }
    
    // Validate status field
    let validatedStatus = status;
    if (!status || (typeof status === 'string' && status.trim().toLowerCase() !== 'published' && status.trim().toLowerCase() !== 'draft')) {
      validatedStatus = 'draft';
    } else if (typeof status === 'string') {
      // Normalize the status to lowercase
      validatedStatus = status.trim().toLowerCase();
    }
    
    const blogData = {
      title: processedTitle,
      content: processedContent,
      excerpt: processedExcerpt,
      featured_image: imageData,
      status: validatedStatus
    };

    const blog = await blogService.createBlog(authorId, blogData);

    createdResponse(res, blog, 'Blog post created successfully'); 
  } catch (error) {
    if (error.message.includes('Blog not found')) {
      return failureResponse(res, error.message, 404);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Update blog post
 * @route   PUT /api/v1/blogs/:id
 * @access  Private (Blog Author, Doctor, Admin, Super Admin, Secretary with permission for their doctor's blogs)
 */
const updateBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, excerpt, status } = req.body;

    // Check if the user has permission to update this blog
    const blog = await blogService.getBlogById(id);
    if (!blog) {
      return failureResponse(res, 'Blog post not found', 404);
    }

    const hasPermission = await validateBlogAuthorPermission(req.user, blog.author_id);
    if (!hasPermission) {
      return failureResponse(res, 'Not authorized to update this blog post', 403);
    }

    const updateData = {};
    if (title) updateData.title = typeof title === 'string' ? JSON.parse(title) : title;
    if (content) updateData.content = typeof content === 'string' ? JSON.parse(content) : content;
    if (excerpt) updateData.excerpt = typeof excerpt === 'string' ? JSON.parse(excerpt) : excerpt;
    if (status) updateData.status = status;
    
    // Handle image upload if provided
    if (req.file) {
      updateData.featured_image = req.file.filename;
    }

    const updatedBlog = await blogService.updateBlog(id, req.user.user_id, updateData);

    successResponse(res, updatedBlog, 'Blog post updated successfully');
  } catch (error) {
    if (error.statusCode === 404) {
      return failureResponse(res, 'Blog post not found', 404);
    }
    if (error.statusCode === 403) {
      return failureResponse(res, error.message, 403);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Delete blog post
 * @route   DELETE /api/v1/blogs/:id
 * @access  Private (Blog Author, Doctor, Admin, Super Admin, Secretary with permission for their doctor's blogs)
 */
const deleteBlog = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if the user has permission to delete this blog
    const blog = await blogService.getBlogById(id);
    if (!blog) {
      return failureResponse(res, 'Blog post not found', 404);
    }

    const hasPermission = await validateBlogAuthorPermission(req.user, blog.author_id);
    if (!hasPermission) {
      return failureResponse(res, 'Not authorized to delete this blog post', 403);
    }

    await blogService.deleteBlog(id, req.user.user_id);

    successResponse(res, null, 'Blog post deleted successfully');
  } catch (error) {
    if (error.statusCode === 404) {
      return failureResponse(res, 'Blog post not found', 404);
    }
    if (error.statusCode === 403) {
      return failureResponse(res, error.message, 403);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Toggle blog post status
 * @route   PUT /api/v1/blogs/:id/toggle-status
 * @access  Private (Blog Author, Doctor, Admin, Super Admin, Secretary with permission for their doctor's blogs)
 */
const toggleBlogStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if the user has permission to toggle status for this blog
    const blog = await blogService.getBlogById(id);
    if (!blog) {
      return failureResponse(res, 'Blog post not found', 404);
    }

    const hasPermission = await validateBlogAuthorPermission(req.user, blog.author_id);
    if (!hasPermission) {
      return failureResponse(res, 'Not authorized to toggle status for this blog post', 403);
    }

    const updatedBlog = await blogService.toggleBlogStatus(id, req.user.user_id);

    successResponse(res, updatedBlog, 'Blog post status toggled successfully');
  } catch (error) {
    if (error.statusCode === 404) {
      return failureResponse(res, 'Blog post not found', 404);
    }
    if (error.statusCode === 403) {
      return failureResponse(res, error.message, 403);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

module.exports = {
  getAllBlogs,
  getLatestBlogs,
  getBlogById,
  getBlogBySlug,
  getBlogsByDoctorId,
  createBlog,
  updateBlog,
  deleteBlog,
  toggleBlogStatus
};