# Roles and Permissions System

## Overview
This document describes the role-based access control (RBAC) system implemented in the clinic management system. The system provides granular permission control while maintaining flexibility and scalability.

## Role Hierarchy

### 1. Super Admin
- **Description**: Highest level of access in the system
- **Purpose**: System administrator with unrestricted access
- **Permissions**: All permissions (`permissions: ['all']`)
- **Inherits**: None

### 2. Admin
- **Description**: Clinic administrator with comprehensive management capabilities
- **Purpose**: Manage clinic operations, staff, and patients
- **Permissions**: 
  - Manage all users (patients)
  - Manage all admin roles (doctors, secretaries)
  - Full CRUD operations on all entities
- **Inherits**: None

### 3. Doctor
- **Description**: Medical professional with patient care responsibilities
- **Purpose**: Access and manage patient records and medical information
- **Permissions**: Inherits all permissions from Super Admin
- **Inherits**: Super Admin

### 4. Secretary
- **Description**: Administrative staff supporting clinic operations
- **Purpose**: Handle patient registrations, appointments, and basic administrative tasks
- **Permissions**:
  - View all users (patients)
  - Create and update user information
  - Update own profile
  - Manage appointments for assigned doctor
  - View doctor's availability
- **Inherits**: None
- **Relationship**: Can be assigned to a specific doctor

### 5. User (Patient)
- **Description**: Patient accessing their personal health information
- **Purpose**: Manage personal profile and view own medical records
- **Permissions**:
  - Update own profile
  - View own profile
- **Inherits**: None

## Implementation Logic

### Permission Checking Process
1. **Direct Permission Check**: First, check if the role has the required permission directly
2. **Inheritance Check**: If not found, recursively check all inherited roles
3. **Super Permission**: If any role in the inheritance chain has `permissions: ['all']`, grant access

### Code Implementation

#### Role Configuration (`src/config/roles.js`)
```javascript
const roles = {
  super_admin: {
    permissions: ['all'],
    inherits: []
  },
  doctor: {
    permissions: [],
    inherits: ['super_admin'] // Inherits all permissions
  }
};
```

#### Permission Checking Function
```javascript
const hasPermission = (role, permission) => {
  if (!roles[role]) return false;
  
  // Check direct permissions
  if (roles[role].permissions.includes('all') || 
      roles[role].permissions.includes(permission)) {
    return true;
  }
  
  // Check inherited permissions
  for (const inheritedRole of roles[role].inherits) {
    if (hasPermission(inheritedRole, permission)) {
      return true;
    }
  }
  
  return false;
};
```

#### Middleware Usage
```javascript
// In routes
router.get('/users', 
  authMiddleware.protect, 
  authMiddleware.permit('view_users'), 
  getUsers
);
```

## Programmatic Usage

### 1. Defining Routes with Permissions
```javascript
// Allow doctors and admins to view users
router.get('/users', 
  authMiddleware.protect, 
  authMiddleware.permit('view_users'), 
  getUsers
);

// Allow only admins to delete users
router.delete('/users/:id', 
  authMiddleware.protect, 
  authMiddleware.permit('delete_user'), 
  deleteUser
);
```

### 2. Adding New Roles
To add a new role, simply extend the `roles` object:
```javascript
const roles = {
  // ... existing roles
  nurse: {
    permissions: [
      'view_users',
      'update_patient_vitals',
      'update_own_profile'
    ],
    inherits: []
  }
};
```

### 3. Adding Inheritance
To make a role inherit from another:
```javascript
const roles = {
  // ... existing roles
  nurse: {
    permissions: [],
    inherits: ['doctor'] // Nurse inherits all doctor permissions
  }
};
```

## Benefits of This Approach

1. **Flexibility**: Easy to modify permissions without changing route definitions
2. **Scalability**: Simple to add new roles and inheritance relationships
3. **Maintainability**: Centralized role management in one configuration file
4. **Security**: Granular control over who can access what functionality
5. **Clarity**: Clear intent in route definitions using permission names

## Best Practices

1. **Use Descriptive Permission Names**: Use clear, action-oriented permission names like `view_users`, `create_admin`, etc.
2. **Leverage Inheritance**: Use inheritance to avoid duplicating permissions
3. **Regular Review**: Periodically review role permissions to ensure they align with business requirements
4. **Principle of Least Privilege**: Grant only the minimum permissions required for each role
5. **Documentation**: Keep this document updated as roles and permissions evolve

## Future Enhancements

1. **Dynamic Role Management**: Allow administrators to modify roles through the UI
2. **Permission Groups**: Group related permissions for easier management
3. **Audit Logging**: Track permission changes and access attempts
4. **Time-based Permissions**: Permissions that are only valid during certain hours or dates
5. **Conditional Permissions**: Permissions that depend on additional context (e.g., department, location)