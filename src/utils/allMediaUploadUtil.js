/**
 * Media Upload Utility
 * 
 * This module provides reusable functions for handling image, video, and audio uploads with customizable
 * folder names and compression ratios. It can be used in various parts of the application
 * including user registration, profile updates, and other media upload scenarios.
 */

const { createUploader, uploadAndCompress, createSuccessResponse, createMultipleSuccessResponse } = require('./mediaHelper');

/**
 * Upload image with customizable options
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} options - Upload options
 * @param {string} options.fieldName - Form field name for the file (default: 'image')
 * @param {string} options.contentType - Content type for folder organization (default: 'users')
 * @param {string} options.uploadType - Type of upload (single|array|fields) (default: 'single')
 * @param {number} options.maxCount - Max number of files for array/fields upload (default: 1)
 * @param {number} options.compressionRatio - Compression ratio 0-100 (default: 90 for 10% compression)
 * @param {boolean} options.compress - Whether to compress files (default: true)
 * @returns {Promise<Object>} - Upload result with file information
 */
const uploadImage = async (req, res, options = {}) => {
  try {
    // Default options
    const defaults = {
      fieldName: 'image',
      contentType: 'users',
      uploadType: 'single',
      maxCount: 1,
      compressionRatio: 90, // 10% compression
      compress: true
    };
    
    // Merge options with defaults
    const opts = { ...defaults, ...options };
    
    // Create uploader with specified options
    const upload = createUploader(
      opts.contentType, 
      opts.fieldName, 
      opts.uploadType, 
      opts.maxCount
    );
    
    // Upload and compress files
    await uploadAndCompress(req, res, upload, opts.compress, opts.compressionRatio);
    
    // Process uploaded files and return structured result
    if (req.file) {
      // Single file upload
      const response = createSuccessResponse(req.file, null, opts.contentType);
      return {
        success: true,
        file: response.data,
        files: [response.data]
      };
    } else if (req.files && Array.isArray(req.files)) {
      // Multiple file upload (array)
      const response = createMultipleSuccessResponse(req.files, [], opts.contentType);
      return {
        success: true,
        files: response.data.files
      };
    } else if (req.files && !Array.isArray(req.files)) {
      // Field-based multiple file upload
      const files = [];
      for (const fieldName in req.files) {
        req.files[fieldName].forEach(file => {
          const response = createSuccessResponse(file, null, opts.contentType);
          files.push(response.data);
        });
      }
      return {
        success: true,
        files: files
      };
    }
    
    // No files uploaded
    return {
      success: false,
      message: 'No files uploaded'
    };
  } catch (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }
};

/**
 * Upload video with customizable options
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} options - Upload options
 * @param {string} options.fieldName - Form field name for the file (default: 'video')
 * @param {string} options.contentType - Content type for folder organization (default: 'users')
 * @param {string} options.uploadType - Type of upload (single|array|fields) (default: 'single')
 * @param {number} options.maxCount - Max number of files for array/fields upload (default: 1)
 * @param {number} options.compressionRatio - Compression ratio 0-100 (default: 90 for 10% compression)
 * @param {boolean} options.compress - Whether to compress files (default: true)
 * @returns {Promise<Object>} - Upload result with file information
 */
const uploadVideo = async (req, res, options = {}) => {
  try {
    // Default options for video upload
    const defaults = {
      fieldName: 'video',
      contentType: 'users',
      uploadType: 'single',
      maxCount: 1,
      compressionRatio: 90, // 10% compression
      compress: true
    };
    
    // Merge options with defaults
    const opts = { ...defaults, ...options };
    
    // Create uploader with specified options
    const upload = createUploader(
      opts.contentType, 
      opts.fieldName, 
      opts.uploadType, 
      opts.maxCount
    );
    
    // Upload and compress files (videos can also be compressed)
    await uploadAndCompress(req, res, upload, opts.compress, opts.compressionRatio);
    
    // Process uploaded files and return structured result
    if (req.file) {
      // Single file upload
      const response = createSuccessResponse(req.file, null, opts.contentType);
      return {
        success: true,
        file: response.data,
        files: [response.data]
      };
    } else if (req.files && Array.isArray(req.files)) {
      // Multiple file upload (array)
      const response = createMultipleSuccessResponse(req.files, [], opts.contentType);
      return {
        success: true,
        files: response.data.files
      };
    } else if (req.files && !Array.isArray(req.files)) {
      // Field-based multiple file upload
      const files = [];
      for (const fieldName in req.files) {
        req.files[fieldName].forEach(file => {
          const response = createSuccessResponse(file, null, opts.contentType);
          files.push(response.data);
        });
      }
      return {
        success: true,
        files: files
      };
    }
    
    // No files uploaded
    return {
      success: false,
      message: 'No files uploaded'
    };
  } catch (error) {
    throw new Error(`Video upload failed: ${error.message}`);
  }
};

/**
 * Upload audio with customizable options
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} options - Upload options
 * @param {string} options.fieldName - Form field name for the file (default: 'audio')
 * @param {string} options.contentType - Content type for folder organization (default: 'users')
 * @param {string} options.uploadType - Type of upload (single|array|fields) (default: 'single')
 * @param {number} options.maxCount - Max number of files for array/fields upload (default: 1)
 * @param {number} options.compressionRatio - Compression ratio 0-100 (default: 90 for 10% compression)
 * @param {boolean} options.compress - Whether to compress files (default: true)
 * @returns {Promise<Object>} - Upload result with file information
 */
const uploadAudio = async (req, res, options = {}) => {
  try {
    // Default options for audio upload
    const defaults = {
      fieldName: 'audio',
      contentType: 'users',
      uploadType: 'single',
      maxCount: 1,
      compressionRatio: 90, // 10% compression
      compress: true
    };
    
    // Merge options with defaults
    const opts = { ...defaults, ...options };
    
    // Create uploader with specified options
    const upload = createUploader(
      opts.contentType, 
      opts.fieldName, 
      opts.uploadType, 
      opts.maxCount
    );
    
    // Upload and compress files (audio compression not implemented yet)
    await uploadAndCompress(req, res, upload, opts.compress, opts.compressionRatio);
    
    // Process uploaded files and return structured result
    if (req.file) {
      // Single file upload
      const response = createSuccessResponse(req.file, null, opts.contentType);
      return {
        success: true,
        file: response.data,
        files: [response.data]
      };
    } else if (req.files && Array.isArray(req.files)) {
      // Multiple file upload (array)
      const response = createMultipleSuccessResponse(req.files, [], opts.contentType);
      return {
        success: true,
        files: response.data.files
      };
    } else if (req.files && !Array.isArray(req.files)) {
      // Field-based multiple file upload
      const files = [];
      for (const fieldName in req.files) {
        req.files[fieldName].forEach(file => {
          const response = createSuccessResponse(file, null, opts.contentType);
          files.push(response.data);
        });
      }
      return {
        success: true,
        files: files
      };
    }
    
    // No files uploaded
    return {
      success: false,
      message: 'No files uploaded'
    };
  } catch (error) {
    throw new Error(`Audio upload failed: ${error.message}`);
  }
};

/**
 * Upload multiple images
 * 
 * Convenience function for uploading multiple images with explicit defaults
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} options - Additional options to override defaults
 * @param {string} options.fieldName - Form field name ('images')
 * @param {string} options.contentType - Content type ('users')
 * @param {string} options.uploadType - Upload type ('array')
 * @param {number} options.maxCount - Max files (10)
 * @param {number} options.compressionRatio - Compression ratio (90)
 * @returns {Promise<Object>} - Upload result
 */
const uploadMultipleImages = async (req, res, options = {}) => {
  // Define the default options for multiple images
  const multipleImageDefaults = {
    fieldName: 'images',
    contentType: 'users',
    uploadType: 'array',
    maxCount: 10,
    compressionRatio: 90 // 10% compression
  };
  
  // Merge user-provided options with defaults (user options take precedence)
  const uploadOptions = { ...multipleImageDefaults, ...options };
  return await uploadImage(req, res, uploadOptions);
};

/**
 * Upload multiple videos
 * 
 * Convenience function for uploading multiple videos with explicit defaults
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} options - Additional options to override defaults
 * @param {string} options.fieldName - Form field name ('videos')
 * @param {string} options.contentType - Content type ('users')
 * @param {string} options.uploadType - Upload type ('array')
 * @param {number} options.maxCount - Max files (10)
 * @param {number} options.compressionRatio - Compression ratio (90)
 * @returns {Promise<Object>} - Upload result
 */
const uploadMultipleVideos = async (req, res, options = {}) => {
  // Explicitly define the default options for multiple videos
  const multipleVideoDefaults = {
    fieldName: 'videos',
    contentType: 'users',
    uploadType: 'array',
    maxCount: 10,
    compressionRatio: 90 // 10% compression
  };
  
  // Merge user-provided options with defaults
  const uploadOptions = { ...multipleVideoDefaults, ...options };
  return await uploadVideo(req, res, uploadOptions);
};

/**
 * Upload multiple audios
 * 
 * Convenience function for uploading multiple audios with explicit defaults
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} options - Additional options to override defaults
 * @param {string} options.fieldName - Form field name ('audios')
 * @param {string} options.contentType - Content type ('users')
 * @param {string} options.uploadType - Upload type ('array')
 * @param {number} options.maxCount - Max files (10)
 * @param {number} options.compressionRatio - Compression ratio (90)
 * @returns {Promise<Object>} - Upload result
 */
const uploadMultipleAudios = async (req, res, options = {}) => {
  // Explicitly define the default options for multiple audios
  const multipleAudioDefaults = {
    fieldName: 'audios',
    contentType: 'users',
    uploadType: 'array',
    maxCount: 10,
    compressionRatio: 90 // 10% compression
  };
  
  // Merge user-provided options with defaults
  const uploadOptions = { ...multipleAudioDefaults, ...options };
  return await uploadAudio(req, res, uploadOptions);
};

module.exports = {
  uploadImage,
  uploadVideo,
  uploadAudio,
  uploadMultipleImages,
  uploadMultipleVideos,
  uploadMultipleAudios
};