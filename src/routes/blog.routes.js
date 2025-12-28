const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blog.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { conditionalMediaManagement, deleteMediaCleanup } = require('../middleware/mediaUpdate.middleware');

// Public routes
router.get('/', blogController.getAllBlogs);
router.get('/latest', blogController.getLatestBlogs);
router.get('/slug/:slug', blogController.getBlogBySlug);
router.get('/:id', blogController.getBlogById);

// Private routes - only authenticated users can access
router.get('/doctor/:doctorId', authMiddleware.protect, blogController.getBlogsByDoctorId);

// Create blog - only doctors, admins, super admins, and authorized secretaries can create
router.post('/',
  authMiddleware.protect,
  // Handle featured image upload
  conditionalMediaManagement({
    fieldName: 'featured_image',
    contentType: 'blog',
    mediaField: 'featured_image',
    uploadType: 'single',
    mediaType: 'images',
    entityType: 'blog',
    cleanup: false // Don't cleanup on create
  }),
  blogController.createBlog
);

// Update blog - only author, admins, super admins, and authorized secretaries can update
router.put('/:id',
  authMiddleware.protect,
  // Handle featured image upload
  conditionalMediaManagement({
    fieldName: 'featured_image',
    contentType: 'blog',
    mediaField: 'featured_image',
    uploadType: 'single',
    mediaType: 'images',
    entityType: 'blog',
    cleanup: true // Cleanup old image when updating
  }),
  blogController.updateBlog
);

// Delete blog - only author, admins, super admins, and authorized secretaries can delete
router.delete('/:id', 
  authMiddleware.protect,
  deleteMediaCleanup({ 
    entityType: 'blog',
    contentType: 'blog',
    mediaField: 'featured_image',
    mediaType: 'images'
  }),
  blogController.deleteBlog
);

// Toggle blog status - only author, admins, super admins, and authorized secretaries can toggle
router.put('/:id/toggle-status', 
  authMiddleware.protect,
  blogController.toggleBlogStatus
);

module.exports = router;