/**
 * Telegram Bot Controller
 * Handles all Telegram bot interactions and commands
 */

const { User, Admin } = require('../../models');
const { Op } = require('sequelize');
const { generateOTP } = require('../../services/authentication/otpService');
const { storeOTP } = require('../../services/authentication/otpService');
const { sendOTPViaTelegram } = require('../../services/authentication/otpService');

// Import bot instance
let bot;
try {
  bot = require('../../config/telegram.config').bot;
} catch (error) {
  console.error('Failed to initialize Telegram bot:', error);
  bot = null;
}

/**
 * Handle incoming messages from Telegram
 */
const handleMessage = async (msg) => {
  if (!bot) {
    console.error('Telegram bot not initialized');
    return;
  }

  const chatId = msg.chat.id;
  const messageText = msg.text;

  try {
    // Handle commands
    if (messageText.startsWith('/')) {
      await handleCommand(chatId, messageText, msg.from);
    } else {
      // Handle regular messages
      await bot.sendMessage(chatId, 'Welcome to Sami Alhasan Clinic bot! Use /help to see available commands.');
    }
  } catch (error) {
    console.error('Error handling Telegram message:', error);
    await bot.sendMessage(chatId, 'Sorry, something went wrong. Please try again later.');
  }
};

/**
 * Handle Telegram commands
 */
const handleCommand = async (chatId, command, fromUser) => {
  const commandParts = command.split(' ');
  const cmd = commandParts[0].toLowerCase();

  switch (cmd) {
    case '/start':
      await handleStartCommand(chatId, fromUser);
      break;
    case '/help':
      await handleHelpCommand(chatId);
      break;
    case '/link':
      await handleLinkCommand(chatId, commandParts.slice(1).join(' '), fromUser);
      break;
    case '/verify':
      await handleVerifyCommand(chatId, commandParts.slice(1).join(' '));
      break;
    case '/unlink':
      await handleUnlinkCommand(chatId);
      break;
    default:
      await bot.sendMessage(chatId, 'Unknown command. Use /help to see available commands.');
  }
};

/**
 * Handle /start command
 */
const handleStartCommand = async (chatId, fromUser) => {
  const welcomeMessage = `
Welcome to Sami Alhasan Clinic!

I'm here to help you with:
• Account verification
• Appointment reminders
• Quick updates

Available commands:
/link +963996183101 - Link your account
/verify 123456 - Verify your account with OTP
/unlink - Unlink your account
/help - Show this help message

Please note: You must first register on our website before linking your account.
  `;
  
  await bot.sendMessage(chatId, welcomeMessage);
};

/**
 * Handle /help command
 */
const handleHelpCommand = async (chatId) => {
  const helpMessage = `
Available Commands:

/link +963996183101
  Link your clinic account to this Telegram account
  Example: /link +963996183101

/verify 123456
  Verify your account using the OTP sent to your email
  Example: /verify 123456

/unlink
  Unlink your clinic account from this Telegram account

/help
  Show this help message

Need help? Contact our support team.
  `;
  
  await bot.sendMessage(chatId, helpMessage);
};

/**
 * Handle /link command
 */
const handleLinkCommand = async (chatId, phoneNumber, fromUser) => {
  try {
    // Validate phone number format
    if (!phoneNumber || !phoneNumber.match(/^\+\d{10,15}$/)) {
      await bot.sendMessage(chatId, `❌ Invalid phone number format!
      
Please use the format: /link +963996183101
      
The phone number should:
• Start with +
• Contain only digits after +
• Be between 10-15 digits total`);
      return;
    }

    // Remove any extra spaces
    phoneNumber = phoneNumber.trim();

    console.log(`LINK COMMAND: Processing link request for ${phoneNumber} from chat ${chatId}`);

    // Security check: Verify phone number exists in database
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

    // Generate and send OTP
    const otpCode = generateOTP();
    
    // Store OTP in database
    const userId = dbUser ? dbUser.user_id : null;
    const adminId = dbAdmin ? dbAdmin.user_id : null;
    
    await storeOTP(userId, adminId, otpCode);
    
    // Send OTP via Telegram
    const userToSend = dbUser || dbAdmin;
    await sendOTPViaTelegram(userToSend, otpCode, 'verification');
    
    // Update user/admin with Telegram chat ID
    if (dbUser) {
      await dbUser.update({ telegram_chat_id: chatId.toString() });
    } else {
      await dbAdmin.update({ telegram_chat_id: chatId.toString() });
    }

    await bot.sendMessage(chatId, `✅ Account linked successfully!

An OTP has been sent to your registered email.

Please use the /verify command with the OTP code to complete verification:
/verify ${otpCode}

Example: /verify 123456`);
    
  } catch (error) {
    console.error('Error in handleLinkCommand:', error);
    await bot.sendMessage(chatId, 'Sorry, something went wrong while linking your account. Please try again later.');
  }
};

/**
 * Handle /verify command
 */
const handleVerifyCommand = async (chatId, otpCode) => {
  try {
    if (!otpCode) {
      await bot.sendMessage(chatId, 'Please provide the OTP code. Usage: /verify 123456');
      return;
    }

    // Find user/admin by Telegram chat ID
    let user = await User.findOne({ where: { telegram_chat_id: chatId.toString() } });
    let admin = null;
    
    if (!user) {
      admin = await Admin.findOne({ where: { telegram_chat_id: chatId.toString() } });
    }

    if (!user && !admin) {
      await bot.sendMessage(chatId, '❌ No linked account found!\n\nPlease link your account first using: /link +963996183101');
      return;
    }

    // Validate OTP
    const userId = user ? user.user_id : null;
    const adminId = admin ? admin.user_id : null;
    const isValid = await validateOTP(userId, adminId, otpCode);

    if (!isValid) {
      await bot.sendMessage(chatId, '❌ Invalid or expired OTP!\n\nPlease check the code and try again.');
      return;
    }

    // Activate account
    if (user) {
      await user.update({ is_active: true });
    } else {
      await admin.update({ is_active: true });
    }

    await bot.sendMessage(chatId, '✅ Account verified successfully!\n\nYou are now ready to use all clinic services.');

  } catch (error) {
    console.error('Error in handleVerifyCommand:', error);
    await bot.sendMessage(chatId, 'Sorry, something went wrong during verification. Please try again later.');
  }
};

/**
 * Handle /unlink command
 */
const handleUnlinkCommand = async (chatId) => {
  try {
    // Find user/admin by Telegram chat ID
    let user = await User.findOne({ where: { telegram_chat_id: chatId.toString() } });
    let admin = null;
    
    if (!user) {
      admin = await Admin.findOne({ where: { telegram_chat_id: chatId.toString() } });
    }

    if (!user && !admin) {
      await bot.sendMessage(chatId, '❌ No linked account found!\n\nYour account is not currently linked to this Telegram account.');
      return;
    }

    // Remove Telegram chat ID
    if (user) {
      await user.update({ telegram_chat_id: null });
    } else {
      await admin.update({ telegram_chat_id: null });
    }

    await bot.sendMessage(chatId, '✅ Account unlinked successfully!\n\nYou can now link a different account if needed.');

  } catch (error) {
    console.error('Error in handleUnlinkCommand:', error);
    await bot.sendMessage(chatId, 'Sorry, something went wrong while unlinking your account. Please try again later.');
  }
};

/**
 * Validate OTP (placeholder - should use actual OTP service)
 */
const validateOTP = async (userId, adminId, otpCode) => {
  // This is a placeholder - implement actual OTP validation
  // For now, accept any 6-digit code for testing
  return otpCode.length === 6 && /^\d+$/.test(otpCode);
};

module.exports = {
  handleMessage,
  handleCommand,
  handleStartCommand,
  handleHelpCommand,
  handleLinkCommand,
  handleVerifyCommand,
  handleUnlinkCommand
};
