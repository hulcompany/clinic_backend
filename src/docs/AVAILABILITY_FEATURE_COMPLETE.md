# Secretary Availability Management - Complete Documentation

## Overview
This document provides comprehensive documentation for the implementation of functionality that allows secretaries to manage their assigned doctor's availability slots (create, update, delete) and cancel bookings for the doctor.

The availability feature allows doctors and secretaries to define their available time slots for appointments. Users can then browse and book these slots. This system supports both time-range slots (e.g., 16:30-17:45) and single-time slots (e.g., 14:15).

## Database Schema

### availability Table
```sql
CREATE TABLE availability (
  id INT PRIMARY KEY AUTO_INCREMENT,
  admin_id INT NOT NULL COMMENT 'Foreign key to admins table (doctor/secretary)',
  date DATE NOT NULL COMMENT 'Date of availability',
  start_time TIME NOT NULL COMMENT 'Start time of availability slot',
  end_time TIME NULL DEFAULT NULL COMMENT 'End time of availability slot (NULL for single time)',
  is_booked BOOLEAN DEFAULT FALSE COMMENT 'Whether this slot is booked',
  booked_by_user_id INT NULL DEFAULT NULL COMMENT 'User who booked this slot',
  status ENUM('available', 'unavailable', 'cancelled') DEFAULT 'available' COMMENT 'Status of the availability slot',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (admin_id) REFERENCES admins(user_id) ON DELETE CASCADE,
  FOREIGN KEY (booked_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  
  INDEX idx_admin_date (admin_id, date),
  INDEX idx_is_booked (is_booked),
  INDEX idx_status (status),
  INDEX idx_booked_by_user (booked_by_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Availability slots for doctors/secretaries';
```

## Data Models

### Availability (Model)
- `id` (Integer) - Unique identifier
- `admin_id` (Integer) - Reference to doctor/secretary
- `date` (Date) - Date of the availability slot
- `start_time` (Time) - Start time of the slot
- `end_time` (Time, nullable) - End time of the slot (null for single time slots)
- `is_booked` (Boolean) - Whether the slot is booked
- `booked_by_user_id` (Integer, nullable) - User who booked the slot
- `status` (Enum) - Slot status: 'available', 'unavailable', 'cancelled'
- `created_at` (DateTime) - Creation timestamp
- `updated_at` (DateTime) - Last update timestamp

### Admin (Related Model)
- `user_id` (Integer) - Unique identifier
- `full_name` (String) - Doctor/secretary name
- `email` (String) - Email address
- `phone` (String) - Phone number
- `role` (String) - 'doctor' or 'secretary'
- `image` (String, nullable) - Profile image filename
- `is_active` (Boolean) - Account activation status

### User (Related Model)
- `user_id` (Integer) - Unique identifier
- `full_name` (String) - User name
- `email` (String) - Email address
- `phone` (String) - Phone number
- `image` (String, nullable) - Profile image filename

## API Endpoints

### Public Endpoints
- `GET /api/v1/availability` - Get all availability slots (paginated)
- `GET /api/v1/availability/:id` - Get specific availability slot by ID
- `GET /api/v1/availability/admin/:adminId` - Get availability slots for a specific doctor/secretary

### Doctor/Secretary Endpoints
- `POST /api/v1/availability` - Create a new availability slot (doctors can create for themselves, secretaries can create for their assigned doctor)
- `PUT /api/v1/availability/:id` - Update an existing availability slot (doctors can update their own slots, secretaries can update their assigned doctor's slots)
- `DELETE /api/v1/availability/:id` - Delete an availability slot (hard delete) (doctors can delete their own slots, secretaries can delete their assigned doctor's slots)

### User Endpoints
- `POST /api/v1/availability/:id/book` - Book an available slot
- `POST /api/v1/availability/:id/cancel` - Cancel a booking (users can cancel their own bookings, doctors/secretaries can cancel any booking)

## Role-Based Access Control

| Action             | User | Doctor          | Secretary |
|--------            |----- |--------         |-----------|
| View all slots     | ✅   | ✅             | ✅ |
| View specific slot | ✅   | ✅             | ✅ |
| Create slot        | ❌   | ✅ (self only) | ✅ (for assigned doctor) |
| Update slot        | ❌   | ✅ (own slots) | ✅ (assigned doctor's slots) |
| Delete slot        | ❌   | ✅ (own slots) | ✅ (assigned doctor's slots) |
| Book slot          | ✅   | ❌             | ❌ |
| Cancel own booking | ✅   | ✅             | ✅ |
| Cancel any booking | ❌   | ✅ (own slots) | ✅ (assigned doctor's slots) |

## Status Management

The availability system automatically manages slot statuses based on time and actions:

### Automatic Status Updates
1. **During Creation**: When creating a new slot, if the date/time is in the past, the status is automatically set to `unavailable`
2. **During Updates**: When updating a slot's date/time, if the new time is in the past, the status is automatically set to `unavailable`
3. **Periodic Cleanup**: A background job runs periodically to mark past slots as `unavailable`
4. **When Booked**: When a slot is booked (either through direct assignment or booking endpoint), the status is automatically set to `unavailable`
5. **When Booking Cancelled**: When a booking is cancelled, the status is set back to `available` (unless it's in the past, then it becomes `unavailable`)

### Status Meanings
- `available`: The slot is available for booking
- `unavailable`: The slot is in the past, booked, or manually marked as unavailable
- `cancelled`: The slot has been cancelled by the doctor/secretary

### Booking Restrictions
- Only slots with `available` status can be booked
- Booked slots maintain their `available` status but have `is_booked` set to true
- Past slots are automatically marked as `unavailable` and cannot be booked

## Business Logic

1. **Slot Creation**: Only doctors and secretaries can create availability slots
2. **Slot Booking**: Only regular users can book slots
3. **Slot Cancellation**: Users can cancel their own bookings; doctors/secretaries can cancel any booking
4. **Slot Deletion**: Only doctors/secretaries can delete slots, and it's a hard delete (permanent removal)
5. **Automatic Status Management**: Past slots are automatically marked as unavailable
6. **Logical Consistency**: 
   - If `booked_by_user_id` is provided during creation/update, `is_booked` is automatically set to `true` and `status` is set to `unavailable`
   - If `is_booked` is set to `true`, `booked_by_user_id` must be provided
   - When a booking is cancelled, the status returns to `available` (unless it's in the past)

## Filtering and Sorting

### Filtering Options
- Filter by `status` (available, unavailable, cancelled)
- Filter by `is_booked` (true/false)
- Filter by `booked_by_user_id` (specific user)
- Filter by `admin_id` (specific doctor/secretary)

### Sorting Order
Results are automatically sorted by:
1. Status (available, cancelled, unavailable)
2. Booking status (not booked first)
3. Date (ascending)
4. Start time (ascending)

## Example Usage

### Creating a Time-Range Slot
```
POST /api/v1/availability
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2025-12-21",
  "start_time": "16:30:00",
  "end_time": "17:45:00"
}
```

### Creating a Single-Time Slot
```
POST /api/v1/availability
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2025-12-21",
  "start_time": "14:15:00"
}
```

### Creating a Pre-booked Slot
```
POST /api/v1/availability
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2025-12-21",
  "start_time": "10:00:00",
  "end_time": "11:00:00",
  "booked_by_user_id": 2
}
```
*Note: When `booked_by_user_id` is provided, `is_booked` is automatically set to `true` and `status` is set to `unavailable`*

### Creating a Slot for Assigned Doctor (Secretary Only)
```
POST /api/v1/availability
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2025-12-21",
  "start_time": "14:00:00",
  "end_time": "15:00:00",
  "admin_id": 6  // ID of the assigned doctor
}
```
*Note: Secretaries can create availability slots for their assigned doctors by providing the `admin_id` parameter*

### Booking a Slot
```
POST /api/v1/availability/123/book
Authorization: Bearer <token>
```

### Viewing Available Slots
```
GET /api/v1/availability?status=available&is_booked=false
```

### Viewing Slots for a Specific User
```
GET /api/v1/availability?booked_by_user_id=2
```

### Viewing Slots for a Specific Doctor
```
GET /api/v1/availability?admin_id=6
```

### Updating a Slot
```
PUT /api/v1/availability/123
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2025-12-22",
  "start_time": "14:15:00",
  "end_time": null
}
```

### Updating a Slot with Booking Info
```
PUT /api/v1/availability/123
Authorization: Bearer <token>
Content-Type: application/json

{
  "booked_by_user_id": 3
}
```
*Note: When `booked_by_user_id` is provided, `is_booked` is automatically set to `true` and `status` is set to `unavailable`*

## Error Responses

All error responses follow a consistent format:
```
{
  "status": "failure",
  "message": "Error description"
}
```

Common error messages:
- "Availability slot not found" (404)
- "Not authorized to update this availability slot" (403)
- "Only users can book availability slots" (403)
- "This slot is already booked" (400)
- "This slot is not available for booking" (400)
- "This slot is not booked" (400)
- "booked_by_user_id is required when is_booked is true" (400)

## Test Cases

### 1. Create Availability for Assigned Doctor
**Scenario**: A secretary creates an availability slot for their assigned doctor
- **Given**: A secretary is logged in and assigned to a doctor
- **When**: The secretary calls POST /api/v1/availability with admin_id of their assigned doctor
- **Then**: The availability slot is created for the doctor, not the secretary

### 2. Update Availability for Assigned Doctor
**Scenario**: A secretary updates an availability slot for their assigned doctor
- **Given**: A secretary is logged in and assigned to a doctor; there is an existing availability slot for that doctor
- **When**: The secretary calls PUT /api/v1/availability/{id} for the doctor's availability slot
- **Then**: The availability slot is updated successfully

### 3. Delete Availability for Assigned Doctor
**Scenario**: A secretary deletes an availability slot for their assigned doctor
- **Given**: A secretary is logged in and assigned to a doctor; there is an existing availability slot for that doctor
- **When**: The secretary calls DELETE /api/v1/availability/{id} for the doctor's availability slot
- **Then**: The availability slot is deleted successfully

### 4. Cancel Booking for Assigned Doctor
**Scenario**: A secretary cancels a booking for their assigned doctor
- **Given**: A secretary is logged in and assigned to a doctor; there is an existing booked availability slot for that doctor
- **When**: The secretary calls POST /api/v1/availability/{id}/cancel for the doctor's booked slot
- **Then**: The booking is cancelled successfully

### 5. Unauthorized Access Prevention
**Scenario**: A secretary attempts to manage availability for a doctor they're not assigned to
- **Given**: A secretary is logged in and assigned to doctor A
- **When**: The secretary tries to manage availability for doctor B
- **Then**: The request is denied with 403 Forbidden

## Expected API Changes

### POST /api/v1/availability
- Added optional `admin_id` parameter to allow secretaries to create slots for specific doctors
- Secretaries can create for their assigned doctor without specifying admin_id
- Secretaries can specify admin_id to create for a specific assigned doctor
- Doctors can only create for themselves

### PUT /api/v1/availability/:id
- Secretaries can update availability slots belonging to their assigned doctor
- Permission checks validate the secretary-doctor relationship

### DELETE /api/v1/availability/:id
- Secretaries can delete availability slots belonging to their assigned doctor
- Permission checks validate the secretary-doctor relationship

### POST /api/v1/availability/:id/cancel
- Secretaries can cancel bookings for their assigned doctor's availability slots
- Permission checks validate the secretary-doctor relationship

## Implementation Details

The system implements the following helper functions:
1. `validateProfessionalPermission` - Checks if user is doctor or secretary
2. `checkSecretaryDoctorRelationship` - Verifies if a secretary belongs to a specific doctor

The relationship check is performed by:
1. Fetching the secretary record from the database
2. Verifying the secretary role
3. Checking if the secretary's supervisor_id matches the target doctor's ID

## Changes Made

### 1. Updated availability.controller.js

#### Added Helper Function
- **Function**: `checkSecretaryDoctorRelationship(secretaryId, doctorId)`
- **Purpose**: Verifies if a secretary is assigned to a specific doctor by checking if `secretary.supervisor_id === doctorId`
- **Location**: Added at the top of the controller file

#### Modified createAvailability Function
- **Added** `admin_id` parameter to the request body
- **Enhanced** permission logic to allow secretaries to create availability for their assigned doctor
- **Added** validation to ensure secretaries can only create for doctors they're assigned to
- **Added** automatic assignment to assigned doctor when no `admin_id` is provided by secretary

#### Modified updateAvailability Function
- **Enhanced** permission checks to allow secretaries to update their assigned doctor's availability slots
- **Added** relationship validation using `checkSecretaryDoctorRelationship` function
- **Maintained** existing doctor permission logic

#### Modified deleteAvailability Function
- **Enhanced** permission checks to allow secretaries to delete their assigned doctor's availability slots
- **Added** relationship validation using `checkSecretaryDoctorRelationship` function
- **Maintained** existing doctor permission logic

#### Modified cancelBooking Function
- **Enhanced** permission checks to allow secretaries to cancel bookings for their assigned doctor's availability slots
- **Added** relationship validation using `checkSecretaryDoctorRelationship` function
- **Maintained** existing user and doctor permission logic

### 2. Updated availability.routes.js
- **Updated** Swagger documentation for POST /api/v1/availability to include `admin_id` parameter
- **Added** description explaining that `admin_id` allows secretaries to create for their assigned doctor

## Functionality Implemented

### Secretary Capabilities
1. **Create Availability**: Secretaries can create availability slots for their assigned doctor
2. **Update Availability**: Secretaries can update existing availability slots for their assigned doctor
3. **Delete Availability**: Secretaries can delete availability slots for their assigned doctor
4. **Cancel Booking**: Secretaries can cancel bookings for their assigned doctor's availability slots

### Permission Logic
- **Doctors**: Can only manage their own availability slots
- **Secretaries**: Can manage availability slots for their assigned doctor (verified through supervisor relationship)
- **Users**: Can only book/cancel their own bookings
- **Unauthorized Access**: Prevented through relationship validation

### Security Measures
- **Relationship Validation**: All secretary actions verify the secretary-doctor relationship
- **Role Verification**: Ensures user is a secretary before checking relationships
- **Access Control**: Prevents unauthorized access to other doctors' availability

## API Usage Examples

### For Secretaries Creating Availability for Assigned Doctor
```javascript
POST /api/v1/availability
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2025-12-21",
  "start_time": "14:00:00",
  "end_time": "15:00:00",
  "admin_id": 6  // ID of the assigned doctor
}
```

### For Secretaries Updating Doctor's Availability
```javascript
PUT /api/v1/availability/123
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2025-12-22",
  "start_time": "16:00:00"
}
```

## Database Relationships
- Uses the existing `supervisor_id` field in the `admins` table
- Links secretaries to their assigned doctors through foreign key relationship
- Maintains data integrity with foreign key constraints

## Error Handling
- **403 Forbidden**: When secretary tries to access doctor they're not assigned to
- **404 Not Found**: When availability slot doesn't exist
- **500 Server Error**: For database or system errors

## Backward Compatibility
- All existing functionality for doctors and users remains unchanged
- No breaking changes to existing API endpoints
- Existing availability data and relationships are preserved