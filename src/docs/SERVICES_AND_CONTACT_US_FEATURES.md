# Services and Contact Us Features Documentation

## Overview

This document describes the newly implemented Services and Contact Us features for the Clinic Management System. These features enhance the system by providing public access to clinic services information and contact details.

## Services Feature

### Database Structure

The `services` table stores information about clinic services with multilingual support:

- `id`: Primary key
- `name`: JSON field containing service names in different languages (Arabic and English)
- `description`: JSON field containing service descriptions in different languages
- `image`: Optional image filename for service visualization
- `is_active`: Boolean flag to enable/disable services
- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last update

### API Endpoints

#### Public Endpoints
- `GET /api/v1/services` - Get all active services with pagination
- `GET /api/v1/services/:id` - Get a specific service by ID

#### Admin/Doctor Endpoints
- `POST /api/v1/services` - Create a new service (requires authentication)
- `PUT /api/v1/services/:id` - Update an existing service (requires authentication)
- `DELETE /api/v1/services/:id` - Delete a service (soft delete, requires authentication)
- `PUT /api/v1/services/:id/toggle-status` - Toggle service active status (requires authentication)

### Multilingual Support

Services support multiple languages through JSON fields:
```json
{
  "name": {
    "ar": "استشارة طبية عامة",
    "en": "General Medical Consultation"
  },
  "description": {
    "ar": "استشارة طبية شاملة مع طبيب عام لتشخيص الحالات الصحية المختلفة",
    "en": "Comprehensive medical consultation with a general practitioner for diagnosing various health conditions"
  }
}
```

## Contact Us Feature

### Database Structure

The `contact_us` table stores clinic contact information:

- `id`: Primary key
- `phone_numbers`: JSON array of phone numbers with types
- `social_media`: JSON array of social media links
- `email`: Primary contact email
- `address`: JSON field containing addresses in different languages
- `image`: Optional image filename for contact visualization
- `is_active`: Boolean flag to enable/disable contact information
- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last update

### API Endpoints

#### Public Endpoints
- `GET /api/v1/contact-us` - Get active contact information

#### Admin Endpoints
- `GET /api/v1/contact-us/all` - Get all contact records (pagination, super admin only)
- `GET /api/v1/contact-us/:id` - Get specific contact record by ID (super admin only)
- `POST /api/v1/contact-us` - Create new contact information (requires authentication)
- `PUT /api/v1/contact-us/:id` - Update contact information (requires authentication)
- `DELETE /api/v1/contact-us/:id` - Delete contact information (soft delete, requires authentication)

### Contact Information Structure

Contact information supports structured data:

```json
{
  "phone_numbers": [
    {"type": "primary", "number": "+1234567890"},
    {"type": "emergency", "number": "+1234567891"}
  ],
  "social_media": [
    {"platform": "facebook", "url": "https://facebook.com/clinic"},
    {"platform": "twitter", "url": "https://twitter.com/clinic"}
  ],
  "email": "info@clinic.com",
  "address": {
    "ar": "شارع الصحة، المدينة الطبية",
    "en": "Health Street, Medical City"
  }
}
```

## Implementation Details

### Architecture

Both features follow the existing project architecture:
1. **Models**: Sequelize models with proper relationships
2. **Repositories**: Data access layer with CRUD operations
3. **Services**: Business logic layer
4. **Controllers**: Request handling with proper validation
5. **Routes**: API endpoints with Swagger documentation
6. **Middleware**: Authentication and authorization checks

### Security

- All administrative endpoints require proper authentication
- Role-based access control (admin, doctor, super_admin)
- Input validation using existing patterns
- Soft delete implementation for data retention

### Image Handling

Both features support image uploads:
- Single image per record
- Automatic compression (10% compression by default)
- Storage in `public/uploads/images/services` and `public/uploads/images/contact` directories
- Automatic URL generation for frontend access

## Database Migrations

Two new migration files were created:
1. `12-create-services-table.sql` - Creates the services table
2. `13-create-contact-us-table.sql` - Creates the contact_us table

## Database Seeds

Two new seed files were created:
1. `05-services-seed.sql` - Sample services data
2. `06-contact-us-seed.sql` - Sample contact information

## Usage Examples

### Creating a Service
```bash
curl -X POST http://localhost:3000/api/v1/services \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "name={\"ar\": \"خدمة جديدة\", \"en\": \"New Service\"}" \
  -F "description={\"ar\": \"وصف الخدمة\", \"en\": \"Service Description\"}" \
  -F "image=@service-image.jpg"
```

### Getting Contact Information
```bash
curl -X GET http://localhost:3000/api/v1/contact-us
```

## Future Enhancements

1. Add support for multiple contact records with different purposes
2. Implement service categories
3. Add appointment booking integration with services
4. Enhance social media link management
5. Add map integration for addresses