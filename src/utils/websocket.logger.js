/**
 * WebSocket Logger Utility
 * 
 * This module provides structured logging for WebSocket operations
 * with different log levels and formatting.
 */

const winston = require('winston');
const path = require('path');

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
      const logMessage = `${timestamp} [WEBSOCKET] ${level.toUpperCase()}: ${message}`;
      return stack ? `${logMessage}\n${stack}` : logMessage;
    })
  ),
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // Write all logs to file
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/websocket.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    })
  ]
});

// Ensure logs directory exists
const fs = require('fs');
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

class WebSocketLogger {
  constructor() {
    this.logger = logger;
  }

  /**
   * Log connection events
   */
  logConnection(socketId, event, details = {}) {
    this.logger.info(`Socket ${socketId} ${event}`, {
      socketId,
      event,
      ...details
    });
  }

  /**
   * Log chat room events
   */
  logChatEvent(chatId, userId, event, details = {}) {
    this.logger.info(`Chat ${chatId} User ${userId} ${event}`, {
      chatId,
      userId,
      event,
      ...details
    });
  }

  /**
   * Log message events
   */
  logMessage(chatId, messageId, event, details = {}) {
    this.logger.info(`Chat ${chatId} Message ${messageId} ${event}`, {
      chatId,
      messageId,
      event,
      ...details
    });
  }

  /**
   * Log errors
   */
  logError(error, context, details = {}) {
    this.logger.error(`${context}: ${error.message}`, {
      context,
      error: error.message,
      stack: error.stack,
      ...details
    });
  }

  /**
   * Log warnings
   */
  logWarning(message, details = {}) {
    this.logger.warn(message, details);
  }

  /**
   * Log debug information
   */
  logDebug(message, details = {}) {
    this.logger.debug(message, details);
  }

  /**
   * Log statistics
   */
  logStats(stats) {
    this.logger.info('WebSocket Statistics', stats);
  }
}

module.exports = new WebSocketLogger();