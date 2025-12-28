/**
 * WebSocket Client Utility for Real-time Chat
 * 
 * This module provides a simplified interface for handling real-time chat
 * functionality using WebSocket connections. It includes features like automatic
 * reconnection, event subscription, message queuing, and error handling.
 * This utility is meant to be used in frontend applications to connect to
 * the real-time chat system.
 */

class WebSocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = {};
  }

  /**
   * Connect to the WebSocket server
   * @param {string} url - WebSocket server URL
   * @param {object} options - Connection options
   */
  connect(url, options = {}) {
    try {
      // Close existing connection if any
      if (this.socket) {
        this.disconnect();
      }

      // Create new WebSocket connection
      this.socket = new WebSocket(url);

      // Set up event handlers
      this.socket.onopen = (event) => this.handleOpen(event);
      this.socket.onmessage = (event) => this.handleMessage(event);
      this.socket.onclose = (event) => this.handleClose(event);
      this.socket.onerror = (event) => this.handleError(event);

      return this.socket;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      throw error;
    }
  }

  /**
   * Handle successful connection
   */
  handleOpen(event) {
    console.log('[WEBSOCKET CLIENT] WebSocket connection established');
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.emit('connected', event);
  }

  /**
   * Handle incoming messages
   */
  handleMessage(event) {
    try {
      const data = JSON.parse(event.data);
      this.emit(data.type || 'message', data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      this.emit('error', { error, message: event.data });
    }
  }

  /**
   * Handle connection close
   */
  handleClose(event) {
    console.log('[WEBSOCKET CLIENT] WebSocket connection closed', event);
    this.isConnected = false;
    this.emit('disconnected', event);

    // Attempt to reconnect if not manually disconnected
    if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.attemptReconnect();
    }
  }

  /**
   * Handle connection errors
   */
  handleError(event) {
    console.error('[WEBSOCKET CLIENT] WebSocket error:', event);
    this.emit('error', event);
  }

  /**
   * Attempt to reconnect
   */
  attemptReconnect() {
    this.reconnectAttempts++;
    console.log(`[WEBSOCKET CLIENT] Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      const url = this.socket.url;
      this.connect(url);
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  /**
   * Send a message through the WebSocket
   * @param {string} type - Message type
   * @param {object} data - Message data
   */
  send(type, data) {
    if (!this.isConnected) {
      console.warn('Cannot send message: WebSocket is not connected');
      return false;
    }

    try {
      const message = JSON.stringify({ type, ...data });
      this.socket.send(message);
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  }

  /**
   * Join a chat room
   * @param {number} userId - User ID
   * @param {number} chatId - Chat ID
   */
  joinChat(userId, chatId) {
    return this.send('join_chat', { userId, chatId });
  }

  /**
   * Leave a chat room
   * @param {number} userId - User ID
   * @param {number} chatId - Chat ID
   */
  leaveChat(userId, chatId) {
    return this.send('leave_chat', { userId, chatId });
  }

  /**
   * Send a chat message
   * @param {number} chatId - Chat ID
   * @param {string} message - Message content
   * @param {number} senderId - Sender ID
   * @param {string} messageType - Type of message (text, image, video, audio)
   * @param {string} fileUrl - URL of file (if applicable)
   */
  sendMessage(chatId, message, senderId, messageType = 'text', fileUrl = null) {
    return this.send('send_message', { 
      chatId, 
      message, 
      senderId, 
      messageType, 
      fileUrl 
    });
  }

  /**
   * Send typing indicator
   * @param {number} chatId - Chat ID
   * @param {number} userId - User ID
   * @param {boolean} isTyping - Typing status
   */
  sendTyping(chatId, userId, isTyping) {
    return this.send('typing', { chatId, userId, isTyping });
  }

  /**
   * Mark message as read
   * @param {number} messageId - Message ID
   * @param {number} userId - User ID
   * @param {number} chatId - Chat ID
   */
  markAsRead(messageId, userId, chatId) {
    return this.send('mark_as_read', { messageId, userId, chatId });
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   */
  off(event, callback) {
    if (!this.listeners[event]) return;
    
    const index = this.listeners[event].indexOf(callback);
    if (index > -1) {
      this.listeners[event].splice(index, 1);
    }
  }

  /**
   * Emit event to listeners
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  emit(event, data) {
    if (!this.listeners[event]) return;
    
    this.listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in WebSocket listener for ${event}:`, error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
  }

  /**
   * Check if connected
   * @returns {boolean} Connection status
   */
  isConnected() {
    return this.isConnected;
  }
}

// Export singleton instance
module.exports = new WebSocketClient();