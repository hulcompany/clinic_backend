# Token Management System

## Table of Contents
1. [Token Durations](#token-durations)
2. [Blacklist Process](#blacklist-process)
3. [Cleanup Process](#cleanup-process)

## Token Durations

### Access Tokens
- **Duration**: 1 hour
- **Purpose**: Used for authenticating API requests
- **Storage**: Stored in memory/client-side only
- **Auto-renewal**: Can be renewed using refresh tokens

### Refresh Tokens
- **Duration**: 7 days
- **Purpose**: Used to obtain new access tokens without re-authentication
- **Storage**: Stored securely on the client-side
- **Security**: Each user can have only one active refresh token at a time

### Blacklisted Tokens
- **Duration**: Varies based on original token expiration
- **Purpose**: Track invalidated tokens to prevent reuse
- **Storage**: Database table (`blacklisted_tokens`)

## Blacklist Process

### When Tokens Are Blacklisted
1. **User Logout**: When a user logs out, their current access token is blacklisted
2. **Token Compromise**: If a token is suspected to be compromised
3. **Session Termination**: When an administrator terminates a user session

### Blacklist Implementation
``javascript
// Process when user logs out
1. Extract token from Authorization header
2. Verify token validity
3. Extract expiration time from token payload
4. Store token in blacklisted_tokens table with:
   - token: The actual JWT token string
   - expiresAt: Token's original expiration time
   - createdAt: Current timestamp
```

### Blacklist Checking
Every request to a protected route goes through:
1. **Blacklist Check**: Verify token is not in blacklist table
2. **Token Verification**: Validate token signature and expiration
3. **User Authentication**: Confirm user exists and is active

## Cleanup Process

### Purpose
Maintain database performance by removing expired blacklisted tokens that are no longer needed.

### Schedule
- **Frequency**: Weekly (Every Sunday at 2:00 AM)
- **Retention Period**: 1 hour for recently blacklisted tokens

### Cleanup Logic
The cleanup process removes tokens that meet BOTH conditions:
1. **Expired**: Token's `expiresAt` is before current time
2. **Old Enough**: Token's `createdAt` is more than 1 hour ago

### Why This Approach?
1. **Security**: Recently blacklisted tokens (within 1 hour) are preserved to prevent race conditions
2. **Performance**: Old expired tokens are removed to keep the blacklist table small
3. **Reliability**: Valid tokens are never accidentally removed

### Example Scenario
```
Token Created: 2025-12-13 14:00:00
Token Expires: 2025-12-13 15:00:00
User Logout:   2025-12-13 14:30:00 (Added to blacklist)
Cleanup Time:  2025-12-13 16:00:00

Result: Token WILL be cleaned up because:
- ✓ Expired (15:00 < 16:00)
- ✓ Old enough (14:30 < 15:00)
```

### Manual Cleanup
You can manually trigger cleanup using:
``bash
node -e "const { tokenService } = require('./src/services/index'); tokenService.cleanupExpiredBlacklistedTokens().then(result => console.log('Cleaned up', result, 'tokens')).catch(console.error);"
```

## Best Practices

### For Frontend Developers
1. Implement automatic token renewal when access tokens expire
2. Store refresh tokens securely (HttpOnly cookies recommended)
3. Clear all tokens from storage on logout
4. Handle 401 responses appropriately

### For Backend Developers
1. Always check the blacklist before token verification
2. Ensure proper error handling for expired/invalid tokens
3. Monitor blacklist table size for performance issues
4. Log token operations for security auditing

## Configuration

### Environment Variables
```env
JWT_EXPIRE=1h          # Access token duration
JWT_REFRESH_EXPIRE=7d  # Refresh token duration
```

### Database Schema
```sql
CREATE TABLE blacklisted_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at)
);