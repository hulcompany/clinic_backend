// /var/www/clinicsys/backend/health-check.js

const http = require('http');

const options = {
    hostname: 'localhost',
    port: 4000,  // Using the new port from PM2 config
    path: '/health',  // Using the correct health check endpoint
    timeout: 5000
};

const req = http.request(options, (res) => {
    if (res.statusCode === 200) {
        process.exit(0);
    } else {
        process.exit(1);
    }
});

req.on('error', () => {
    process.exit(1);
});

req.end();
