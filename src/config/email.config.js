module.exports = {
    // SMTP Settings
    smtp: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    },

    // Template Settings
    templates: {
        defaultFrom: `"Authentication System" <${process.env.EMAIL_FROM}>`,
        defaultReplyTo: process.env.EMAIL_REPLY_TO || process.env.SMTP_USER,
        paths: {
            welcome: 'welcome.html',
            reset: 'password-reset.html',
            loginAlert: 'login-alert.html',
            locked: 'account-locked.html'
        }
    },

    // Retry Settings
    retry: {
        maxAttempts: 3,
        delay: 2000, // milliseconds
        backoff: true // Double delay with each attempt
    },

    // Sending Limits
    limits: {
        rateLimit: 100, // emails per hour
        bulkDelay: 100, // milliseconds between sends
        maxRecipients: 50 // maximum recipients per email
    },

    // Tracking and Analytics
    tracking: {
        enabled: true,
        openTracking: true,
        clickTracking: true
    },

    // Email Validation
    validation: {
        checkMx: true,
        checkDisposable: true,
        timeout: 5000
    }
};