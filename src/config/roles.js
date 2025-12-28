// Role hierarchy and permissions configuration for Clinic Management System
const roles = {
  // Super admin - highest level (system administrator)
  super_admin: {
    permissions: ['all'],
    inherits: []
  },
  
  // Admin - clinic administrator with full access
  admin: {
    permissions: [
      'manage_users',
      'manage_admins',
      'manage_doctors',
      'manage_secretaries',
      'view_users',
      'view_admins',
      'view_doctors',
      'view_secretaries',
      'create_user',
      'update_user',
      'delete_user',
      'create_admin',
      'update_admin',
      'delete_admin',
      'create_doctor',
      'update_doctor',
      'delete_doctor',
      'create_secretary',
      'update_secretary',
      'delete_secretary'
    ],
    inherits: []
  },
  
  // Doctor - inherits all permissions from super_admin
  doctor: {
    permissions: [],
    inherits: ['super_admin']
  },
  
  // Secretary - can manage users (patients) but cannot delete
  secretary: {
    permissions: [
      'view_users',
      'update_own_profile',
      'manage_appointments_for_assigned_doctor',
      'view_medical_records',
      'manage_reviews_for_assigned_doctor',
      'manage_blog_posts',
      'manage_notifications_for_assigned_doctor'
    ],
    inherits: []
  },
  
  // Regular user (patient) - minimal access to own profile
  user: {
    permissions: [
      'update_own_profile',
      'view_own_profile'
    ],
    inherits: []
  }
};

// Function to check if a role has a specific permission
const hasPermission = (role, permission) => {
  if (!roles[role]) return false;
  
  // Check direct permissions
  if (roles[role].permissions.includes('all') || roles[role].permissions.includes(permission)) {
    return true;
  }
  
  // Check inherited permissions
  for (const inheritedRole of roles[role].inherits) {
    // If inherited role has 'all' permissions, then current role has all permissions
    if (roles[inheritedRole] && roles[inheritedRole].permissions.includes('all')) {
      return true;
    }
    // Recursively check inherited role permissions
    if (hasPermission(inheritedRole, permission)) {
      return true;
    }
  }
  
  return false;
};

// Function to check if a role has any of the required permissions
const hasAnyPermission = (role, requiredPermissions) => {
  return requiredPermissions.some(permission => hasPermission(role, permission));
};

module.exports = {
  roles,
  hasPermission,
  hasAnyPermission
};