/**
 * API Index File
 * 
 * This file manages API versioning and provides a centralized way to switch
 * between different API versions. It exports the current active API version
 * based on environment configuration or other criteria.
 */

// Get the current API version from environment variables or default to v1
const currentVersion = process.env.API_VERSION || 'v1';

// Import all API versions
const v1 = require('./v1');
const v2 = require('./v2');

// Map versions to their respective modules
const apiVersions = {
  v1,
  v2
};

// Export the current active API version
const getCurrentApi = () => {
  return apiVersions[currentVersion] || apiVersions.v1;
};

// Export individual versions for explicit access
module.exports = {
  v1,
  v2,
  current: getCurrentApi(),
  // Utility function to get a specific version
  getVersion: (version) => apiVersions[version] || apiVersions.v1
};