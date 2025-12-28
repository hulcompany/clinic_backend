/**
 * Media Cleanup Utilities
 * 
 * This module provides utility functions for cleaning up old media files
 * when updating entities with new media.
 */

const path = require('path');
const { deleteFile } = require('./mediaHelper');

/**
 * Handle media update cleanup - delete old media file when replacing with new one
 * @param {Object} options - Cleanup options
 * @param {string} options.oldFilename - Filename of old media file
 * @param {string} options.newFilename - Filename of new media file
 * @param {string} options.contentType - Content type (users, admins, etc.)
 * @param {string} options.mediaType - Media type (images, videos)
 * @returns {Promise<Object>} - Cleanup result
 */
const handleMediaUpdate = async ({ oldFilename, newFilename, contentType = 'users', mediaType = 'images' }) => {
  try {
    console.log('Media cleanup called with:', { oldFilename, newFilename, contentType, mediaType });
    
    // If old and new filenames are the same, no cleanup needed
    if (oldFilename === newFilename) {
      console.log('No cleanup needed - same file');
      return {
        success: true,
        message: "No cleanup needed - same file"
      };
    }
    
    // Construct full path to old file
    // The path structure is: public/uploads/{mediaType}/{contentType}/{filename}
    const fullPath = path.join(__dirname, `../../public/uploads/${mediaType}/${contentType}/${oldFilename}`);
    console.log('Full path to old file:', fullPath);
    
    // Delete the old file
    const result = await deleteFile(fullPath);
    console.log('Delete file result:', result);
    
    return result;
  } catch (error) {
    console.error('Media cleanup error:', error);
    return {
      success: false,
      message: "Failed to cleanup old media",
      error: error.message
    };
  }
};

/**
 * Handle multiple media updates cleanup
 * @param {Object} options - Cleanup options
 * @param {Array} options.oldPaths - Array of relative paths to old media files
 * @param {Array} options.newPaths - Array of relative paths to new media files
 * @param {string} options.contentType - Content type for folder organization (services, contact, etc.)
 * @param {string} options.mediaType - Media type (images, videos, etc.)
 * @returns {Promise<Array>} - Array of cleanup results
 */
const handleMultipleMediaUpdates = async ({ oldPaths = [], newPaths = [], contentType = 'images', mediaType = 'images' }) => {
  try {
    const results = [];
    
    // Delete old files that are not in the new paths
    for (const oldPath of oldPaths) {
      // Extract filename from oldPath (could be string or object with filename property)
      const oldFilename = typeof oldPath === 'string' ? oldPath : (oldPath.filename || oldPath);
      
      // Check if this old filename is in the new paths
      if (!newPaths.includes(oldFilename)) {
        const fullPath = path.join(__dirname, '../../public/uploads/', mediaType, contentType, oldFilename);
        const result = await deleteFile(fullPath);
        results.push(result);
      }
    }
    
    return results;
  } catch (error) {
    throw new Error(`Failed to cleanup multiple media: ${error.message}`);
  }
};

/**
 * Generic function to clean up a media file for any entity
 * @param {Object} entity - Entity object containing media field
 * @param {string} mediaField - Name of the field containing the media filename
 * @param {string} contentType - Content type for folder organization (services, contact, etc.)
 * @param {string} mediaType - Media type (images, videos, etc.)
 * @returns {Promise<Object>} - Cleanup result
 */
const cleanupEntityMedia = async (entity, mediaField = 'image', contentType = 'images', mediaType = 'images') => {
  try {
    console.log('cleanupEntityMedia called with:', { entity: entity ? entity.toJSON() : null, mediaField, contentType, mediaType });
    
    // Check if entity has the specified media field
    if (!entity || !entity[mediaField]) {
      console.log('No media to cleanup for entity');
      return {
        success: true,
        message: "No media to cleanup"
      };
    }

    console.log('Entity media field value:', entity[mediaField]);
    
    const mediaValue = entity[mediaField];
    
    // Handle both single file and array of files
    if (Array.isArray(mediaValue)) {
      // Handle array of files (like medical_attachments)
      const results = [];
      for (const file of mediaValue) {
        let filename;
        
        // Handle both string filenames and file objects (including full file details)
        if (typeof file === 'string') {
          filename = file;
        } else if (file && typeof file === 'object' && file.filename) {
          filename = file.filename;
        } else if (file && typeof file === 'object' && file.path) {
          // For full file objects with path property
          filename = path.basename(file.path);
        } else {
          console.log('Skipping invalid file object:', file);
          continue;
        }
        
        // Construct full path to media file
        const fullPath = path.join(__dirname, `../../public/uploads/${mediaType}/${contentType}/${filename}`);
        console.log('Full path to delete:', fullPath);
        
        const result = await deleteFile(fullPath);
        results.push(result);
        console.log('Delete file result:', result);
      }
      
      // Return overall success based on results
      const allSuccess = results.every(result => result.success);
      return {
        success: allSuccess,
        message: allSuccess ? "All media files cleaned up successfully" : "Some media files failed to clean up",
        results: results
      };
    } else {
      // Handle single file (traditional behavior)
      // Construct full path to entity media
      // The path structure is: public/uploads/{mediaType}/{contentType}/{filename}
      const fullPath = path.join(__dirname, `../../public/uploads/${mediaType}/${contentType}/${mediaValue}`);
      console.log('Full path to delete:', fullPath);
      
      // Delete the file
      const result = await deleteFile(fullPath);
      console.log('Delete file result:', result);
      
      return result;
    }
  } catch (error) {
    console.error(`Entity media cleanup error for ${contentType}:`, error);
    return {
      success: false,
      message: `Failed to cleanup ${contentType} media`,
      error: error.message
    };
  }
};

/**
 * Clean up media files for multiple entities
 * @param {Array} entities - Array of entity objects
 * @param {string} mediaField - Name of the field containing the media filename
 * @param {string} contentType - Content type for folder organization (services, contact, etc.)
 * @param {string} mediaType - Media type (images, videos, etc.)
 * @returns {Promise<Array>} - Array of cleanup results
 */
const cleanupMultipleEntityMedia = async (entities, mediaField = 'image', contentType = 'images', mediaType = 'images') => {
  try {
    const results = [];
    
    for (const entity of entities) {
      const result = await cleanupEntityMedia(entity, mediaField, contentType, mediaType);
      results.push(result);
    }
    
    return results;
  } catch (error) {
    throw new Error(`Failed to cleanup multiple ${contentType} media: ${error.message}`);
  }
};

module.exports = {
  handleMediaUpdate,
  handleMultipleMediaUpdates,
  cleanupEntityMedia,
  cleanupMultipleEntityMedia
};