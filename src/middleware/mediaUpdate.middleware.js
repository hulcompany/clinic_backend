/*
The mediaUpdate.middleware.js file is specifically designed for updating user and admin media files, not for chat messages. There's a significant difference in how it should work:

1. Purpose of the original file:
- Dedicated for updating profile images
- Contains automatic cleanup function for old media
- Deals with user and admin data only

2. Permission System:
- Unified permission system for Admin/Doctor/Super Admin roles
- All roles share the same media update permissions
*/
const { uploadImage, uploadVideo, uploadAudio, uploadMultipleImages, uploadMultipleVideos, uploadMultipleAudios } = require('../utils/allMediaUploadUtil');
const { handleMediaUpdate, handleMultipleMediaUpdates, cleanupEntityMedia, cleanupMultipleEntityMedia } = require('../utils/mediaCleanupUtil');
const { User, Admin, Service, ContactUs, MedicalRecord, Blog, LandingImage } = require('../models/index'); // استيراد النماذج مباشرة
const { getMediaType } = require('../utils/mediaUtils');
/**
 * Generic conditional media management middleware
 * Can be used for any entity that needs media handling (upload, update, delete) with cleanup
 * Supports single/multiple images, videos, and audios
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.fieldName - Form field name for the file (default: 'image')
 * @param {string} options.contentType - Content type for folder organization (default: 'users')
 * @param {string} options.entityType - Entity type ('user' or 'admin') for direct entity resolution
 * @param {string} options.mediaField - Field name for media in database (default: 'image')
 * @param {boolean} options.cleanup - Whether to cleanup old media (default: true)
 * @param {string} options.uploadType - Type of upload (single|multiple) (default: 'single')
 * @param {string} options.mediaType - Type of media (image|video|audio) (default: 'image')
 * @param {number} options.maxCount - Max number of files for multiple upload (default: 10)
 * @returns {Function} Express middleware
 */
const conditionalMediaManagement = (options = {}) => {
  return async (req, res, next) => {
    // Check if request is multipart/form-data (contains file uploads)
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
      try {
        // Default options
        const defaults = {
          fieldName: 'image',
          contentType: 'users',
          entityType: null, // Will be set based on route usage
          mediaField: 'image',
          cleanup: true,
          uploadType: 'single',
          mediaType: 'image',
          maxCount: 10
        };
        
        // Merge options with defaults
        const opts = { ...defaults, ...options };
        
        // Select appropriate upload function based on media type and upload type
        let uploadFunction;
        if (opts.mediaType === 'image' || opts.mediaType === 'images') {
          if (opts.uploadType === 'single') {
            uploadFunction = uploadImage;
          } else {
            uploadFunction = uploadMultipleImages;
          }
        } else if (opts.mediaType === 'video' || opts.mediaType === 'videos') {
          if (opts.uploadType === 'single') {
            uploadFunction = uploadVideo;
          } else {
            uploadFunction = uploadMultipleVideos;
          }
        } else if (opts.mediaType === 'audio' || opts.mediaType === 'audios') {
          if (opts.uploadType === 'single') {
            uploadFunction = uploadAudio;
          } else {
            uploadFunction = uploadMultipleAudios;
          }
        }
        
        // Ensure uploadFunction is defined
        if (!uploadFunction) {
          throw new Error(`Unsupported media type: ${opts.mediaType} or upload type: ${opts.uploadType}`);
        }
        
        // Upload media using appropriate utility
        const uploadResult = await uploadFunction(req, res, {
          fieldName: opts.fieldName,
          contentType: opts.contentType,
          uploadType: opts.uploadType,
          maxCount: opts.maxCount,
          compressionRatio: parseInt(req.query.compression) || 90
        });
        
        // Handle cleanup of old media if this is an update operation
        if (opts.cleanup && uploadResult.files && uploadResult.files.length > 0) {
          try {
            // Get the existing entity directly without separate helper
            let entity = null;
            
            // Extract ID from parameters or authentication based on entityType
            if (opts.entityType === 'user') {
              // For profile updates, get ID from authenticated user
              const userId = req.params.id || (req.user && req.user.user_id);
              console.log('User ID for cleanup:', userId);
              if (userId) {
                entity = await User.findByPk(userId, {
                  attributes: ['user_id', opts.mediaField]
                });
              }
            } else if (opts.entityType === 'admin') {
              // For admin profile updates, get ID from authenticated admin
              const adminId = req.params.id || (req.user && req.user.user_id);
              console.log('Admin ID for cleanup:', adminId);
              if (adminId) {
                entity = await Admin.findByPk(adminId, {
                  attributes: ['user_id', opts.mediaField]
                });
              }
            }
            //////// start   service & contact
            
            else if (opts.entityType === 'medical_record') {
              // For medical record updates, get ID from route parameters
              const medicalRecordId = req.params.id;
              console.log('Medical Record ID for cleanup:', medicalRecordId);
              if (medicalRecordId) {
                entity = await MedicalRecord.findByPk(medicalRecordId, {
                  attributes: ['id', opts.mediaField]
                });
              }
            } else if (opts.entityType === 'service') {
              // For service updates, get ID from route parameters
              const serviceId = req.params.id;
              console.log('Service ID for cleanup:', serviceId);
              if (serviceId) {
                entity = await Service.findByPk(serviceId, {
                  attributes: ['id', opts.mediaField]
                });
              }
            } else if (opts.entityType === 'contact') {
              // For contact us updates, get ID from route parameters
              const contactId = req.params.id;
              console.log('Contact ID for cleanup:', contactId);
              if (contactId) {
                entity = await ContactUs.findByPk(contactId, {
                  attributes: ['id', opts.mediaField]
                });
              }
            } else if (opts.entityType === 'blog') {
              // For blog updates, get ID from route parameters
              const blogId = req.params.id;
              console.log('Blog ID for cleanup:', blogId);
              if (blogId) {
                entity = await Blog.findByPk(blogId, {
                  attributes: ['id', opts.mediaField]
                });
              }
            } else if (opts.entityType === 'landing_image') {
              // For landing image updates, get ID from route parameters
              const landingImageId = req.params.id;
              console.log('Landing Image ID for cleanup:', landingImageId);
              if (landingImageId) {
                entity = await LandingImage.findByPk(landingImageId, {
                  attributes: ['id', opts.mediaField]
                });
              }
            }

            /////////////end
            
            console.log('Entity for cleanup:', entity);
            console.log('Entity media field:', entity ? entity[opts.mediaField] : 'N/A');
            
            if (entity && entity[opts.mediaField]) {
              // Handle cleanup based on upload type
              if (opts.uploadType === 'single') {
                // Single file upload - cleanup single old file
                console.log('Cleaning up old media:', {
                  oldPath: entity[opts.mediaField],
                  newPath: uploadResult.files[0].filename
                });
                
                // For cleanup, we need to construct the full path since the DB only stores filenames
                const oldFilename = entity[opts.mediaField];
                const newFilename = uploadResult.files[0].filename;
                
                // Only cleanup if filenames are different
                if (oldFilename !== newFilename) {
                  // Determine media type from filename
                  const mediaType = getMediaType(oldFilename);
                  
                  await handleMediaUpdate({
                    oldFilename: oldFilename,
                    newFilename: newFilename,
                    contentType: opts.contentType,
                    mediaType: mediaType
                  });
                }
              } else {
                // Multiple file upload - cleanup old files not in new list
                if (entity && entity[opts.mediaField]) {
                  const oldFiles = Array.isArray(entity[opts.mediaField]) ? entity[opts.mediaField] : JSON.parse(entity[opts.mediaField] || '[]');
                  const newFiles = uploadResult.files.map(file => file.filename);
                  
                  // Get preserved attachments from request body if any
                  let preservedFiles = [];
                  if (req.body.preserveAttachments) {
                    try {
                      preservedFiles = typeof req.body.preserveAttachments === 'string' 
                        ? JSON.parse(req.body.preserveAttachments)
                        : req.body.preserveAttachments;
                      if (!Array.isArray(preservedFiles)) {
                        preservedFiles = [];
                      }
                    } catch (parseError) {
                      console.warn('Could not parse preserveAttachments:', parseError.message);
                      preservedFiles = [];
                    }
                  }
                  
                  // Determine which old files to clean up (those not in the new files list or preserved files list)
                  const filesToKeep = [...newFiles, ...preservedFiles];
                  const filesToCleanup = oldFiles.filter(oldFile => {
                    const oldFilename = typeof oldFile === 'string' ? oldFile : (oldFile.filename || oldFile);
                    return !filesToKeep.includes(oldFilename);
                  });
                  
                  console.log('Multiple file cleanup - Old files:', oldFiles);
                  console.log('Multiple file cleanup - New files:', newFiles);
                  console.log('Multiple file cleanup - Files to cleanup:', filesToCleanup);
                  
                  if (filesToCleanup.length > 0) {
                    // Use correct mediaType for cleanup based on entity type
                    const cleanupMediaType = opts.entityType === 'medical_record' ? 'images' : opts.mediaType;
                    await handleMultipleMediaUpdates({
                      oldPaths: filesToCleanup,
                      newPaths: newFiles,
                      contentType: opts.contentType,
                      mediaType: cleanupMediaType
                    });
                  }
                }
              }
            } else {
              console.log('No entity found or no media to cleanup');
            }
          } catch (cleanupError) {
            console.warn('Media cleanup warning:', cleanupError.message);
            console.error('Media cleanup error stack:', cleanupError.stack);
          }
        }
        
        next();
      } catch (uploadError) {
        return next(uploadError);
      }
    } else {
      // If not multipart/form-data, continue without media handling
      next();
    }
  };
};

/**
 * Middleware for cleaning up media when deleting entities
 * @param {Object} options - Configuration options
 * @param {string} options.entityType - Entity type ('service', 'contact', etc.)
 * @param {string} options.contentType - Content type for folder organization
 * @param {string} options.mediaField - Field name for media in database (default: 'image')
 * @param {string} options.mediaType - Media type (images, videos, etc.) (default: 'images')
 * @returns {Function} Express middleware
 */
const deleteMediaCleanup = (options = {}) => {
  return async (req, res, next) => {
    try {
      console.log('=== DELETE MEDIA CLEANUP MIDDLEWARE START ===');
      console.log('deleteMediaCleanup middleware called with options:', options);
      
      // Default options
      const defaults = {
        entityType: null,
        contentType: 'images',
        mediaField: 'image',
        mediaType: 'images'
      };
      
      // Merge options with defaults
      const opts = { ...defaults, ...options };
      console.log('Merged options:', opts);
      
      // Get entity ID from route parameters
      const entityId = req.params.id;
      console.log('Entity ID from params:', entityId);
      
      if (!entityId) {
        console.log('No entity ID found, skipping cleanup');
        console.log('=== DELETE MEDIA CLEANUP MIDDLEWARE END (NO ID) ===');
        return next();
      }
      
      // Get the entity based on entity type
      let entity = null;
      if (opts.entityType === 'medical_record') {
        console.log('Fetching medical record entity with ID:', entityId);
        entity = await MedicalRecord.findByPk(entityId, {
          attributes: ['id', opts.mediaField]
        });
      } else if (opts.entityType === 'service') {
        console.log('Fetching service entity with ID:', entityId);
        entity = await Service.findByPk(entityId, {
          attributes: ['id', opts.mediaField]
        });
      } else if (opts.entityType === 'contact') {
        console.log('Fetching contact entity with ID:', entityId);
        entity = await ContactUs.findByPk(entityId, {
          attributes: ['id', opts.mediaField]
        });
      } else if (opts.entityType === 'blog') {
        console.log('Fetching blog entity with ID:', entityId);
        entity = await Blog.findByPk(entityId, {
          attributes: ['id', opts.mediaField]
        });
      } else if (opts.entityType === 'landing_image') {
        console.log('Fetching landing image entity with ID:', entityId);
        entity = await LandingImage.findByPk(entityId, {
          attributes: ['id', opts.mediaField]
        });
      }
      
      console.log('Entity fetched:', entity ? entity.toJSON() : null);
      
      // Clean up media if entity exists and has media
      if (entity && entity[opts.mediaField]) {
        console.log('Calling cleanupEntityMedia for entity');
        const result = await cleanupEntityMedia(entity, opts.mediaField, opts.contentType, opts.mediaType);
        console.log('Cleanup result:', result);
      } else {
        console.log('No entity or media field found, skipping cleanup');
        if (!entity) {
          console.log('REASON: Entity not found');
        } else if (!entity[opts.mediaField]) {
          console.log('REASON: Entity media field is empty');
        }
      }
      
      console.log('=== DELETE MEDIA CLEANUP MIDDLEWARE END ===');
      next();
    } catch (error) {
      console.warn('Media cleanup warning during delete:', error.message);
      console.error('Media cleanup error stack:', error.stack);
      next();
    }
  };
};

module.exports = {
  conditionalMediaManagement,
  deleteMediaCleanup,
  handleMediaUpdate,
  handleMultipleMediaUpdates,
  cleanupEntityMedia,
  cleanupMultipleEntityMedia
};