const passport = require('passport');
const { jwtStrategy } = require('../strategies/jwt.strategy');
const localStrategy = require('../strategies/local.strategy');

// Use strategies
passport.use('jwt', jwtStrategy);
passport.use('local', localStrategy);

// Google OAuth Strategy (placeholder)
// This would be implemented if Google authentication was needed
/*
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });
        
        if (!user) {
            user = await User.create({
                googleId: profile.id,
                email: profile.emails[0].value,
                name: profile.displayName
            });
        }
        
        return done(null, user);
    } catch (error) {
        return done(error, false);
    }
}));
*/

module.exports = passport;