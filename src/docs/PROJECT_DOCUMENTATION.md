# Clinic Management API - Project Documentation

## Table of Contents
1. [API Versioning System](#api-versioning-system)
2. [Validation and Image Upload Implementation](#validation-and-image-upload-implementation)
3. [Swagger Documentation Update](#swagger-documentation-update)
4. [Messaging System Entity Relationships](#messaging-system-entity-relationships)
5. [Real-time Chat Implementation](#real-time-chat-implementation)
6. [Services and Contact Us Features](#services-and-contact-us-features)---

## API Versioning System

### Overview
We have successfully implemented a flexible API versioning system that allows easy switching between different API versions (v1, v2, etc.) in the Clinic Management System.

### Directory Structure Created

```
src/
├── api/
│   ├── v1/
│   │   ├── index.js              # Exports all v1 routes
│   │   └── routes/              # (Future) v1-specific routes
│   ├── v2/
│   │   ├── index.js              # Exports all v2 routes
│   │   ├── routes/
│   │   │   └── auth.routes.js    # Sample v2 auth routes
│   │   └── (other route files)
│   └── index.js                  # Main API router/controller
```

### Key Components

#### 1. Version Index Files
Each version has its own index file that exports all routes for that version:
- `src/api/v1/index.js` - Exports v1 routes
- `src/api/v2/index.js` - Exports v2 routes

#### 2. Main API Router
The main API router (`src/api/index.js`) manages version switching:
- Reads the current version from environment variables (`API_VERSION`)
- Defaults to `v1` if no version is specified
- Exports the current active version as `current`

#### 3. App Integration
In `src/app.js`, routes are connected through the versioned API:
```javascript
app.use('/api/auth', api.current.authRoutes);
app.use('/api/users', api.current.userRoutes);
```

### How to Switch Between Versions

#### Method 1: Environment Variable
Set the `API_VERSION` environment variable in `.env`:
```
API_VERSION=v1  # Use v1 API (default)
# or
API_VERSION=v2  # Use v2 API
```

#### Method 2: Programmatic Access
Access specific versions programmatically:
```javascript
const api = require('./api');

// Use v1 explicitly
app.use('/api/v1/auth', api.v1.authRoutes);

// Use v2 explicitly
app.use('/api/v2/auth', api.v2.authRoutes);
```

### Features Implemented

1. **Easy Version Switching**: Change one environment variable to switch versions
2. **Backward Compatibility**: Routes without v2 implementations fall back to v1
3. **Extensible Design**: Adding new versions is straightforward
4. **Centralized Management**: All version routing is managed in one place
5. **Documentation**: Comprehensive documentation in `src/docs/apiVersioning.md`

### Benefits

1. **Zero Downtime Updates**: Deploy new API versions without affecting existing clients
2. **Gradual Migration**: Clients can migrate to new versions at their own pace
3. **Feature Testing**: Test new features in isolation before full deployment
4. **Rollback Capability**: Quickly revert to previous versions if needed
5. **Clean Separation**: Clear separation of concerns between API versions

### Usage Instructions

1. **To use v1 API** (default):
   - Ensure `API_VERSION=v1` in `.env` (or leave it unset)
   - Restart the server

2. **To use v2 API**:
   - Set `API_VERSION=v2` in `.env`
   - Restart the server

3. **To add a new version** (e.g., v3):
   - Create `src/api/v3/` directory
   - Create `src/api/v3/index.js`
   - Add version-specific routes in `src/api/v3/routes/`
   - Update `src/api/index.js` to include the new version

### Files Created/Modified

1. `src/api/v1/index.js` - v1 API index file
2. `src/api/v2/index.js` - v2 API index file
3. `src/api/v2/routes/auth.routes.js` - Sample v2 authentication routes
4. `src/api/index.js` - Main API router
5. `.env` - Added `API_VERSION` configuration
6. `README.md` - Updated with API versioning documentation
7. `src/docs/apiVersioning.md` - Detailed API versioning guide

---

## Validation and Image Upload Implementation

### Overview
I've successfully implemented a comprehensive solution for user registration with image uploads and proper input validation using Joi.

### Key Components Implemented

#### 1. Image Upload Utility (`src/utils/imageUploadUtil.js`)
- Generic `uploadImage()` function that can be used for any image upload scenario
- Support for both images and videos with `uploadVideo()` and `uploadMultipleVideos()` functions
- Configurable compression ratios (default 10% compression)
- Dynamic folder naming based on content type
- Explicit parameter passing as per project specifications

#### 2. Input Validation (`src/utils/validation.js`)
- Joi validation schemas for user registration and login
- Custom validation to ensure either email or phone is provided
- Proper error messages for all validation scenarios

#### 3. Route Handling (`src/routes/auth.routes.js`)
- Conditional middleware to detect multipart/form-data requests
- Uses generic `uploadImage()` function directly with explicit parameters
- No unnecessary wrapper functions created
- Supports both JSON and multipart/form-data requests on the same endpoint

#### 4. Controller Logic (`src/controllers/authController.js`)
- Single registration function handles both cases (with and without images)
- Proper Joi validation for all input data
- Clean separation of concerns

### Usage Examples

#### Register without image (JSON request):
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "email": "john.doe@example.com",
    "password": "password123",
    "phone": "+1234567890"
  }'
```

#### Register with image (multipart form data):
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: multipart/form-data" \
  -F "full_name=John Doe" \
  -F "email=john.doe@example.com" \
  -F "password=password123" \
  -F "phone=+1234567890" \
  -F "profileImage=@/path/to/image.jpg"
```

#### Register with custom compression:
```bash
curl -X POST "http://localhost:3000/api/auth/register?compression=85&contentType=patients" \
  -H "Content-Type: multipart/form-data" \
  -F "full_name=John Doe" \
  -F "email=john.doe@example.com" \
  -F "password=password123" \
  -F "phone=+1234567890" \
  -F "profileImage=@/path/to/image.jpg"
```

### Benefits of This Implementation

1. **No Redundancy**: Uses generic functions directly without creating unnecessary wrapper functions
2. **Scalability**: Can easily handle 100+ different upload scenarios without code duplication
3. **Explicit Parameters**: All values are clearly passed at the call site as per project specifications
4. **Proper Validation**: Uses Joi for robust input validation
5. **Single Endpoint**: Handles both JSON and multipart requests on the same endpoint
6. **Clean Code**: Follows separation of concerns and maintainability principles

### Files Updated/Created

1. `src/routes/auth.routes.js` - Added conditional image upload middleware
2. `src/controllers/authController.js` - Updated to handle uploaded images and use Joi validation
3. `src/utils/imageUploadUtil.js` - Enhanced with video support (already existed)
4. `src/utils/validation.js` - Joi validation schemas (already existed)
5. `src/examples/userRegistrationWithImageExample.js` - Example usage documentation

---

## Real-time Chat System with WebSocket

### Overview
The real-time chat system enables instant messaging between users and doctors using WebSocket technology. This system builds upon the existing REST API chat functionality and adds real-time capabilities for a seamless user experience.

### System Architecture

```
┌─────────────────┐    HTTP/REST API    ┌──────────────────┐
│   Frontend      │ ◄──────────────────►│  Express Server  │
└─────────────────┘                     └──────────────────┘
        │                                       │
        │         WebSocket Connection          │
        └───────────────────────────────────────┘
                    │
                    ▼
        ┌─────────────────────────┐
        │   WebSocket Service     │
        │  (Socket.IO Server)     │
        └─────────────────────────┘
                    │
        ┌─────────────────────────┐
        │   Message Service       │
        └─────────────────────────┘
                    │
        ┌─────────────────────────┐
        │   Chat Repository       │
        └─────────────────────────┘
                    │
        ┌─────────────────────────┐
        │      Database           │
        └─────────────────────────┘
```

### Key Components

1. **WebSocket Service** (`src/services/websocket.service.js`)
   - Manages WebSocket connections using Socket.IO
   - Implements room-based messaging for chat sessions
   - Handles user presence tracking
   - Broadcasts events in real-time

2. **Message Service** (`src/services/message.service.js`)
   - Integrates with WebSocket service for real-time message broadcasting
   - Persists messages to the database
   - Handles message read status updates

3. **Chat Repository** (`src/repositories/chat/chat.repository.js`)
   - Provides a data access layer for chat operations
   - Abstracts database interactions
   - Ensures consistent data handling

4. **WebSocket Client Utility** (`src/utils/websocket.client.js`)
   - Simplifies WebSocket connections for frontend applications
   - Handles automatic reconnection
   - Manages event subscriptions

### Integration with Existing Chat System

The real-time chat system seamlessly integrates with the existing REST API chat functionality:

1. **Message Creation**: When a message is created via REST API, it's automatically broadcasted via WebSocket
2. **Message Retrieval**: REST API endpoints still serve message history
3. **Read Status**: Read receipts are synchronized between real-time and REST APIs
4. **Authentication**: Uses the same JWT-based authentication system

### WebSocket Events

#### Client to Server
- `join_chat`: User joins a chat room
- `leave_chat`: User leaves a chat room
- `send_message`: Send a new message
- `typing`: Typing indicator
- `mark_as_read`: Mark message as read

#### Server to Client
- `receive_message`: New message received
- `user_typing`: User typing status
- `message_read`: Message read status
- `user_joined`: User joined chat
- `user_left`: User left chat

### Environment Variables

The system uses the following environment variables for configuration:

```
# WebSocket Configuration
WS_PORT=3001
WS_CORS_ORIGIN=http://localhost:3000
WS_PING_INTERVAL=30000
WS_PING_TIMEOUT=5000
```

### Testing Real-time Functionality

To verify the real-time functionality is working:

1. Start the server: `npm start`
2. Connect two clients to the WebSocket server
3. Join the same chat room from both clients
4. Send a message from one client
5. Observe the message appear instantly on the other client

Console logs will show:
```
User connected: socket-id-123
User 1 joined chat 5
Message sent to chat 5
User 1: Hello, doctor!
```

### Benefits

1. **Instant Messaging**: Messages appear immediately without polling
2. **Presence Awareness**: Know when users are online/offline
3. **Typing Indicators**: Improve user experience with typing notifications
4. **Read Receipts**: Track message read status in real-time
5. **Scalable**: Efficient room-based messaging system
6. **Secure**: Inherits authentication from REST API

### Files Created

1. `src/services/websocket.service.js` - WebSocket service implementation
2. `src/repositories/chat/chat.repository.js` - Chat data access layer
3. `src/controllers/chat/realtimeChat.controller.js` - Real-time chat controller
4. `src/routes/chat/realtime.chat.routes.js` - Real-time chat API routes
5. `src/utils/websocket.client.js` - Client-side WebSocket utility
6. `src/examples/realtime-chat-example.js` - Frontend implementation example
7. `src/docs/REALTIME_CHAT_IMPLEMENTATION.md` - Detailed implementation guide
8. `src/docs/FRONTEND_INTEGRATION_GUIDE.md` - Frontend integration guide
9. `src/examples/frontend-chat-example.html` - HTML example for frontend integration

## Real-time Chat Implementation

### Overview
We have successfully implemented a real-time chat system using WebSocket technology to enable instant messaging between users and doctors in the Clinic Management System.

### Key Components Implemented

#### 1. WebSocket Service (`src/services/websocket.service.js`)
- Real-time communication using Socket.IO
- Room-based messaging for chat sessions
- User presence tracking and status management
- Event broadcasting for messages, typing indicators, and read receipts

#### 2. Chat Repository (`src/repositories/chat/chat.repository.js`)
- Centralized data access layer for chat operations
- Consistent interface for chat and message operations
- Improved code organization and maintainability

#### 3. Real-time Chat Controller (`src/controllers/chat/realtimeChat.controller.js`)
- API endpoints for initializing and managing real-time chat sessions
- Integration with WebSocket service for real-time notifications
- Proper authentication and authorization checks

#### 4. Real-time Chat Routes (`src/routes/chat/realtime.chat.routes.js`)
- RESTful API endpoints for real-time chat functionality
- Comprehensive Swagger documentation
- Secure access control with authentication middleware

#### 5. WebSocket Client Utility (`src/utils/websocket.client.js`)
- Simplified client-side interface for WebSocket connections
- Automatic reconnection with exponential backoff
- Event subscription and emission system
- Error handling and connection state management

#### 6. Frontend Example (`src/examples/realtime-chat-example.js`)
- Complete example implementation for client-side integration
- Demonstration of WebSocket event handling
- Best practices for real-time chat implementation

### Benefits of This Implementation

1. **Real-time Communication**: Instant message delivery between users and doctors
2. **Scalable Architecture**: Efficient room-based messaging system
3. **Enhanced User Experience**: Typing indicators and read receipts
4. **Robust Error Handling**: Automatic reconnection and fallback mechanisms
5. **Security**: Proper authentication and authorization for all chat operations
6. **Maintainability**: Clean separation of concerns with repository pattern

### Usage Examples

#### Initialize Real-time Chat:
```javascript
const chatData = await initializeChat(consultationId, authToken);
```

#### Send Real-time Message:
```javascript
wsClient.sendMessage(chatId, "Hello doctor!", userId, "text");
```

#### Listen for Incoming Messages:
```javascript
wsClient.on('receive_message', (message) => {
  displayMessage(message);
});
```

### Files Created

1. `src/services/websocket.service.js` - WebSocket service implementation
2. `src/repositories/chat/chat.repository.js` - Chat data access layer
3. `src/controllers/chat/realtimeChat.controller.js` - Real-time chat controller
4. `src/routes/chat/realtime.chat.routes.js` - Real-time chat API routes
5. `src/utils/websocket.client.js` - Client-side WebSocket utility
6. `src/examples/realtime-chat-example.js` - Frontend implementation example
7. `src/docs/REALTIME_CHAT_IMPLEMENTATION.md` - Detailed implementation guide

### Testing

The implementation has been designed to work with the existing test suite. You can test the functionality using:

1. Swagger UI at `http://localhost:3000/api-docs`
2. curl commands as shown in the examples above
3. Any HTTP client that supports multipart form data

The system properly validates all input data using Joi and handles both JSON and multipart requests on the same endpoint, making it flexible and easy to use.

---

## Swagger Documentation Update

### Overview
This report documents the improvements made to the Swagger/OpenAPI documentation for the Clinic Management API. The original documentation was missing several endpoints that exist in the actual API implementation.

### Issues Identified in Original Swagger

#### Missing Authentication Endpoints
1. `/api/auth/verify-otp` (POST) - For verifying user email with OTP
2. `/api/auth/resend-otp` (POST) - For resending OTP to user's email
3. `/api/auth/refresh-tokens` (POST) - For refreshing auth tokens (note: different from the documented `/auth/refresh-token`)
4. `/api/auth/forgot-password` (POST) - For requesting password reset OTP
5. `/api/auth/reset-password` (POST) - For resetting password with OTP

#### Incomplete Documentation
1. The `/auth/register` endpoint was missing the multipart/form-data content type for image uploads
2. Several endpoints were missing proper request/response schemas
3. Security requirements were not consistently applied

#### Discrepancies
1. The documented `/auth/refresh-token` endpoint doesn't match the actual implementation which uses `/auth/refresh-tokens`
2. The `/auth/profile` endpoint documented in Swagger doesn't appear to exist in the actual API

### Improvements Made

#### Added Missing Endpoints
All missing authentication endpoints have been documented with:
- Proper path definitions
- Correct HTTP methods
- Detailed request body schemas
- Comprehensive response schemas
- Appropriate error responses

#### Enhanced Existing Documentation
1. Added multipart/form-data support to the `/auth/register` endpoint
2. Included the `is_active` field in the User schema
3. Improved request/response schemas with more detailed examples
4. Added proper security schemes for protected endpoints

#### Consistent Structure
1. Applied consistent tagging for endpoints (Authentication, Users)
2. Standardized response formats
3. Added detailed descriptions for all parameters and properties

### New Features Documented

#### Enhanced Registration
The registration endpoint now properly documents:
- JSON and multipart/form-data request formats
- Support for image uploads during registration
- Query parameters for image processing

#### Complete Authentication Flow
Documented the full authentication workflow:
1. Registration with email verification
2. OTP verification and resend
3. Login/logout
4. Token refresh
5. Password reset flow

#### User Management
Complete CRUD operations for users with proper authorization requirements.

### Recommendations

#### Future Improvements
1. Add documentation for V2 API endpoints
2. Include examples for all request/response bodies
3. Add pagination parameters for list endpoints
4. Document rate limiting and other API constraints
5. Include webhook documentation if applicable

#### Maintenance
1. Regularly review API implementation against documentation
2. Ensure all new endpoints are documented before deployment
3. Keep request/response schemas up to date with actual implementation

### Conclusion
The updated Swagger documentation now accurately reflects all the endpoints in the Clinic Management API. Developers can now use the documentation as a reliable reference for integrating with the API.

---

## Messaging System Entity Relationships

For detailed information about the relationships between the Consultations, Chats, and Messages tables, please refer to the [Messaging System ERD Documentation](./MESSAGING_SYSTEM_ERD.md).

This documentation includes:
- Entity Relationship Diagram showing how the three tables are connected
- Detailed explanation of each relationship
- Field descriptions for all tables
- Business rules governing the messaging system

---

## Security Considerations

1. **Authentication**: All WebSocket connections require valid JWT tokens
2. **Authorization**: Users can only join chats they're authorized to access
3. **Data Validation**: All messages are validated before processing
4. **Rate Limiting**: Connection attempts are rate-limited

## Performance Optimization

1. **Room-based Broadcasting**: Messages are only sent to relevant chat rooms
2. **Connection Pooling**: Efficient management of WebSocket connections
3. **Message Compression**: Large payloads are compressed when possible
4. **Heartbeat Mechanism**: Detects and cleans up stale connections

## Troubleshooting

### Common Issues

1. **Connection Failures**: Check WebSocket URL and authentication token
2. **Message Delivery**: Verify user permissions and chat room membership
3. **Performance**: Monitor connection count and message throughput

### Debugging Tips

1. Enable verbose logging in development
2. Use browser WebSocket inspection tools
3. Monitor server logs for error messages
4. Check network tab for connection issues

## Future Enhancements

1. **Message Encryption**: End-to-end encryption for sensitive conversations
2. **File Sharing**: Enhanced file sharing with progress indicators
3. **Presence Indicators**: Detailed user presence information
4. **Message History**: Efficient loading of historical messages
5. **Push Notifications**: Mobile push notifications for offline users

---

## WebSocket Load Testing

This guide explains how to test the WebSocket chat system with multiple concurrent users to ensure it can handle production loads.

### Prerequisites

1. The application must be running
2. WebSocket server must be active
3. Required dependencies installed (`socket.io-client`, `chalk`)

### Running the Load Test

#### 1. Start the Application

```bash
npm start
```

#### 2. Run the Load Test Script

```bash
node src/tests/websocket.load.test.js
```

#### 3. Customizing Test Parameters

You can customize the test by setting environment variables:

```bash
# Set number of concurrent users (default: 100)
NUM_USERS=50 node src/tests/websocket.load.test.js

# Set WebSocket URL (default: http://localhost:3001)
WS_URL=http://localhost:3001 node src/tests/websocket.load.test.js

# Set test chat ID (default: 1)
TEST_CHAT_ID=2 node src/tests/websocket.load.test.js

# Set message interval in milliseconds (default: 1000)
MESSAGE_INTERVAL=2000 node src/tests/websocket.load.test.js
```

#### 4. Combined Custom Parameters

```bash
NUM_USERS=200 TEST_CHAT_ID=1 MESSAGE_INTERVAL=500 node src/tests/websocket.load.test.js
```

### What the Test Does

1. **Simulates Multiple Users**: Creates the specified number of virtual users
2. **Establishes Connections**: Each user connects to the WebSocket server
3. **Joins Chat Rooms**: All users join the same chat room
4. **Sends Messages**: Users periodically send messages to the chat
5. **Monitors Performance**: Tracks connection rates, message throughput, and errors
6. **Reports Statistics**: Displays real-time statistics every 5 seconds

### Monitoring Metrics

The test monitors and reports the following metrics:

- **Connected Users**: Number of successfully connected users
- **Messages Sent**: Total number of messages sent
- **Errors**: Connection and message errors
- **Active Connections**: Currently active WebSocket connections

### Expected Behavior

#### Healthy System
- All users should connect successfully
- Messages should be delivered without errors
- Low latency (< 100ms) for message delivery
- Stable memory usage

#### Warning Signs
- Connection failures (> 5%)
- Message delivery delays (> 500ms)
- High error rates (> 1%)
- Memory leaks or increasing memory usage

### Interpreting Results

#### Connection Rate
- **Excellent**: 100% connection success rate
- **Good**: > 95% connection success rate
- **Poor**: < 90% connection success rate

#### Message Throughput
- **Excellent**: > 1000 messages/second
- **Good**: > 500 messages/second
- **Poor**: < 100 messages/second

#### Error Rate
- **Excellent**: 0% errors
- **Good**: < 0.1% errors
- **Poor**: > 1% errors

### Troubleshooting

#### Connection Issues
1. Check if the WebSocket server is running
2. Verify the WS_PORT in .env file
3. Check firewall settings
4. Ensure sufficient system resources

#### Performance Issues
1. Monitor CPU and memory usage
2. Check for database bottlenecks
3. Review network bandwidth
4. Optimize message handling code

#### Memory Leaks
1. Monitor memory usage over time
2. Check for unclosed connections
3. Verify proper cleanup of resources
4. Use Node.js profiling tools

### Scaling Recommendations

#### For 100-500 Concurrent Users
- Standard server configuration should suffice
- Monitor resource usage regularly

#### For 500-1000 Concurrent Users
- Consider load balancing
- Optimize database queries
- Implement connection pooling

#### For 1000+ Concurrent Users
- Implement horizontal scaling
- Use Redis adapter for Socket.IO
- Consider microservice architecture
- Implement caching strategies

### Stopping the Test

The test will automatically stop after 5 minutes or when you press `Ctrl+C`.

### Analyzing Logs

Check the logs directory for detailed WebSocket logs:
- `logs/websocket.log` - Contains all WebSocket events and errors
- Console output - Shows real-time statistics

### Best Practices

1. **Start Small**: Begin with fewer users and gradually increase
2. **Monitor Resources**: Keep an eye on CPU, memory, and network usage
3. **Test Regularly**: Run load tests periodically to catch performance regressions
4. **Document Results**: Keep records of test results for comparison
5. **Plan for Growth**: Test with anticipated future user loads

---

## Services and Contact Us Features

### Overview
The Clinic Management System now includes Services and Contact Us features that enhance the platform with public access to clinic services information and contact details.

### Key Components

#### Services Feature
- Multilingual service listings with Arabic and English support
- Image support for service visualization
- Public API endpoints for service browsing
- Administrative endpoints for service management
- Role-based access control (admin, doctor, super_admin)

#### Contact Us Feature
- Structured contact information storage
- Support for multiple phone numbers with types
- Social media link management
- Multilingual address support
- Public API endpoint for contact information retrieval
- Administrative endpoints for contact information management

### Implementation Details

#### Database Changes
1. Added `services` table with JSON fields for multilingual support
2. Added `contact_us` table with structured data fields
3. Created database migrations and seed files

#### API Endpoints
1. Public endpoints for retrieving services and contact information
2. Authenticated endpoints for managing services and contact information
3. Proper Swagger documentation for all new endpoints

#### Architecture
The implementation follows the existing project architecture:
- Models: Sequelize models with proper relationships
- Repositories: Data access layer with CRUD operations
- Services: Business logic layer
- Controllers: Request handling with proper validation
- Routes: API endpoints with Swagger documentation

### Benefits
1. **Enhanced User Experience**: Visitors can easily access clinic services and contact information
2. **Multilingual Support**: Content available in both Arabic and English
3. **Flexible Management**: Administrators can easily update services and contact information
4. **Secure Access**: Role-based permissions ensure only authorized users can make changes
5. **Scalable Design**: Follows existing patterns for easy maintenance and expansion

### Files Created
1. `src/database/migrations/12-create-services-table.sql`
2. `src/database/migrations/13-create-contact-us-table.sql`
3. `src/database/seeds/05-services-seed.sql`
4. `src/database/seeds/06-contact-us-seed.sql`
5. `src/models/Service.js`
6. `src/models/ContactUs.js`
7. `src/repositories/service.repository.js`
8. `src/repositories/contactUs.repository.js`
9. `src/services/service.service.js`
10. `src/services/contactUs.service.js`
11. `src/controllers/service.controller.js`
12. `src/controllers/contactUs.controller.js`
13. `src/routes/service.routes.js`
14. `src/routes/contactUs.routes.js`
15. `src/docs/SERVICES_AND_CONTACT_US_FEATURES.md`

### Usage Examples

#### Get All Services (Public)
```bash
curl -X GET http://localhost:3000/api/v1/services
```

#### Create New Service (Admin)
```bash
curl -X POST http://localhost:3000/api/v1/services \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "name={\"ar\": \"خدمة جديدة\", \"en\": \"New Service\"}" \
  -F "description={\"ar\": \"وصف الخدمة\", \"en\": \"Service Description\"}"
```

#### Get Contact Information (Public)
```bash
curl -X GET http://localhost:3000/api/v1/contact-us
```

