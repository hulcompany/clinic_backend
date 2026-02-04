/**
 * Telegram Bot Configuration
 * 
 * This file contains the Telegram bot configuration and initialization.
 */

const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// Get bot token from environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

let bot = null;

if (TELEGRAM_BOT_TOKEN) {
  try {
    // Initialize bot in polling mode for development
    bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
    
    console.log('✅ Telegram bot initialized successfully');
    
    // Handle errors
    bot.on('polling_error', (error) => {
      console.error('Telegram polling error:', error);
    });
    
    bot.on('error', (error) => {
      console.error('Telegram bot error:', error);
    });
    
  } catch (error) {
    console.error('Failed to initialize Telegram bot:', error);
    bot = null;
  }
} else {
  console.warn('⚠️ TELEGRAM_BOT_TOKEN not found in environment variables');
  bot = null;
}

module.exports = {
  bot,
  TELEGRAM_BOT_TOKEN
};
