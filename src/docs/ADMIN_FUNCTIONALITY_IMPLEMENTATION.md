# Admin Functionality Implementation

## Overview
This document describes the implementation of admin functionality in the Clinic Management System. The implementation includes creating a separate admin table, updating the OTP and token systems to support both users and admins, and adding dedicated admin routes and controllers.

## Changes Made

### 1. Database Schema Changes

#### New Admin Table
- Created a new `admins` table with the same structure as the `users` table
- Added a `role` column with a default value of 'admin'
- Maintained the same constraints as the users table (email/phone requirement)

#### Updated OTP Table
- Modified the `otp_codes` table to support both users and admins
- Added an `admin_id` column as a foreign key to the `admins` table
- Added a constraint to ensure either `user_id` or `admin_id` is set, but not both
- Updated indexes to include the new `admin_id` column

#### Updated Refresh Tokens Table
- Modified the `refresh_tokens` table to support both users and admins
- Added an `admin_id` column as a foreign key to the `admins` table
- Added a constraint to ensure either `user_id` or `admin_id` is set, but not both
- Updated indexes to include the new `admin_id` column

### 2. Model Changes

#### New Admin Model
- Created `Admin.js` model with the same structure as the User model
- Added proper validations and hooks for password encryption
- Set default role to 'admin'

#### Updated OTP Model
- Modified the OTP model to support both User and Admin relationships
- Added foreign key references for both user_id and admin_id
- Updated indexes to include both foreign keys

#### Updated RefreshToken Model
- Modified the RefreshToken model to support both User and Admin relationships
- Added foreign key references for both userId and adminId
- Updated associations to include both User and Admin models

### 3. Service Layer Changes

#### Updated OTP Service
- Modified `storeOTP` function to accept both user_id and admin_id parameters
- Modified `validateOTP` function to accept both user_id and admin_id parameters
- Updated functions to handle either user or admin based on which ID is provided
- Maintained backward compatibility with existing user functionality

#### Updated Token Service
- Modified token generation functions to handle both users and admins
- Added `userType` parameter to distinguish between users and admins
- Updated token verification to handle tokens for both user types
- Modified refresh token functionality to work with both user and admin tokens

#### New Admin Service
- Created `adminService.js` to handle admin-specific business logic
- Implemented functions for admin registration, login, and management
- Added proper error handling and validation

### 4. Controller Layer Changes

#### Updated Auth Controller
- Modified OTP-related functions to pass null for admin_id when dealing with users
- Maintained backward compatibility with existing user functionality

#### New Admin Controller
- Created `adminController.js` with functions for admin registration, login, and logout
- Implemented OTP functionality specifically for admins
- Added proper validation and error handling

### 5. Route Layer Changes

#### New Admin Routes
- Created `admin.routes.js` with routes for admin registration, login, logout, and OTP functionality
- Added proper Swagger documentation for all admin endpoints
- Implemented the same image upload functionality as user registration

### 6. Middleware Changes

#### Updated Auth Middleware
- Modified the `protect` middleware to handle both users and admins
- Added logic to determine user type based on the token role
- Updated request object to include userType information

### 7. API Structure Changes

#### Updated API Index Files
- Modified both v1 and v2 API index files to include admin routes
- Maintained backward compatibility with existing API structure

#### Updated Main Application File
- Added admin routes to the main application
- Updated welcome screen to include admin endpoints information

### 8. Documentation Changes

#### Updated Swagger Documentation
- Added comprehensive documentation for all admin endpoints
- Created new schemas for Admin and AdminAuthResponse
- Maintained existing user documentation

## Key Features

### 1. Role-Based Access Control
- Admins have a dedicated role ('admin') in their records
- Authentication middleware distinguishes between users and admins
- Authorization middleware can restrict access based on roles

### 2. Separate but Similar Functionality
- Admins have the same functionality as users (registration, login, OTP, etc.)
- Admins have their own separate tables and routes
- Shared services and utilities are used where appropriate

### 3. Backward Compatibility
- All existing user functionality remains unchanged
- No breaking changes to existing APIs
- Existing tokens and OTP codes continue to work as before

### 4. Security
- Admin passwords are encrypted using the same bcrypt implementation as users
- Token generation and validation works the same way for both users and admins
- OTP functionality is identical for both user types

## Usage Examples

### Admin Registration
```bash
curl -X POST http://localhost:3000/api/admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Dr. Smith",
    "email": "dr.smith@clinic.com",
    "password": "securepassword123",
    "phone": "+1234567890"
  }'
```

### Admin Login
```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dr.smith@clinic.com",
    "password": "securepassword123"
  }'
```

### Admin Logout
```bash
curl -X POST http://localhost:3000/api/admin/logout \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Future Enhancements

1. **Admin-Specific Endpoints**: Add endpoints for admin-specific functionality like managing users, viewing reports, etc.
2. **Role Hierarchy**: Implement a more complex role hierarchy (e.g., doctor, secretary, super-admin)
3. **Admin Dashboard**: Create dedicated admin dashboard endpoints
4. **Audit Logging**: Add logging for admin actions
5. **Permission System**: Implement fine-grained permissions for different admin roles

## Migration Notes

When deploying these changes, ensure to run the new migration scripts:
1. Create the `admins` table
2. Update the `otp_codes` table structure
3. Update the `refresh_tokens` table structure

The existing data in `users`, `otp_codes`, and `refresh_tokens` tables will remain compatible with the updated schema.