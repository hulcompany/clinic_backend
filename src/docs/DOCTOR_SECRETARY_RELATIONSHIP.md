# Doctor-Secretary Relationship System

## Overview
This document describes the hierarchical relationship between doctors and secretaries in the clinic management system. The system allows for assigning secretaries to specific doctors, creating a structured workflow where secretaries can manage appointments and administrative tasks on behalf of their assigned doctors.

## Database Schema Changes

### Admins Table
The `admins` table has been updated from the beginning to include the supervisor relationship:

```sql
-- In Migration 07-create-admins-table.sql
CREATE TABLE admins (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  full_name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'doctor',
  image VARCHAR(255),
  is_active TINYINT(1) DEFAULT 0 COMMENT 'Account activation status',
  supervisor_id INT NULL COMMENT 'Foreign key to reference the supervising doctor this secretary is assigned to',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Add constraint to ensure either email or phone is provided
  CONSTRAINT chk_admin_contact CHECK (
    (email IS NOT NULL AND email != '') OR 
    (phone IS NOT NULL AND phone != '')
  ),
  
  -- Add constraint to ensure role is either 'doctor' or 'secretary'
  CONSTRAINT chk_admin_role CHECK (
    role IN ('doctor', 'secretary')
  ),
  
  -- Foreign key constraint for supervisor relationship
  CONSTRAINT fk_admin_supervisor 
  FOREIGN KEY (supervisor_id) REFERENCES admins(user_id) 
  ON DELETE SET NULL
);

-- Index for faster lookups on supervisor_id
CREATE INDEX idx_admin_supervisor ON admins(supervisor_id);
```

### New Column Details
- `supervisor_id`: Integer, nullable
- References: `admins.user_id`
- Purpose: Links a secretary to their assigned supervisor (doctor)
- Behavior: When a supervisor is deleted, the secretary's `supervisor_id` is set to NULL

## Data Model Changes

### Admin Model
The Admin model now includes relationship associations:

```javascript
// A secretary belongs to a supervisor (doctor)
Admin.belongsTo(Admin, {
  as: 'supervisor',
  foreignKey: 'supervisor_id',
  targetKey: 'user_id',
  constraints: false
});

// A supervisor (doctor) has many secretaries
Admin.hasMany(Admin, {
  as: 'secretaries',
  foreignKey: 'supervisor_id',
  sourceKey: 'user_id',
  constraints: false
});
```

## API Endpoints

### Registration with Relationship
When registering a secretary, you can now specify the doctor they are assigned to:

```
POST /api/v1/admins/register
{
  "full_name": "Sarah Johnson",
  "email": "sarah@example.com",
  "password": "securepassword",
  "phone": "+1234567890",
  "role": "secretary",
  "supervisor_id": 123  // ID of the supervisor (doctor) this secretary is assigned to
}
```

### Assign Secretary to Doctor
```
PUT /api/v1/admins/{secretaryId}/assign-to-doctor/{doctorId}
```

### Get Secretaries for Doctor
```
GET /api/v1/admins/doctor/{doctorId}/secretaries
```

## Business Logic

### Registration Rules
1. **Doctors**: Cannot be assigned to another doctor (`doctor_id` is always NULL for doctors)
2. **Secretaries**: Can be assigned to exactly one doctor (if `doctor_id` is provided)
3. **Validation**: When assigning a secretary to a doctor, the system validates that:
   - The secretary exists and has the role 'secretary'
   - The doctor exists and has the role 'doctor'
   - The doctor ID is valid

### Access Control
- Doctors can manage their assigned secretaries
- Secretaries inherit certain permissions from their assigned doctor
- Administrative functions can manage all relationships

## Usage Examples

### Registering a Secretary with a Doctor
```javascript
// Register a secretary and assign them to a doctor
const secretaryData = {
  full_name: "Nurse Assistant",
  email: "assistant@example.com",
  password: "password123",
  role: "secretary",
  supervisor_id: 1  // Assign to supervisor (doctor) with ID 1
};

const result = await adminService.registerAdmin(secretaryData);
```

### Assigning Existing Secretary to Doctor
```javascript
// Assign an existing secretary to a doctor
const result = await adminService.assignSecretaryToDoctor(5, 1); // Assign secretary ID 5 to doctor ID 1
```

### Getting All Secretaries for a Doctor
```javascript
// Get all secretaries assigned to a specific doctor
const secretaries = await adminService.getSecretariesByDoctor(1); // Get secretaries for doctor ID 1
```

## Benefits

1. **Structured Workflow**: Clear hierarchy between doctors and their support staff
2. **Delegation**: Doctors can delegate appointment management to assigned secretaries
3. **Access Control**: Granular permissions based on the doctor-secretary relationship
4. **Scalability**: Supports multiple doctors with multiple secretaries each
5. **Maintainability**: Clear relationship tracking makes system management easier

## Considerations

1. **Data Integrity**: The system ensures that only valid doctors can be assigned to secretaries
2. **Flexibility**: Doctors can have multiple secretaries, and relationships can be modified
3. **Security**: Access controls ensure secretaries can only act within their assigned doctor's scope
4. **Migration**: Existing records remain unaffected, with `doctor_id` defaulting to NULL