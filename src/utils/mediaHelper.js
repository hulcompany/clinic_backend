/**
 * Media Helper for Clinic Management System
 * 
 * This module provides utilities for handling file uploads with automatic compression
 * for both images and videos. It supports various file types and includes features
 * like file validation, compression, and secure storage.
 * 
 * Features:
 * - Image and video upload with automatic compression
 * - Configurable compression ratios (default 10%)
 * - File type validation and filtering
 * - Secure file storage with unique naming
 * - Error handling and detailed response formats
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Allowed file extensions and MIME types
const ALLOWED_EXTENSIONS = {
  // Images
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  
  // Videos
  'video/mp4': 'mp4',
  'video/avi': 'avi',
  'video/mov': 'mov',
  'video/wmv': 'wmv',
  'video/flv': 'flv',
  'video/webm': 'webm',
  'video/mkv': 'mkv',
  
  // Audio
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/aac': 'aac',
  'audio/ogg': 'ogg',
  'audio/webm': 'webm',
  'audio/flac': 'flac'
};

// Default image compression settings (10% compression by default)
const DEFAULT_IMAGE_COMPRESSION_SETTINGS = {
  jpeg: {
    quality: 90, // 10% compression (90% quality)
    progressive: true,
    mozjpeg: true
  },
  png: {
    quality: 90, // 10% compression (90% quality)
    progressive: true,
    compressionLevel: 3 // Lower compression level for 10% compression
  },
  webp: {
    quality: 90, // 10% compression (90% quality)
    lossless: false,
    nearLossless: true
  },
  resize: {
    maxWidth: 1920,
    maxHeight: 1080,
    fit: 'inside',
    withoutEnlargement: true
  }
};

/**
 * Create folder if it doesn't exist
 * @param {string} folderPath - Path to the folder
 */
const createFolderIfNotExists = (folderPath) => {
  try {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Get upload path based on content type
 * @param {string} contentType - Type of content (users, patients, etc.)
 * @param {string} fileType - Type of file (images, videos)
 * @returns {string} - Upload path
 */
const getUploadPath = (contentType, fileType) => {
  return `public/uploads/${fileType}/${contentType}/`;
};

/**
 * Get relative upload path for database storage
 * @param {string} contentType - Type of content (users, patients, etc.)
 * @param {string} fileType - Type of file (images, videos)
 * @returns {string} - Relative path for database storage
 */
const getRelativeUploadPath = (contentType, fileType) => {
  return `uploads/${fileType}/${contentType}/`;
};

/**
 * Sanitize filename by removing special characters
 * @param {string} filename - Original filename
 * @returns {string} - Sanitized filename
 */
const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

/**
 * Compress image using Sharp with configurable compression ratio
 * @param {string} inputPath - Path to original image
 * @param {string} outputPath - Path to compressed image
 * @param {string} format - Image format (jpg, png, webp)
 * @param {number} compressionRatio - Compression ratio (0-100, where 100 is no compression)
 * @returns {Promise<Object>} - Compression result
 */
const compressImage = async (inputPath, outputPath, format = 'jpg', compressionRatio = 90) => {
  try {
    const originalStats = fs.statSync(inputPath);
    const originalSize = originalStats.size;

    // Adjust compression settings based on ratio
    let compressionOptions = {};
    
    // Ensure compression ratio is between 10-100
    const quality = Math.max(10, Math.min(100, compressionRatio));
    
    switch (format.toLowerCase()) {
      case 'jpg':
      case 'jpeg':
        compressionOptions = {
          quality: quality,
          progressive: true,
          mozjpeg: true
        };
        break;
      case 'png':
        compressionOptions = {
          quality: quality,
          progressive: true,
          compressionLevel: Math.round((100 - quality) / 10) // Convert quality to compression level (0-9)
        };
        break;
      case 'webp':
        compressionOptions = {
          quality: quality,
          lossless: false,
          nearLossless: true
        };
        break;
      default:
        compressionOptions = {
          quality: quality,
          progressive: true,
          mozjpeg: true
        };
    }
    
    const resizeOptions = DEFAULT_IMAGE_COMPRESSION_SETTINGS.resize;

    // Compress image
    await sharp(inputPath)
      .resize({
        width: resizeOptions.maxWidth,
        height: resizeOptions.maxHeight,
        fit: resizeOptions.fit,
        withoutEnlargement: resizeOptions.withoutEnlargement
      })
      .toFormat(format, compressionOptions)
      .toFile(outputPath);

    // Calculate compression ratio
    const compressedStats = fs.statSync(outputPath);
    const compressedSize = compressedStats.size;
    const actualCompressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);
    
    // Delete original file
    fs.unlinkSync(inputPath);

    return {
      success: true,
      originalSize,
      compressedSize,
      compressionRatio: `${actualCompressionRatio}%`,
      quality: quality,
      outputPath
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Compress file based on type with configurable compression ratio
 * @param {Object} file - Uploaded file object
 * @param {number} compressionRatio - Compression ratio (default 10% compression)
 * @returns {Promise<Object>} - Compression result
 */
const compressFile = async (file, compressionRatio = 90) => {
  try {
    // Validate file object
    if (!file || !file.mimetype || !file.path) {
      return {
        success: false,
        error: 'Invalid file object or missing required properties'
      };
    }
    
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');
    const isAudio = file.mimetype.startsWith('audio/');
    
    if (!isImage && !isVideo && !isAudio) {
      return {
        success: false,
        error: 'Unsupported file type for compression'
      };
    }

    const inputPath = file.path;
    
    // Check if file exists
    if (!fs.existsSync(inputPath)) {
      return {
        success: false,
        error: `File not found at path: ${inputPath}`
      };
    }
    
    const extension = ALLOWED_EXTENSIONS[file.mimetype] || 'file';
    const filename = file.filename || path.basename(inputPath);
    const compressedFilename = `compressed-${filename}`;
    const outputPath = path.join(path.dirname(inputPath), compressedFilename);

    // Compress image with specified ratio
    if (isImage) {
      const result = await compressImage(inputPath, outputPath, extension, compressionRatio);
      return result;
    }
    
    // For videos, we'll just rename for now (video compression would require ffmpeg)
    if (isVideo) {
      fs.renameSync(inputPath, outputPath);
      return {
        success: true,
        message: 'Video uploaded (compression not implemented)',
        outputPath
      };
    }
    
    // For audio files, we'll just rename for now (audio compression would require ffmpeg)
    if (isAudio) {
      fs.renameSync(inputPath, outputPath);
      return {
        success: true,
        message: 'Audio uploaded (compression not implemented)',
        outputPath
      };
    }
    
    return {
      success: false,
      error: 'Unknown error in compression'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Unified file upload handler
 * @param {string} contentType - Content type (users, patients, etc.)
 * @param {string} fieldName - Field name in form data
 * @param {string} uploadType - Type of upload (single, multiple)
 * @param {number} maxCount - Maximum number of files (for multiple uploads)
 * @returns {Object} - Multer upload middleware
 */
const createUploader = (contentType, fieldName, uploadType = 'single', maxCount = 1) => {
  // Create custom storage
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      // Determine file type and appropriate folder
      let fileType = '';
      
      if (file.mimetype.startsWith('image/')) {
        fileType = 'images';
      } else if (file.mimetype.startsWith('video/')) {
        fileType = 'videos';
      } else if (file.mimetype.startsWith('audio/')) {
        fileType = 'audios';
      }
      
      // Create upload folder path
      const uploadFolder = getUploadPath(contentType, fileType);
      
      // Create folder if it doesn't exist
      createFolderIfNotExists(uploadFolder);
      
      // Return folder path
      cb(null, uploadFolder);
    },
    
    filename: function (req, file, cb) {
      // Get original filename without extension
      const originalName = path.parse(file.originalname).name;
      
      // Sanitize filename
      const cleanName = sanitizeFilename(originalName);
      
      // Get appropriate extension
      const extension = ALLOWED_EXTENSIONS[file.mimetype] || 'file';
      
      // Create unique filename
      const uniqueName = `${cleanName}-${Date.now()}.${extension}`;
      
      // Return final filename
      cb(null, uniqueName);
    }
  });

  // File filter
  const filter = (req, file, cb) => {
    // Check if file type is allowed
    const isValid = ALLOWED_EXTENSIONS[file.mimetype];
    
    if (!isValid) {
      const error = new Error(`Invalid file type!\nFile type: ${file.mimetype}\nAllowed types: ${Object.keys(ALLOWED_EXTENSIONS).join(', ')}`);
      error.code = 'INVALID_FILE_TYPE';
      return cb(error, false);
    }
    
    // Accept file if type is valid
    cb(null, true);
  };

  // Create multer instance based on upload type
  const multerInstance = multer({
    storage: storage,
    fileFilter: filter,
    limits: {
      fileSize: 100 * 1024 * 1024, // 100 MB max
      files: 10 // Max 10 files per request
    }
  });

  // Return appropriate middleware based on upload type
  switch (uploadType) {
    case 'single':
      return multerInstance.single(fieldName);
    case 'array':
      return multerInstance.array(fieldName, maxCount);
    case 'fields':
      return multerInstance.fields([{ name: fieldName, maxCount: maxCount }]);
    default:
      return multerInstance.single(fieldName);
  }
};

/**
 * Handle upload errors
 * @param {Error} error - Error object
 * @returns {Object} - Formatted error response
 */
const handleUploadError = (error) => {
  let message = 'An error occurred while uploading the file. Please check your file and try again.';
  let statusCode = 400;
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    message = 'File size is too large. Maximum allowed size is 100MB. Please compress your file or choose a smaller one.';
    statusCode = 413;
  } else if (error.code === 'LIMIT_FILE_COUNT') {
    message = 'Too many files uploaded. Please reduce the number of files and try again.';
    statusCode = 413;
  } else if (error.code === 'INVALID_FILE_TYPE') {
    message = 'Invalid file type. Please upload only images (JPG, PNG, GIF, WEBP), videos (MP4, AVI, MOV, WMV, FLV, WEBM, MKV), or audio files (MP3, WAV, AAC, OGG, FLAC).';
    statusCode = 400;
  } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    message = 'Unexpected field in form data. Please check your form fields and file inputs.';
    statusCode = 400;
  }
  
  return {
    success: false,
    message: message,
    statusCode: statusCode,
    error: error.message
  };
};

/**
 * Create success response for file upload
 * @param {Object} file - Uploaded file object
 * @param {Object} compressionInfo - Compression information
 * @param {string} contentType - Content type for path calculation
 * @returns {Object} - Formatted success response
 */
const createSuccessResponse = (file, compressionInfo = null, contentType = 'users') => {
  // Determine file type
  const isImage = file.mimetype && file.mimetype.startsWith('image/');
  const isAudio = file.mimetype && file.mimetype.startsWith('audio/');
  const fileType = isImage ? 'images' : (isAudio ? 'audios' : 'videos');
  
  // Get relative path for database storage (filename only)
  const relativePath = `${getRelativeUploadPath(contentType, fileType)}${file.filename}`;
  
  const response = {
    success: true,
    message: 'File uploaded successfully',
    data: {
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: relativePath, // Store relative path for database
      url: `/public/uploads/${fileType}/${contentType}/${file.filename}`
    }
  };

  // Add compression info if available
  if (compressionInfo && compressionInfo.success) {
    response.data.compression = {
      originalSize: compressionInfo.originalSize,
      compressedSize: compressionInfo.compressedSize,
      compressionRatio: compressionInfo.compressionRatio,
      quality: compressionInfo.quality
    };
    response.message = 'File uploaded and compressed successfully';
  }

  return response;
};

/**
 * Create success response for multiple file uploads
 * @param {Array} files - Array of uploaded files
 * @param {Array} compressionResults - Array of compression results
 * @param {string} contentType - Content type for path calculation
 * @returns {Object} - Formatted success response
 */
const createMultipleSuccessResponse = (files, compressionResults = [], contentType = 'users') => {
  const uploadedFiles = files.map((file, index) => {
    // Determine file type
    const isImage = file.mimetype && file.mimetype.startsWith('image/');
    const isAudio = file.mimetype && file.mimetype.startsWith('audio/');
    const fileType = isImage ? 'images' : (isAudio ? 'audios' : 'videos');
    
    // Get relative path for database storage (filename only)
    const relativePath = `${getRelativeUploadPath(contentType, fileType)}${file.filename}`;
    
    const fileData = {
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: relativePath, // Store relative path for database
      url: `/public/uploads/${fileType}/${contentType}/${file.filename}`
    };

    // Add compression info if available
    if (compressionResults[index] && compressionResults[index].success) {
      fileData.compression = {
        originalSize: compressionResults[index].originalSize,
        compressedSize: compressionResults[index].compressedSize,
        compressionRatio: compressionResults[index].compressionRatio,
        quality: compressionResults[index].quality
      };
    }

    return fileData;
  });
  
  const compressedCount = compressionResults.filter(result => result && result.success).length;
  const message = compressedCount > 0 
    ? `${files.length} files uploaded and ${compressedCount} compressed successfully`
    : `${files.length} files uploaded successfully`;
  
  return {
    success: true,
    message: message,
    data: {
      count: files.length,
      compressedCount,
      files: uploadedFiles
    }
  };
};

/**
 * Delete file from filesystem
 * @param {string} filePath - Path to file
 * @returns {Promise<Object>} - Deletion result
 */
const deleteFile = async (filePath) => {
  try {
    console.log('=== DELETE FILE FUNCTION START ===');
    console.log('Attempting to delete file:', filePath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('File not found for deletion:', filePath);
      console.log('Current working directory:', process.cwd());
      console.log('File directory exists:', fs.existsSync(path.dirname(filePath)));
      console.log('=== DELETE FILE FUNCTION END (FILE NOT FOUND) ===');
      return {
        success: false,
        message: "File not found",
        error: "File does not exist",
        filePath: filePath
      };
    }

    // Delete file
    await fs.promises.unlink(filePath);
    console.log('File deleted successfully:', filePath);
    console.log('=== DELETE FILE FUNCTION END (SUCCESS) ===');
    
    return {
      success: true,
      message: "File deleted successfully",
      deletedPath: filePath
    };
  } catch (error) {
    console.error('Error deleting file:', filePath, error);
    console.log('=== DELETE FILE FUNCTION END (ERROR) ===');
    return {
      success: false,
      message: "Failed to delete file",
      error: error.message,
      filePath: filePath
    };
  }
};

/**
 * Upload and compress files with unified interface and configurable compression
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} uploadMiddleware - Multer upload middleware
 * @param {boolean} compress - Whether to compress files
 * @param {number} compressionRatio - Compression ratio (0-100, where 100 is no compression, default 90)
 * @returns {Promise} - Promise that resolves when upload is complete
 */
const uploadAndCompress = async (req, res, uploadMiddleware, compress = true, compressionRatio = 90) => {
  return new Promise((resolve, reject) => {
    // Execute upload middleware
    uploadMiddleware(req, res, async (err) => {
      if (err) {
        return reject(err);
      }
      
      // If compression is not required, return immediately
      if (!compress) {
        return resolve({ compressed: false });
      }
      
      try {
        // Compress single file
        if (req.file) {
          const compressResult = await compressFile(req.file, compressionRatio);
          
          if (compressResult.success) {
            // Update file path and filename after compression
            req.file.path = compressResult.outputPath;
            req.file.size = compressResult.compressedSize;
            // Update filename to match the compressed file
            req.file.filename = path.basename(compressResult.outputPath);
          }
          
          return resolve({ compressed: true, singleFile: true, result: compressResult });
        }
        
        // Compress multiple files
        if (req.files && Array.isArray(req.files)) {
          const compressResults = [];
          
          for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const compressResult = await compressFile(file, compressionRatio);
            compressResults.push(compressResult);
            
            if (compressResult.success) {
              // Update file path and filename after compression
              req.files[i].path = compressResult.outputPath;
              req.files[i].size = compressResult.compressedSize;
              // Update filename to match the compressed file
              req.files[i].filename = path.basename(compressResult.outputPath);
            }
          }
          
          return resolve({ compressed: true, multipleFiles: true, results: compressResults });
        }
        
        // Handle field-based multiple files
        if (req.files && !Array.isArray(req.files)) {
          const compressResults = {};
          
          for (const fieldName in req.files) {
            compressResults[fieldName] = [];
            
            for (let i = 0; i < req.files[fieldName].length; i++) {
              const file = req.files[fieldName][i];
              const compressResult = await compressFile(file, compressionRatio);
              compressResults[fieldName].push(compressResult);
              
              if (compressResult.success) {
                // Update file path and filename after compression
                req.files[fieldName][i].path = compressResult.outputPath;
                req.files[fieldName][i].size = compressResult.compressedSize;
                // Update filename to match the compressed file
                req.files[fieldName][i].filename = path.basename(compressResult.outputPath);
              }
            }
          }
          
          return resolve({ compressed: true, fieldFiles: true, results: compressResults });
        }
        
        // No files uploaded
        return resolve({ compressed: false, noFiles: true });
        
      } catch (error) {
        // Return without compression in case of error
        return resolve({ compressed: false, error: error.message });
      }
    });
  });
};

// Export all functions
module.exports = {
  // Unified upload handler
  createUploader,
  uploadAndCompress,
  
  // Utility functions
  handleUploadError,
  createSuccessResponse,
  createMultipleSuccessResponse,
  deleteFile,
  
  // Compression functions
  compressFile,
  compressImage,
  
  // Helper functions
  getUploadPath,
  getRelativeUploadPath,
  createFolderIfNotExists,
  
  // Constants
  ALLOWED_EXTENSIONS,
  DEFAULT_IMAGE_COMPRESSION_SETTINGS
};