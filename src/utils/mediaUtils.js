/**
 * Media Utilities
 * 
 * This module provides utility functions for handling media paths and URLs for both images and videos.
 */

const path = require('path');

/**
 * Build media URL from filename
 * @param {string} filename - Media filename
 * @param {string} mediaType - Media type ('images', 'videos', or 'audios')
 * @param {string} contentType - Content type (default: 'users')
 * @returns {string|null} - Full media URL or null if filename is null
 */
const buildMediaUrl = (filename, mediaType = 'images', contentType = 'users') => {
  if (!filename) return null;
  
  // Get domain from environment variables
  const domain = process.env.DOMAIN || 'http://localhost:3000';
  
  // Remove any leading slashes from filename to avoid double slashes
  const cleanFilename = filename.startsWith('/') ? filename.substring(1) : filename;
  
  return `${domain}/public/uploads/${mediaType}/${contentType}/${cleanFilename}`;
};

/**
 * Build image URL from filename
 * @param {string} filename - Image filename
 * @param {string} contentType - Content type (default: 'users')
 * @returns {string|null} - Full image URL or null if filename is null
 */
const buildImageUrl = (filename, contentType = 'users') => {
  return buildMediaUrl(filename, 'images', contentType);
};

/**
 * Build video URL from filename
 * @param {string} filename - Video filename
 * @param {string} contentType - Content type (default: 'users')
 * @returns {string|null} - Full video URL or null if filename is null
 */
const buildVideoUrl = (filename, contentType = 'users') => {
  return buildMediaUrl(filename, 'videos', contentType);
};

/**
 * Extract filename from full path
 * @param {string} fullPath - Full path to file
 * @returns {string} - Filename with extension
 */
const extractFilename = (fullPath) => {
  if (!fullPath) return null;
  return path.basename(fullPath);
};

/**
 * Determine media type from file extension
 * @param {string} filename - Filename with extension
 * @returns {string} - Media type ('images', 'videos', or 'audios')
 */
const getMediaType = (filename) => {
  if (!filename) return 'images';
  
  const ext = path.extname(filename).toLowerCase();
  const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'];
  const audioExtensions = ['.mp3', '.wav', '.aac', '.ogg', '.flac', '.webm'];
  
  if (videoExtensions.includes(ext)) return 'videos';
  if (audioExtensions.includes(ext)) return 'audios';
  return 'images';
};

module.exports = {
  buildMediaUrl,
  buildImageUrl,
  buildVideoUrl,
  extractFilename,
  getMediaType
};