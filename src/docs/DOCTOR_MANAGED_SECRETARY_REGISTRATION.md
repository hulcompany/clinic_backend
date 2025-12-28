# Doctor-Managed Secretary Registration

## Overview
This document describes the system where doctors can register secretary accounts on behalf of their secretaries. This approach ensures that only authorized doctors can create accounts for their support staff, maintaining security and accountability within the clinic management system.

## Implementation

### New API Endpoint
A new endpoint is available for doctors to register secretaries:

```
POST /api/v1/admins/register-secretary
```

### Request Structure
```json
{
  "full_name": "Sarah Johnson",
  "email": "sarah@example.com",
  "password": "securepassword",
  "phone": "+1234567890",
  "role": "secretary"
}
```

### Authorization
- Only authenticated doctors can access this endpoint
- The system automatically assigns the registering doctor as the supervisor for the new secretary
- The secretary's `supervisor_id` is set to the doctor's `user_id`

### Business Logic
1. **Doctor Authentication**: Only authenticated doctors can register secretaries
2. **Automatic Assignment**: The newly created secretary is automatically assigned to the registering doctor
3. **Role Validation**: Only the 'secretary' role can be registered through this endpoint
4. **Supervisor Relationship**: The secretary is automatically linked to the doctor who registered them

### Service Method
```javascript
// Register a secretary account (doctor only)
async registerSecretaryByDoctor(doctorId, secretaryData) {
  // Validate that the requesting user is a doctor
  const doctor = await adminRepository.getAdminById(doctorId);
  if (!doctor || doctor.role !== 'doctor') {
    throw new AppError('Only doctors can register secretaries', 403);
  }
  
  // Ensure the role is secretary
  if (secretaryData.role && secretaryData.role !== 'secretary') {
    throw new AppError('Doctors can only register secretaries', 400);
  }
  
  // Ensure no supervisor_id is provided (auto-assign to the registering doctor)
  if (secretaryData.supervisor_id) {
    throw new AppError('Cannot assign secretary to another supervisor when registering through doctor', 400);
  }
  
  // Create the secretary with the doctor as supervisor
  const secretary = await adminRepository.createAdmin({
    full_name: secretaryData.full_name,
    email: secretaryData.email,
    password: secretaryData.password,
    phone: secretaryData.phone,
    image: secretaryData.image,
    role: 'secretary',
    supervisor_id: doctorId  // Automatically assign to the registering doctor
  });
  
  return {
    success: true,
    admin: secretary
  };
}
```

### Benefits

1. **Enhanced Security**: Only authorized doctors can create secretary accounts
2. **Automatic Assignment**: Secretaries are automatically linked to their supervising doctor
3. **Accountability**: Clear ownership of secretary accounts by doctors
4. **Controlled Access**: Doctors have control over who can assist them
5. **Simplified Onboarding**: Doctors can easily set up accounts for their team members

### Considerations

1. **Verification**: Newly created secretary accounts may require email verification
2. **Permissions**: Secretaries inherit specific permissions based on their assigned doctor
3. **Management**: Doctors can later modify or remove secretary accounts as needed
4. **Audit Trail**: All registrations are logged for security and accountability

## Workflow

1. Doctor authenticates with the system
2. Doctor accesses the register secretary endpoint
3. System validates doctor's authority
4. System creates new secretary account with doctor as supervisor
5. Secretary receives account information for login
6. Secretary can now assist the supervising doctor with clinic tasks

This approach ensures that the clinic's organizational structure is properly maintained while providing doctors with the ability to manage their support staff effectively.