# Clinic Management System

A comprehensive clinic management system built with Node.js, Express, and MySQL.

## Features

- User authentication with JWT and Passport.js
- Role-based access control
- Patient management
- Appointment scheduling
- Medical records management
- User profile with image support (stores filename only)
- Unified media handling with automatic compression
- Configurable compression ratios (default 10% compression)
- RESTful API with Swagger documentation
- API Versioning System (v1/v2 support)
- Image and Video Upload Support
- Services management with multilingual support
- Contact information management with structured data

## Prerequisites

- Node.js >= 18.x
- MySQL database
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd clinic
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_USER=your_db_username
DB_PASSWORD=your_db_password
DB_NAME=clinic_db
JWT_SECRET=your_jwt_secret_key
REFRESH_TOKEN_SECRET=your_refresh_token_secret
```

4. Run database migrations:
```bash
npm run migrate
```

5. Start the development server:
```bash
npm run dev
```

## API Documentation

API documentation is available through Swagger UI at:
```
http://localhost:3000/api-docs
```

## API Versioning

The system now supports API versioning with easy switching between versions:

- **Current Version**: v1 (default)
- **Next Version**: v2 (in development)

### Switching Between Versions

To switch API versions:
1. Edit the `.env` file
2. Change `API_VERSION` to `v1` or `v2`
3. Restart the server

```env
# Use v1 API (default)
API_VERSION=v1

# Or switch to v2 API
API_VERSION=v2
```

See `src/docs/apiVersioning.md` for detailed information on the versioning system.

## User Registration with Image

The system now supports user profile images during registration. When registering a new user, you can optionally include an image:

### Register without image (JSON request):
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890"
}
```

### Register with image (multipart form data):
Form fields:
- full_name: John Doe
- email: john@example.com
- password: password123
- phone: +1234567890
- profileImage: [image file]

### Register with custom compression:
Query parameters:
- compression: 85 (15% compression)
- contentType: patients

## Unified Media Handling

The system includes a unified media helper that provides flexible file upload capabilities:

- Automatic organization of files into folders based on content type and file type
- Support for single and multiple file uploads
- Automatic image compression for optimal quality/size balance
- Configurable compression ratios (default 10% compression)
- File type validation and filtering
- Error handling and detailed response formats

Example usage:
```javascript
const { createUploader, uploadAndCompress } = require('./utils/mediaHelper');

// Create uploader for user profile images
const upload = createUploader('users', 'profileImage', 'single');

// Use in route handler with 15% compression (quality level 85)
app.post('/api/users/profile-image', async (req, res) => {
  try {
    await uploadAndCompress(req, res, upload, true, 85); // 15% compression
    // Handle successful upload
  } catch (error) {
    // Handle upload error
  }
});
```

### Configurable Compression

The media helper supports configurable compression ratios for both images and videos:

- **Default**: 10% compression (quality level 90)
- **Custom**: Pass quality level (0-100) where:
  - 100 = No compression (highest quality)
  - 90 = 10% compression (default)
  - 80 = 20% compression
  - 50 = 50% compression (lower quality, smaller file size)

Example with custom compression:
```javascript
// Upload with 25% compression (quality level 75)
await uploadAndCompress(req, res, upload, true, 75);

// Upload with no compression (highest quality)
await uploadAndCompress(req, res, upload, true, 100);
```

## Image and Video Upload Support

The system includes comprehensive support for both image and video uploads:

### Image Upload Functions:
- `uploadImage()` - Upload a single image with compression
- `uploadMultipleImages()` - Upload multiple images with compression

### Video Upload Functions:
- `uploadVideo()` - Upload a single video (no compression)
- `uploadMultipleVideos()` - Upload multiple videos (no compression)

### Usage Examples:

#### Single Image Upload:
```javascript
const { uploadImage } = require('./utils/imageUploadUtil');

const options = {
  fieldName: 'profileImage',
  contentType: 'users',
  compressionRatio: 85 // 15% compression
};

await uploadImage(req, res, options);
```

#### Multiple Video Upload:
```javascript
const { uploadMultipleVideos } = require('./utils/imageUploadUtil');

const options = {
  fieldName: 'tutorialVideos',
  contentType: 'courses',
  maxCount: 5
};

await uploadMultipleVideos(req, res, options);
```

### Flexible Configuration Options:
- `fieldName`: Form field name for the file input
- `contentType`: Folder organization (e.g., 'users', 'products')
- `compressionRatio`: Image quality level (0-100)
- `maxCount`: Maximum number of files for multiple uploads
- `allowedTypes`: Valid file MIME types
- `fileSize`: Maximum file size limit

## Image Storage

Images are stored in the file system and referenced in the database:

- **File Storage**: `public/uploads/images/{content-type}/filename.ext`
- **Database Storage**: `uploads/images/{content-type}/filename.ext` (relative path only)
- **Frontend Access**: `/public/uploads/images/{content-type}/filename.ext`

This approach ensures:
- Efficient database storage (only storing relative paths)
- Easy file management and backup
- Simple URL construction for frontend use

## Authentication

The system uses JWT tokens for authentication with refresh token support:

1. Register a new user
2. Login to receive access and refresh tokens
3. Use the access token in the Authorization header for protected routes
4. Refresh the access token using the refresh token when it expires

## Project Structure

```
src/
├── api/             # API versioning system
│   ├── v1/          # Version 1 API
│   ├── v2/          # Version 2 API
│   └── index.js     # Main API router
├── config/          # Configuration files
├── controllers/     # Route controllers
├── docs/            # API documentation
├── middleware/      # Custom middleware
├── models/          # Database models
├── routes/          # API routes
├── services/        # Business logic
├── strategies/      # Passport.js strategies
├── utils/           # Utility functions
└── tests/           # Test files
```

## Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run migrate` - Run database migrations
- `npm run docs` - Generate API documentation
- `npm test` - Run tests

## Technologies Used

- Node.js
- Express.js
- MySQL with Sequelize ORM
- Passport.js for authentication
- JWT for token-based authentication
- Bcrypt for password hashing
- Joi for validation
- Sharp for image compression
- Swagger for API documentation
- Nodemon for development

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Refresh token rotation
- Rate limiting
- Input validation with Joi
- SQL injection prevention through Sequelize
- CORS protection

## License

This project is licensed under the MIT License.

## Repository Setup

To push this project to a GitHub repository, follow these steps:

1. Create a new repository on GitHub named `clinic_backend`
2. Initialize the git repository: `git init`
3. Add all files: `git add .`
4. Commit changes: `git commit -m "Initial commit"`
5. Add the remote origin: `git remote add origin https://github.com/hulcompany/clinic_backend.git`
6. Push to main branch: `git push -u origin main`

Note: Make sure the GitHub repository exists before attempting to push.
#   c l i n i c _ b a c k e n d 
 
 #   c l i n i c _ b a c k e n d 
 

📊 المقارنة بين المسارين:
المسار	النوع	الاستخدام	الحجم	التحديث
/root/clinic-source/backend/	مصدر الكود	للنسخ الاحتياطي والتطوير	أصغر	يدوي
/var/www/clinicsys/backend/	نسخة التشغيل	للإنتاج والخدمة الفعلية	أكبر (يحتوي node_modules)	تلقائي (PM2)

 
