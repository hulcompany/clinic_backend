/**
 * Telegram Bot Controller
 * Handles incoming Telegram bot messages and updates user Telegram chat IDs
 */

const { User, Admin } = require('../../models/index');
const TelegramBot = require('node-telegram-bot-api');

// Initialize bot with token from environment
const token = process.env.TELEGRAM_BOT_TOKEN;
let bot = null;

if (token) {
  bot = new TelegramBot(token, { polling: true });
  
  // Handle incoming messages
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const userName = msg.from.first_name || msg.from.username || 'User';
    const messageText = msg.text || '';
    
    console.log('Received Telegram message:', {
      chatId: chatId,
      userId: userId,
      userName: userName,
      messageText: messageText,
      timestamp: new Date()
    });
    
    try {
      // Check if this is a command to link account
      if (messageText.startsWith('/link')) {
        // Extract phone number from command: /link +1234567890
        const phoneNumber = messageText.split(' ')[1];
        
        if (phoneNumber) {
          // Security approach: Check if phone exists in our database first
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
          
          // Critical security check: Verify this Telegram session owns this phone number
          const sessionOwner = await User.findOne({ 
            where: { 
              telegram_chat_id: chatId.toString(),
              phone: phoneNumber  // Must match both chat ID and phone
            } 
          });
          
          const adminSessionOwner = await Admin.findOne({ 
            where: { 
              telegram_chat_id: chatId.toString(),
              phone: phoneNumber
            } 
          });
          
          if (!sessionOwner && !adminSessionOwner) {
            await bot.sendMessage(chatId, `🔒 Security Error!

This phone number (${phoneNumber}) is not registered to your Telegram account.

For security reasons, you can only link accounts that belong to you.`);
            return;
          }
          
          // REALISTIC SECURITY APPROACH - DATABASE VERIFICATION
          console.log('SECURITY CHECK: Using database verification approach...');
          
          // First verify the phone number exists in our database
          let dbUser = await User.findOne({ where: { phone: phoneNumber } });
          let dbAdmin = null;
          
          if (!dbUser) {
            dbAdmin = await Admin.findOne({ where: { phone: phoneNumber } });
          }
          
          if (!dbUser && !dbAdmin) {
            await bot.sendMessage(chatId, `❌ Account not found!

No account found with phone number: ${phoneNumber}

Please make sure you registered with this phone number.`);
            return;
          }
          
          // Verify this Telegram session owns this account
          const existingSessionOwner = await User.findOne({ 
            where: { 
              telegram_chat_id: chatId.toString(),
              phone: phoneNumber
            } 
          });
          
          const existingAdminSessionOwner = await Admin.findOne({ 
            where: { 
              telegram_chat_id: chatId.toString(),
              phone: phoneNumber
            } 
          });
          
          if (!existingSessionOwner && !existingAdminSessionOwner) {
            await bot.sendMessage(chatId, `🔒 Security Error!

This phone number (${phoneNumber}) is not registered to your Telegram account.

For security reasons, you can only link accounts that belong to you.`);
            return;
          }
          
          console.log('Database verification passed for phone:', phoneNumber);
          
          // Try to find user by phone number
          // Use existing dbUser/dbAdmin from above
          
          if (dbUser) {
            // Update user's Telegram chat ID
            await user.update({ telegram_chat_id: chatId.toString() });
            
            // Send confirmation message
            await bot.sendMessage(chatId, `✅ Account linked successfully!\n\nHello ${user.full_name || userName}, your Telegram account has been linked to your clinic account. You will now receive OTP codes and notifications directly here.`);
            
            console.log(`User with phone ${phoneNumber} linked to Telegram chat ID: ${chatId}`);
          } else if (admin) {
            // Update admin's Telegram chat ID
            await admin.update({ telegram_chat_id: chatId.toString() });
            
            // Send confirmation message
            await bot.sendMessage(chatId, `✅ Admin account linked successfully!\n\nHello ${admin.full_name || userName}, your Telegram account has been linked to your clinic admin account. You will now receive OTP codes and notifications directly here.`);
            
            console.log(`Admin with phone ${phoneNumber} linked to Telegram chat ID: ${chatId}`);
          } else {
            await bot.sendMessage(chatId, `❌ Account not found!

No account found with phone number: ${phoneNumber}

Please make sure you registered with this phone number.`);
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
    // Try to find user by phone number
    let user = await User.findOne({ where: { phone: phoneNumber } });
    let admin = null;
    
    if (!user) {
      admin = await Admin.findOne({ where: { phone: phoneNumber } });
    }
    
    if (user) {
      await user.update({ telegram_chat_id: telegramChatId });
      console.log(`User with phone ${phoneNumber} linked to Telegram chat ID: ${telegramChatId}`);
      return true;
    } else if (admin) {
      await admin.update({ telegram_chat_id: telegramChatId });
      console.log(`Admin with phone ${phoneNumber} linked to Telegram chat ID: ${telegramChatId}`);
      return true;
    } else {
      console.error(`No user or admin found with phone number: ${phoneNumber}`);
      return false;
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
