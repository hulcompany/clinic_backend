# Reviews Feature Documentation

## Overview
The Reviews feature allows users to submit ratings and comments about their experiences with the clinic. This feature includes full CRUD operations with role-based access control.

## Database Schema

### reviews Table
``sql
CREATE TABLE reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  rating TINYINT NOT NULL COMMENT 'Rating from 1 to 5 stars',
  comment JSON NOT NULL COMMENT 'Review comment in different languages {"ar": "التعليق", "en": "Comment"}',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign key constraint
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- Add constraint to ensure rating is between 1 and 5
  CONSTRAINT chk_rating CHECK (
    rating >= 1 AND rating <= 5
  )
);
```

## API Endpoints

### Public Endpoints

#### Get All Reviews
- **Method**: GET
- **URL**: `/api/v1/reviews`
- **Query Parameters**:
  - `page` (integer, default: 1) - Page number
  - `limit` (integer, default: 10, max: 100) - Number of reviews per page
  - `includeInactive` (boolean, default: false) - Include inactive reviews
- **Response**: Paginated list of active reviews with user information

#### Get Review By ID
- **Method**: GET
- **URL**: `/api/v1/reviews/:id`
- **Response**: Single review with user information

#### Get Reviews By User ID
- **Method**: GET
- **URL**: `/api/v1/reviews/user/:userId`
- **Query Parameters**:
  - `page` (integer, default: 1) - Page number
  - `limit` (integer, default: 10, max: 100) - Number of reviews per page
  - `includeInactive` (boolean, default: false) - Include inactive reviews
- **Response**: Paginated list of reviews by user

#### Get Average Rating
- **Method**: GET
- **URL**: `/api/v1/reviews/average-rating`
- **Response**: Average rating and total number of reviews

### Authenticated Endpoints

#### Create Review
- **Method**: POST
- **URL**: `/api/v1/reviews`
- **Authentication**: Required (Bearer Token)
- **Authorization**: 
  - Regular users: Creates review for themselves
  - Doctors/Admins/Super Admins: Can create reviews for any user by specifying `user_id`
- **Body**:
  ```json
  {
    "rating": 5,
    "comment": {
      "ar": "خدمة ممتازة جداً!",
      "en": "Excellent service!"
    },
    "user_id": 123  // Optional: Only for doctors, admins, and super admins to create reviews for other users
  }
  ```
- **Response**: Created review with user information

#### Update Review
- **Method**: PUT
- **URL**: `/api/v1/reviews/:id`
- **Authentication**: Required (Bearer Token)
- **Authorization**: Owner of review OR Doctor OR Admin OR Super Admin
- **Body**:
  ```json
  {
    "rating": 4,
    "comment": {
      "ar": "خدمة جيدة",
      "en": "Good service"
    }
  }
  ```
- **Response**: Updated review with user information

#### Delete Review
- **Method**: DELETE
- **URL**: `/api/v1/reviews/:id`
- **Authentication**: Required (Bearer Token)
- **Authorization**: Owner of review OR Doctor OR Admin OR Super Admin
- **Response**: Success message

### Owner/Professional Endpoints

#### Toggle Review Status
- **Method**: PUT
- **URL**: `/api/v1/reviews/:id/toggle-status`
- **Authentication**: Required (Bearer Token)
- **Authorization**: Owner/Doctor/Admin/Super Admin only
- **Response**: Updated review with new status

## Role-Based Access Control

| Action | User | Doctor | Admin | Super Admin |
|--------|------|--------|-------|-------------|
| View all reviews | ✅ | ✅ | ✅ | ✅ |
| View inactive reviews | ❌ | ❌ | ✅ | ✅ |
| Create review | ✅ | ✅ | ✅ | ✅ |
| Update own review | ✅ | ✅ | ✅ | ✅ |
| Update any review | ❌ | ✅ | ✅ | ✅ |
| Delete own review | ✅ | ✅ | ✅ | ✅ |
| Delete any review | ❌ | ✅ | ✅ | ✅ |
| Toggle own review status | ✅ | ✅ | ✅ | ✅ |
| Toggle any review status | ❌ | ✅ | ✅ | ✅ |

## Data Models

### Review Model (Sequelize)
```javascript
const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id'
  },
  rating: {
    type: DataTypes.TINYINT,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    },
    field: 'rating'
  },
  comment: {
    type: DataTypes.JSON,
    allowNull: false,
    field: 'comment'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
});
```

## Sample Data

### Sample Review Record
```json
{
  "id": 1,
  "user_id": 2,
  "rating": 5,
  "comment": {
    "ar": "خدمة ممتازة جداً! الفريق طبي محترف ومرحب به.",
    "en": "Excellent service! Professional and welcoming medical team."
  },
  "is_active": true,
  "created_at": "2023-05-15T10:30:00.000Z",
  "updated_at": "2023-05-15T10:30:00.000Z",
  "User": {
    "user_id": 2,
    "full_name": "Ahmad Hassan",
    "email": "ahmad@example.com",
    "phone": "+962791234567",
    "image": "user-2-profile.jpg"
  }
}
```

## Implementation Files

1. **Migration**: `src/database/migrations/14-create-reviews-table.sql`
2. **Seeder**: `src/database/seeds/07-reviews-seed.sql`
3. **Model**: `src/models/Review.js`
4. **Repository**: `src/repositories/review.repository.js`
5. **Service**: `src/services/review.service.js`
6. **Controller**: `src/controllers/review.controller.js`
7. **Routes**: `src/routes/review.routes.js`
8. **API Index**: Updates to `src/api/v1/index.js` and `src/app.js`

## Testing

Run tests with:
```bash
npm test review.test.js
```

## Notes

1. Reviews use soft deletion (setting `is_active` to false) rather than hard deletion
2. Comments support multilingual content using JSON format
3. Ratings are constrained to 1-5 stars
4. All timestamps are automatically managed by the database
5. User information is included in review responses for better UX