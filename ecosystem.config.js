require('dotenv').config();

module.exports = {
  apps: [
    {
      name: 'clinic_backend',
      script: './src/app.js',
      cwd: '/root/clinic-source/backend',
      instances: 1, // ⬅️ غير من 'max' إلى 1 لتجنب مشاكل الذاكرة
      exec_mode: 'fork', // ⬅️ غير من 'cluster' إلى 'fork' للتشخيص الأسهل
      
      // ⭐⭐ الإعدادات العامة ⭐⭐
      env: {
        // ========== إعدادات الخادم ==========
        NODE_ENV: 'development',
        PORT: 4000,
        HOST: '0.0.0.0',
        
        // ========== إعدادات قاعدة البيانات ⭐⭐(تم التعديل)⭐⭐ ==========
        MYSQL_HOST: '127.0.0.1',
        MYSQL_PORT: 3306,
        MYSQL_USER: 'root',
        MYSQL_PASSWORD: 'Driv+123o',
        MYSQL_DATABASE: 'clinic_db',
        MYSQL_CONNECTION_LIMIT: 10,
        MYSQL_CHARSET: 'utf8mb4',
        
        // ========== JWT وإعدادات المصادقة ⭐⭐(تم التعديل)⭐⭐ ==========
        JWT_SECRET: 'clinic_jwt_prod_secret_2024_!@#$%^&*()_change_this',
        JWT_EXPIRE: '24h',
        JWT_REFRESH_SECRET: 'clinic_refresh_secret_2024_!@#$%^&*()_change_too',
        JWT_REFRESH_EXPIRE: '30d',
        
        // ========== إعدادات البريد الإلكتروني ⭐⭐(عدل حسب حاجتك)⭐⭐ ==========
        SMTP_HOST: 'smtp.gmail.com',
        SMTP_PORT: 587,
        SMTP_SECURE: false,
        SMTP_USER: 'vistsyria@gmail.com',
        SMTP_PASS: 'ruqvxelvigdqqwkq',
        EMAIL_FROM: 'vistsyria@gmail.com',
        EMAIL_REPLY_TO: 'vistsyria@gmail.com',
        TELEGRAM_BOT_TOKEN: '8550372816:AAGS3-1WB2YBo70g63_RBrH1rjYWYXpCJS8',
        TELEGRAM_CHAT_ID: '-1003519619799',

      
          
        // ========== مسارات الملفات والوسائط ==========
        UPLOAD_BASE_PATH: '/root/clinic-source/backend/public/uploads/',
        UPLOAD_IMAGES_PATH: '/root/clinic-source/backend/public/uploads/images/',
        UPLOAD_VIDEOS_PATH: '/root/clinic-source/backend/public/uploads/videos/',
        UPLOAD_AUDIOS_PATH: '/root/clinic-source/backend/public/uploads/audios/',
        MAX_UPLOAD_SIZE: '50mb',
        
        // ========== روابط الويب ==========
        DOMAIN: 'https://samialhasan.com',
        CLIENT_URL: 'https://samialhasan.com',
        API_BASE_URL: 'https://samialhasan.com/api',
        API_VERSION: 'v1',
        
        // ========== WebSocket ==========
        WS_PORT: 4002,
        WS_CORS_ORIGIN: 'https://samialhasan.com',
        WS_PING_INTERVAL: 15000,
        WS_PING_TIMEOUT: 30000,
        /*

التعديل	من	إلى	التأثير
max-old-space-size	4096 (4GB)	256 (256MB)	✅ قللت الذاكرة المسموحة
WebSocket ping	30000/5000	15000/30000	✅ قللت اتصالات ping
instances	max	1	✅ منع تكرار العمليات

        */
        // ========== إعدادات التطبيق ==========
        APP_NAME: 'Clinic Management System',
        APP_VERSION: '1.0.0',
        TIMEZONE: 'Europe/London',
        LOG_LEVEL: 'debug',
        
        // ========== إعدادات الأمان ==========
        API_RATE_LIMIT: 100,
        PASSWORD_SALT_ROUNDS: 10,
        CRYPTO_SECRET_KEY: 'k5G8fL2pQ9wR1tY7uI3oP6aZ4xV0cN9bM',
        
        // ========== إعدادات التخزين المؤقت ==========
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6379,
        REDIS_PASSWORD: '',
        CACHE_TTL: 3600,
        
        // ========== خدمات خارجية (API Keys) ==========
        GOOGLE_API_KEY: '',
        STRIPE_SECRET_KEY: '',
        AWS_ACCESS_KEY_ID: '',
        AWS_SECRET_ACCESS_KEY: '',
        AWS_REGION: 'us-east-1',
        AWS_BUCKET_NAME: 'clinic-uploads'
      },
      
      // ⭐⭐ إعدادات الإنتاج (تتجاوز الإعدادات العامة) ⭐⭐
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
        LOG_LEVEL: 'error',
        NEXT_PORT: 4003,

    // ⭐⭐ أضف هذه الإعدادات الجديدة ⭐⭐
        GC_INTERVAL: '600000', // كل 10 دقائق (600000 مللي ثانية)
        GC_LOG_LEVEL: 'info',
        MONITOR_MEMORY: 'true',
          
        // ⭐⭐ إعدادات قاعدة بيانات الإنتاج ⭐⭐
        MYSQL_HOST: '127.0.0.1',
        MYSQL_USER: 'root',
        MYSQL_PASSWORD: 'Driv+123o',
        
        // ⭐⭐ أسرار JWT للإنتاج ⭐⭐
        JWT_SECRET:process.env.JWT_SECRET || 'clinic_jwt_prod_secret_2024_!@#$%^&*()_change_this',
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'clinic_refresh_secret_2024_!@#$%^&*()_change_too',
                
        // ⭐⭐ إعدادات البريد للإنتاج ⭐⭐
        SMTP_USER: 'vistsyria@gmail.com',
        SMTP_PASS: 'ruqvxelvigdqqwkq',
         
        TELEGRAM_BOT_TOKEN: '8550372816:AAGS3-1WB2YBo70g63_RBrH1rjYWYXpCJS8',
        TELEGRAM_CHAT_ID: '-1003519619799',
        
        // ⭐⭐ WebSocket للإنتاج ⭐⭐
        WS_PORT: 4002,
        
        // ⭐⭐ إعدادات المراقبة ⭐⭐
        LOG_LEVEL: 'warn',
        ENABLE_METRICS: true,
        SENTRY_DSN: ''
      },
      
      // ========== إعدادات PM2 ==========
      error_file: '/root/clinic-source/backend/logs/err.log',
      out_file: '/root/clinic-source/backend/logs/out.log',
      log_file: '/root/clinic-source/backend/logs/combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      time: true,
      
      // ========== إعدادات الأداء ==========
      max_restarts: 10,
      min_uptime: '30s',
      max_memory_restart: '1G', // ⬅️ خففت من 2G إلى 1G
      kill_timeout: 5000,
      listen_timeout: 8000,
      
      // ========== إعدادات Node.js ==========
      node_args: [
        '--max-old-space-size=300',  // ⬅️ 300MB بدلاً من 4GB (كان كبيراً جداً)
        '--min-semi-space-size=32',   // ⬅️ جديد: تحديد الحد الأدنى
        '--max-semi-space-size=64',   // ⬅️ جديد: تحديد الحد الأقصى
        '--expose-gc'  // ⬅️ إضافة لتفعيل Garbage Collection يدوياً
      ],

      
      // ========== إعدادات إضافية ==========
      autorestart: true,
      watch: false,
      ignore_watch: [
        'node_modules',
        'logs',
        'public/uploads',
        '.git'
      ],
      source_map_support: true,
      instance_var: 'INSTANCE_ID',
      vizion: true,
      
      // ========== إعدادات البيئة ==========
      env_development: {
        NODE_ENV: 'development',
        PORT: 4000,
        LOG_LEVEL: 'debug',
        ENABLE_SWAGGER: true
      },
      
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 4000,
        LOG_LEVEL: 'info'
      }
    }
  ],
  
  // ⭐⭐ إعدادات النشر (Deployment) ⭐⭐
  deploy: {
    production: {
      user: 'root',
      host: ['72.60.129.26'],
      ref: 'origin/main',
      repo: 'git@github.com:hulcompany/clinic_backend.git',
      path: '/root/clinic-source/backend', // ⬅️ غير المسار إلى الجديد
      'pre-deploy': 'git fetch --all',
      'post-deploy': 'npm install --production && pm2 reload ecosystem.config.js --env production',
      env: {
        NODE_ENV: 'production'
      },
      ssh_options: ['StrictHostKeyChecking=no', 'PasswordAuthentication=no']
    }
  }
};















