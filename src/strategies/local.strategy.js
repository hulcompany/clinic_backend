/**
 * Local Strategy for Passport.js
 * 
 * This file implements the local authentication strategy for Passport.js.
 * It authenticates users using their email/phone and password.
 * 
 * Features:
 * - Supports login with either email or phone number
 * - Validates passwords using bcrypt
 * - Handles cases where users may not have passwords set
 */

const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const { User } = require('../models/index');

/**
 * Local Strategy Implementation
 * 
 * This strategy authenticates users by finding them in the database
 * using either their email or phone number, and then validating
 * their password.
 * 
 * @param {String} email - Email or phone number provided by user
 * @param {String} password - Password provided by user
 * @param {Function} done - Callback function to indicate success/failure
 */
const localStrategy = new LocalStrategy(
  { 
    // Use 'email' field for both email and phone (since we support both)
    usernameField: 'email',
    passwordField: 'password'
  },
  async (email, password, done) => {
    try {
      // Find user by email or phone
      // If the input contains '@', treat it as email, otherwise as phone
      const user = await User.findOne({ 
        where: email.includes('@') ? { email } : { phone: email }
      });
      
      // If no user found
      if (!user) {
        return done(null, false, { message: 'Invalid credentials' });
      }
      
      // Check if password matches (only if password exists)
      if (user.password) {
        // Compare provided password with stored hashed password
        const isMatch = await user.matchPassword(password);
        
        if (isMatch) {
          // Password matches, authentication successful
          return done(null, user);
        } else {
          // Password doesn't match
          return done(null, false, { message: 'Invalid credentials' });
        }
      } else {
        // If no password is set, reject login
        return done(null, false, { message: 'Invalid credentials' });
      }
    } catch (error) {
      // Error occurred during authentication
      return done(error);
    }
  }
);

module.exports = localStrategy;