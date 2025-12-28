module.exports = {
  apps: [
    {
      name: 'clinic_backend',
      script: './src/app.js',
      cwd: '/var/www/clinic/backend',
      instances: 'max',
      exec_mode: 'cluster',
      
      // ⭐⭐ الإعدادات العامة ⭐⭐
      env: {
        // ========== إعدادات الخادم ==========
        NODE_ENV: 'development',
        PORT: 4000,
        HOST: '0.0.0.0',
        
        // ========== إعدادات قاعدة البيانات ⭐⭐(عدل هذه القيم)⭐⭐ ==========
        MYSQL_HOST: 'localhost',
        MYSQL_PORT: 3306,
        MYSQL_USER: 'clinic_user',                    // ⭐⭐ غير إلى مستخدمك ⭐⭐
        MYSQL_PASSWORD: 'rouy2025Secure#Password123$4',     // ⭐⭐ غير إلى كلمة مرور قوية ⭐⭐
        MYSQL_DATABASE: 'clinic_db',
        MYSQL_CONNECTION_LIMIT: 10,
        MYSQL_CHARSET: 'utf8mb4',
        
        // ========== JWT وإعدادات المصادقة ⭐⭐(غير هذه الأسرار)⭐⭐ ==========
        JWT_SECRET: 'clinic_jwt_prod_secret_2024_!@#$%^&*()_change_this',
        JWT_EXPIRE: '3h',
        JWT_REFRESH_SECRET: 'clinic_refresh_secret_2024_!@#$%^&*()_change_too',
        JWT_REFRESH_EXPIRE: '30d',
        
        // ========== إعدادات البريد الإلكتروني ⭐⭐(أدخل بياناتك الحقيقية)⭐⭐ ==========
        SMTP_HOST: 'smtp.gmail.com',
        SMTP_PORT: 587,
        SMTP_SECURE: false,
        SMTP_USER: 'your-email@gmail.com',            // ⭐⭐ غير إلى إيميلك ⭐⭐
        SMTP_PASS: 'your-app-specific-password',      // ⭐⭐ غير إلى كلمة مرور التطبيق ⭐⭐
        EMAIL_FROM: 'noreply@samialhasan.com',
        EMAIL_REPLY_TO: 'support@samialhasan.com',
        
        // ========== مسارات الملفات والوسائط ==========
        UPLOAD_BASE_PATH: '/var/www/clinic/backend/public/uploads/',
        UPLOAD_IMAGES_PATH: '/var/www/clinic/backend/public/uploads/images/',
        UPLOAD_VIDEOS_PATH: '/var/www/clinic/backend/public/uploads/videos/',
        UPLOAD_AUDIOS_PATH: '/var/www/clinic/backend/public/uploads/audios/',
        MAX_UPLOAD_SIZE: '50mb',
        
        // ========== روابط الويب ==========
        DOMAIN: 'https://samialhasan.com',
        CLIENT_URL: 'https://samialhasan.com',
        API_BASE_URL: 'https://samialhasan.com/api',
        API_VERSION: 'v1',
        
        // ========== WebSocket ==========
        WS_PORT: 4001,                                // ⭐⭐ غير من 3001 إلى 4001 ⭐⭐
        WS_CORS_ORIGIN: 'https://samialhasan.com',
        WS_PING_INTERVAL: 30000,
        WS_PING_TIMEOUT: 5000,
        
        // ========== إعدادات التطبيق ==========
        APP_NAME: 'Clinic Management System',
        APP_VERSION: '1.0.0',
        TIMEZONE: 'Europe/London',
        LOG_LEVEL: 'debug',
        
        // ========== إعدادات الأمان ⭐⭐(غير هذه القيم)⭐⭐ ==========
        // معناه: 100 طلب في الدقيقة لكل IP
        // لمنع: هجمات DDoS، Brute Force، إساءة استخدام API
        API_RATE_LIMIT: 100,
        //   قوة تشفير كلمات المرور  
       // 12 = 2^12 = 4096 دورة تشفير
       // كلما زاد الرقم = أقوى ولكن أبطأ
       //   في bcrypt
        PASSWORD_SALT_ROUNDS: 10,
        // يستخدم لتشفير: بيانات بطاقات الائتمان، رسائل خاصة، ملفات حساسة
        CRYPTO_SECRET_KEY: 'k5G8fL2pQ9wR1tY7uI3oP6aZ4xV0cN9bM',
        
        // ========== إعدادات التخزين المؤقت ==========
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6379,
        REDIS_PASSWORD: '',                           // ⭐⭐ إذا كان لديك Redis ⭐⭐
        CACHE_TTL: 3600,
        
        // ========== خدمات خارجية (API Keys) ⭐⭐(أضف مفاتيحك)⭐⭐ ==========
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
        PORT: 4000,                                   // ⭐⭐ تأكد أنه 4000 ⭐⭐
        LOG_LEVEL: 'error',
        
        // ⭐⭐ إعدادات قاعدة بيانات الإنتاج ⭐⭐
        MYSQL_HOST: 'localhost',
        MYSQL_USER: 'clinic_user',               // ⭐⭐ مستخدم مختلف للإنتاج ⭐⭐
        MYSQL_PASSWORD: 'rouy2025Secure#Password123$4',      // ⭐⭐ كلمة مرور أقوى ⭐⭐
        
        // ⭐⭐ أسرار JWT للإنتاج (مختلفة عن التطوير) ⭐⭐
        JWT_SECRET: 'clinic_prod_jwt_2025_' + require('crypto').randomBytes(32).toString('hex'),
        JWT_REFRESH_SECRET: 'clinic_prod_refresh_20245_' + require('crypto').randomBytes(32).toString('hex'),
        
        // ⭐⭐ إعدادات البريد للإنتاج ⭐⭐
        SMTP_USER: 'production@samialhasan.com',      // ⭐⭐ إيميل الإنتاج ⭐⭐
        SMTP_PASS: 'ProdEmailPass123!@#',
        
        // ⭐⭐ WebSocket للإنتاج ⭐⭐
        WS_PORT: 4001,                                // ⭐⭐ تأكد أنه 4001 ⭐⭐
        
        // ⭐⭐ إعدادات المراقبة ⭐⭐
        LOG_LEVEL: 'warn',
        ENABLE_METRICS: true,
        SENTRY_DSN: ''                                // ⭐⭐ أضف DSN إذا كنت تستخدم Sentry ⭐⭐
      },
      
      // ========== إعدادات PM2 ==========
      error_file: '/var/www/clinic/backend/logs/err.log',
      out_file: '/var/www/clinic/backend/logs/out.log',
      log_file: '/var/www/clinic/backend/logs/combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      time: true,
      
      // ========== إعدادات الأداء ==========
      max_restarts: 10,
      min_uptime: '30s',
      max_memory_restart: '2G',
      kill_timeout: 5000,
      listen_timeout: 8000,
      
      // ========== إعدادات Node.js ==========
      node_args: [
        '--max-old-space-size=4096',
        '--inspect=0.0.0.0:9229'
      ],
      interpreter_args: '--harmony',
      
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
    },
    
    // ⭐⭐ تطبيق Worker منفصل للمهام الثقيلة (اختياري) ⭐⭐
    {
      name: 'clinic_worker',
      script: './src/workers/main.js',
      cwd: '/var/www/clinic/backend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        WORKER_TYPE: 'jobs',
        REDIS_HOST: 'localhost'
      }
    }
  ],
  
  // ⭐⭐ إعدادات النشر (Deployment) ⭐⭐
  deploy: {
    production: {
      user: 'root',
      host: ['your-server-ip'],
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/clinic-backend.git',
      path: '/var/www/clinic/backend',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      env: {
        NODE_ENV: 'production'
      }
    }
  }
};