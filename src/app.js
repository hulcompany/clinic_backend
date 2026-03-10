/**
 * Clinic Management System - Main Application Entry Point
 * 
 * This file initializes the Express.js server and sets up all required middleware,
 * routes, and real-time WebSocket functionality for the clinic management system.
 * It integrates both REST API endpoints and WebSocket connections for real-time chat.
 */

require('express-async-errors');
require('dotenv').config();
// =============== أضف من هنا ===============
// Garbage Collector manual optimization
/*
1. مفهوم Garbage Collector(جامع القمامة) في Node.js:
هو جزء من محرك V8 (المحرك الذي يشغل JavaScript في Node.js)

وظيفته: تنظيف الذاكرة تلقائياً من الكائنات التي لم تعد مستخدمة
الـ global.gc() مدمج في Node.js، لكنها معطل افتراضياً لأسباب أمنية.
node --expose-gc src/app.js

*/
if (global.gc) {// 1. تحقق إذا كان GC متاحاً
 console.log('🧹 Manual Garbage Collector enabled');
  // تنظيف كل 10 دقائق
  setInterval(() => {// 2. أنشئ مؤقتاً كل 10 دقائق
    global.gc();// 3. استدعِ GC يدوياً
   console.log('🧹 Manual garbage collection executed');
  }, 10 * 60 * 1000);
} else {
 console.log('⚠️ Garbage Collector not available, run with --expose-gc');
}
// =============== إلى هنا ===============
const express = require('express');
const http = require('http');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const passport = require('passport');

// Import internal files
const { sequelize } = require('./config/database');
const passportConfig = require('./config/passport.config');
const { errorHandler } = require('./middleware/errorHandler');
const api = require('./api');
const { startWeeklyCleanupJob, startDailyAppointmentReminderJob } = require('./utils/cleanupJobs');
const WebSocketService = require('./services/chat/websocket.service');
// Initialize Telegram bot
try {
  require('./controllers/authentication/telegramBot.controller');
} catch (error) {
 console.error('Error initializing Telegram bot:', error.message);
}
const app = express();

// Serve static files from the public directory
app.use('/public', express.static(path.join(__dirname, '../public')));

// Initialize Passport
app.use(passport.initialize());
 
// Basic Middleware
const allowedOrigins = [
        "https://samialhasan.com",
        "https://www.samialhasan.com",
        "http://localhost:3666",
        "http://localhost:3000",
        "http://localhost:4000",
        "http://localhost:4001",
        "http://localhost:3001"
];
app.set("trust proxy", 1);
app.use(helmet({
 contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));



app.use(cors({
  origin: (origin, callback) => {
    // السماح لـ server-side requests
   if (!origin) return callback(null, true);

   if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With"
  ]
}));

// Support for preflight OPTIONS requests
app.options("*", cors());


app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Rate Limiting
const limiter= rateLimit({
    windowMs:15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per IP
    standardHeaders: true,
   legacyHeaders: false,
    skipSuccessfulRequests: false,
      // Skip rate limiting for chat endpoints
    skip: (req) => {
       const chatEndpoints = [
            '/chats',
            '/messages',
            '/realtime-chat'
        ];
        
        // Check if request URL contains any chat endpoint
       return chatEndpoints.some(endpoint => 
           req.url.includes(endpoint)
        );
    },
   message: {
        success: false,
       message: 'You have exceeded the request limit. Please try again after 15 minutes'
    }
});

// Apply Rate Limiting (excluding chat endpoints)
app.use('/api/', limiter);

// Welcome screen
app.get('/', (req, res) => {
   res.json({
       message: '🚀 Complete Authentication System',
        version: '1.0.0',
        endpoints: {
           auth: '/api/auth',
           admin: '/api/admin',
           users: '/api/users',
            docs: '/api-docs'
        },
        status: {
           database: '✅ Connected'
        }
    });
});

// System Health
app.get('/health', async (req, res) => {
   const health = {
        status: 'healthy',
       timestamp: new Date().toISOString(),
        services: {
           database: 'connected'
        },
        uptime: process.uptime(),
       memory: process.memoryUsage()
    };

   try {
        // Test database connection
       await sequelize.authenticate();
        health.services.database = 'connected';
    } catch (error) {
        health.services.database = 'disconnected';
        health.status = 'unhealthy';
    }

   res.status(health.status === 'healthy' ? 200 : 503).json(health);
});

// API Routes (using the new versioned API structure)
app.use(`/api/${process.env.API_VERSION || 'v1'}/auth`, api.current.authRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}/admin`, api.current.adminRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}/users`, api.current.userRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}/consultations`, api.current.consultationRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}/contact-us`, api.current.contactUsRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}/chats`, api.current.chatRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}/messages`, api.current.messageRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}/realtime-chat`, api.current.realtimeChatRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}/reviews`, api.current.reviewRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}/services`, api.current.serviceRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}/sessions`, api.current.sessionRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}/availability`, api.current.availabilityRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}/medical-records`, api.current.medicalRecordRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}/blogs`, api.current.blogRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}/notifications`, api.current.notificationRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}/landing-images`, api.current.landingImageRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}/phone-verification`, api.current.phoneVerificationRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}/dashboard`, api.current.dashboardRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}/payments`, api.current.paymentRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}/payment-methods`, api.current.paymentMethodRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}/before-after`, api.current.beforeAfterRoutes);

// API Documentation
const swaggerDocument = YAML.load(path.join(__dirname, './docs/swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 404 Handler
app.use('*', (req, res) => {
   res.status(404).json({
        success: false,
       message: 'Page not found'
    });
});

// Global Error Handler
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 4000;

// Create HTTP server for Express app
const server= http.createServer(app);

// Create separate HTTP server for WebSocket service
const wsPort = process.env.WS_PORT || 4002;
const wsServer= http.createServer();

// Initialize WebSocket service
console.log('[APP] Initializing WebSocket service...');
const websocketService = new WebSocketService(wsServer);
console.log('[APP] WebSocket service initialized');

// Make websocket service available globally
global.websocketService = websocketService;
console.log('[APP] WebSocket service made globally available');

// Start WebSocket server
wsServer.listen(wsPort, () => {
 console.log(`🔌 WebSocket server running on port ${wsPort}`);
});

async function startServer() {
   try {
        // Test database connection
       await sequelize.authenticate();
       console.log('✅ Database connection established');

        // Start the weekly cleanup job
         startWeeklyCleanupJob();
        
        // Start the daily appointment reminder job
        startDailyAppointmentReminderJob();
        
        // Start Server
        server.listen(PORT, () => {
           console.log(`🚀 Server running on port ${PORT}`);
           console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
           console.log(`🏥 Health check: http://localhost:${PORT}/health`);
        });
    } catch (error) {
       console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
}

// Handle application shutdown
process.on('SIGTERM', async () => {
   console.log('🛑 SIGTERM received. Shutting down gracefully...');
    
    process.exit(0);
});

process.on('uncaughtException', (error) => {
   console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
   console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the server
startServer();

module.exports = app;


//npx sequelize-cli db:migrate --name xxx.js
