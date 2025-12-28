# Session Management API Documentation

## Overview
The Session Management API allows doctors and administrators to manage meeting links for teleconsultations. Supported platforms include Google Meet, WhatsApp, Zoom, Microsoft Teams, and custom links.

## Base URL
```
/api/v1/sessions
```

## Authentication
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Roles and Permissions

| Role | Permissions |
|------|-------------|
| Super Admin | Full access to all sessions |
| Admin | Full access to all sessions |
| Doctor | Access to own sessions only |

## Endpoints

### Get All Sessions
```
GET /api/v1/sessions
```
**Description**: Get all sessions (Super Admin only)
**Query Parameters**:
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 20) - Items per page

### Get Session by ID
```
GET /api/v1/sessions/{id}
```
**Description**: Get a specific session by ID

### Get Sessions by Doctor ID
```
GET /api/v1/sessions/doctor/{doctor_id}
```
**Description**: Get all sessions for a specific doctor
**Query Parameters**:
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 20) - Items per page

### Create Session
```
POST /api/v1/sessions
```
**Description**: Create a new session
**Request Body**:
```json
{
  "link": "https://meet.google.com/abc-defg-hij",
  "link_type": "google_meet",
  "doctor_id": 1 // Optional for doctors (auto-filled with their ID)
}
```

### Update Session
```
PUT /api/v1/sessions/{id}
```
**Description**: Update an existing session
**Request Body**:
```json
{
  "link": "https://zoom.us/new-link",
  "link_type": "zoom"
}
```

### Delete Session
```
DELETE /api/v1/sessions/{id}
```
**Description**: Delete a session

### Toggle Session Status
```
PUT /api/v1/sessions/{id}/toggle-status
```
**Description**: Activate/deactivate a session

## Link Types
Supported link types:
- `google_meet` - Google Meet
- `whatsapp` - WhatsApp
- `zoom` - Zoom
- `teams` - Microsoft Teams
- `other` - Other platforms

## Response Format
All responses follow the standard format:
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```