/**
 * Telegram Bot Controller
 * Handles all Telegram bot interactions and commands
 */

const TelegramBot = require('node-telegram-bot-api');
const { User, Admin } = require('../../models');
const { Op } = require('sequelize');
require('dotenv').config();

// Initialize bot
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
let bot = null;

if (TELEGRAM_BOT_TOKEN) {
  try {
    bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
    
    // Handle incoming messages
    bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      const messageText = msg.text;
      const userName = msg.from.first_name || 'User';
      
      try {
        if (messageText && messageText.startsWith('/link')) {
          // Extract phone number from command
          const parts = messageText.split(' ');
          if (parts.length >= 2) {
            const phoneNumber = parts[1];
            
            // Validate phone number format
            if (!phoneNumber.match(/^\+\d{10,15}$/)) {
              await bot.sendMessage(chatId, `❌ Invalid phone number format!
              
Please use the format: /link +963996183101
              
The phone number should:
• Start with +
• Contain only digits after +
• Be between 10-15 digits total`);
              return;
            }
            
            // Security check: Verify phone number exists in database
            let user = await User.findOne({ where: { phone: phoneNumber } });
            let admin = null;
            
            if (!user) {
              admin = await Admin.findOne({ where: { phone: phoneNumber } });
            }
            
            if (!user && !admin) {
              await bot.sendMessage(chatId, `❌ Account not found!

No account found with phone number: ${phoneNumber}

Please make sure you registered with this phone number.`);
              return;
            }
            
            // Check if this Telegram account is already linked to another user
            const existingLink = await User.findOne({ 
              where: { 
                telegram_chat_id: chatId.toString(),
                phone: { [Op.ne]: phoneNumber }  // Different phone number
              } 
            });
            
            const existingAdminLink = await Admin.findOne({ 
              where: { 
                telegram_chat_id: chatId.toString(),
                phone: { [Op.ne]: phoneNumber }  // Different phone number
              } 
            });
            
            if (existingLink || existingAdminLink) {
              await bot.sendMessage(chatId, `🔒 Security Warning!

This Telegram account is already linked to a different phone number.

For security reasons, each Telegram account can only be linked to one phone number.

If you want to link a different number, please unlink your current account first.`);
              return;
            }
            
            // Check if phone number is already linked to another Telegram account
            const phoneLinkedToOther = await User.findOne({ 
              where: { 
                phone: phoneNumber,
                telegram_chat_id: { [Op.ne]: chatId.toString() },
                telegram_chat_id: { [Op.not]: null }
              } 
            });
            
            const adminPhoneLinkedToOther = await Admin.findOne({ 
              where: { 
                phone: phoneNumber,
                telegram_chat_id: { [Op.ne]: chatId.toString() },
                telegram_chat_id: { [Op.not]: null }
              } 
            });
            
            if (phoneLinkedToOther || adminPhoneLinkedToOther) {
              await bot.sendMessage(chatId, `🔒 Security Warning!

This phone number is already linked to another Telegram account.

For security reasons, each phone number can only be linked to one Telegram account.

If you believe this is an error, please contact our support team.`);
              return;
            }
            
            // Link account
            const success = await linkUserToTelegram(phoneNumber, chatId.toString());
            
            if (success) {
              await bot.sendMessage(chatId, `✅ Account linked successfully!

You can now receive notifications and OTP codes directly in this chat.

To unlink your account later, use the /unlink command.`);
            } else {
              await bot.sendMessage(chatId, `❌ Failed to link account!

Please try again later or contact support if the problem persists.`);
            }
          } else {
            await bot.sendMessage(chatId, `📋 To link your account, use the command:

/link your_phone_number

Example: /link +1234567890`);
          }
        } else if (messageText === '/start' || messageText === '/help') {
          // Send welcome/help message
          const welcomeMessage = `🏥 Welcome to Sami Alhasan Clinic Bot!

To link your clinic account with this Telegram bot:

1. Register or login to the clinic system with your phone number
2. Send me the command: /link your_phone_number

Example: /link +1234567890

After linking, you will receive OTP codes and notifications directly here.`;
          
          await bot.sendMessage(chatId, welcomeMessage);
        } else {
          // Send default response
          await bot.sendMessage(chatId, `👋 Hello ${userName}!

To link your clinic account, please use the command:

/link your_phone_number

Example: /link +1234567890`);
        }
      } catch (error) {
        console.error('Error handling Telegram message:', error.message);
        await bot.sendMessage(chatId, '❌ An error occurred while processing your request. Please try again later.');
      }
    });
    
    console.log('Telegram bot initialized and polling for messages...');
  } catch (error) {
    console.error('Failed to initialize Telegram bot:', error);
    bot = null;
  }
} else {
  console.warn('Telegram bot token not configured. Bot will not start.');
}

/**
 * Function to send message to specific chat ID
 * @param {string} chatId - Telegram chat ID
 * @param {string} message - Message to send
 * @returns {Promise<boolean>} - Success status
 */
const sendTelegramMessage = async (chatId, message) => {
  if (!bot) {
    console.error('Telegram bot not initialized');
    return false;
  }
  
  try {
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    console.log(`Message sent to Telegram chat ID: ${chatId}`);
    return true;
  } catch (error) {
    console.error('Error sending Telegram message:', error.message);
    return false;
  }
};

/**
 * Function to link user with Telegram chat ID
 * @param {string} phoneNumber - User's phone number
 * @param {string} telegramChatId - Telegram chat ID
 * @returns {Promise<boolean>} - Success status
 */
const linkUserToTelegram = async (phoneNumber, telegramChatId) => {
  try {
    // Security check: Verify phone number exists in database
    let user = await User.findOne({ where: { phone: phoneNumber } });
    let admin = null;
    
    if (!user) {
      admin = await Admin.findOne({ where: { phone: phoneNumber } });
    }
    
    if (!user && !admin) {
      console.error(`No user or admin found with phone number: ${phoneNumber}`);
      return false;
    }
    
    // Check if this Telegram account is already linked to another user
    const existingLink = await User.findOne({ 
      where: { 
        telegram_chat_id: telegramChatId,
        phone: { [Op.ne]: phoneNumber }  // Different phone number
      } 
    });
    
    const existingAdminLink = await Admin.findOne({ 
      where: { 
        telegram_chat_id: telegramChatId,
        phone: { [Op.ne]: phoneNumber }  // Different phone number
      } 
    });
    
    if (existingLink || existingAdminLink) {
      console.error(`Telegram account ${telegramChatId} is already linked to a different phone number`);
      return false;
    }
    
    // Check if phone number is already linked to another Telegram account
    const phoneLinkedToOther = await User.findOne({ 
      where: { 
        phone: phoneNumber,
        telegram_chat_id: { [Op.ne]: telegramChatId },
        telegram_chat_id: { [Op.not]: null }
      } 
    });
    
    const adminPhoneLinkedToOther = await Admin.findOne({ 
      where: { 
        phone: phoneNumber,
        telegram_chat_id: { [Op.ne]: telegramChatId },
        telegram_chat_id: { [Op.not]: null }
      } 
    });
    
    if (phoneLinkedToOther || adminPhoneLinkedToOther) {
      console.error(`Phone number ${phoneNumber} is already linked to another Telegram account`);
      return false;
    }
    
    // Update user/admin with Telegram chat ID
    if (user) {
      await user.update({ telegram_chat_id: telegramChatId });
      console.log(`User with phone ${phoneNumber} linked to Telegram chat ID: ${telegramChatId}`);
      return true;
    } else if (admin) {
      await admin.update({ telegram_chat_id: telegramChatId });
      console.log(`Admin with phone ${phoneNumber} linked to Telegram chat ID: ${telegramChatId}`);
      return true;
    }
  } catch (error) {
    console.error('Error linking user to Telegram:', error.message);
    return false;
  }
};

module.exports = {
  bot,
  sendTelegramMessage,
  linkUserToTelegram
};
