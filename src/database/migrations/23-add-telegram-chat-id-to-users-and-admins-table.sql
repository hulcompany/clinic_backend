-- Add telegram_chat_id column to users table
ALTER TABLE users 
ADD COLUMN telegram_chat_id VARCHAR(50) NULL COMMENT 'Telegram chat ID for the user';

-- Add telegram_chat_id column to admins table
ALTER TABLE admins 
ADD COLUMN telegram_chat_id VARCHAR(50) NULL COMMENT 'Telegram chat ID for the admin';