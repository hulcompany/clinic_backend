/**
 * Real-time Chat Frontend Example
 * 
 * This is a simple example of how to implement real-time chat functionality
 * in a frontend application using the WebSocket client utility.
 */

// Import the WebSocket client utility
const WebSocketClient = require('../utils/websocket.client');

// Initialize the WebSocket client
const wsClient = new WebSocketClient();

// Chat state
let currentUserId = null;
let currentChatId = null;

/**
 * Initialize chat connection
 */
async function initializeChat(consultationId, authToken) {
  try {
    // First, get chat initialization details from API
    const response = await fetch(`/api/v1/realtime-chat/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ consultation_id: consultationId })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to initialize chat');
    }
    
    // Store chat details
    currentChatId = data.data.chat_id;
    currentUserId = getUserIdFromToken(authToken); // Implement this function based on your auth system
    
    // Connect to WebSocket server
    const wsUrl = data.data.ws_url || 'ws://localhost:3000';
    wsClient.connect(`${wsUrl}?token=${authToken}`);
    
    // Set up event listeners
    setupEventListeners();
    
    console.log('Chat initialized successfully');
    return data.data;
  } catch (error) {
    console.error('Failed to initialize chat:', error);
    throw error;
  }
}

/**
 * Set up WebSocket event listeners
 */
function setupEventListeners() {
  // Connection established
  wsClient.on('connected', () => {
    console.log('Connected to chat server');
    
    // Join the chat room
    if (currentChatId && currentUserId) {
      wsClient.joinChat(currentUserId, currentChatId);
    }
  });
  
  // Disconnected
  wsClient.on('disconnected', () => {
    console.log('Disconnected from chat server');
  });
  
  // Receive new message
  wsClient.on('receive_message', (data) => {
    displayMessage(data);
  });
  
  // User typing indicator
  wsClient.on('user_typing', (data) => {
    displayTypingIndicator(data.userId, data.isTyping);
  });
  
  // Message read status
  wsClient.on('message_read', (data) => {
    updateMessageReadStatus(data.messageId, data.readAt);
  });
  
  // User joined chat
  wsClient.on('user_joined', (data) => {
    displayUserStatus(data.userId, 'joined');
  });
  
  // User left chat
  wsClient.on('user_left', (data) => {
    displayUserStatus(data.userId, 'left');
  });
  
  // Error handling
  wsClient.on('error', (error) => {
    console.error('WebSocket error:', error);
    displayError('Connection error occurred');
  });
}

/**
 * Send a message
 */
function sendMessage(content, messageType = 'text', fileUrl = null) {
  if (!currentChatId || !currentUserId) {
    console.error('Chat not initialized');
    return false;
  }
  
  return wsClient.sendMessage(
    currentChatId,
    content,
    currentUserId,
    messageType,
    fileUrl
  );
}

/**
 * Send typing indicator
 */
function sendTyping(isTyping) {
  if (!currentChatId || !currentUserId) {
    return false;
  }
  
  return wsClient.sendTyping(currentChatId, currentUserId, isTyping);
}

/**
 * Mark message as read
 */
function markAsRead(messageId) {
  if (!currentChatId || !currentUserId) {
    return false;
  }
  
  return wsClient.markAsRead(messageId, currentUserId, currentChatId);
}

/**
 * Join chat room
 */
function joinChat() {
  if (!currentChatId || !currentUserId) {
    return false;
  }
  
  return wsClient.joinChat(currentUserId, currentChatId);
}

/**
 * Leave chat room
 */
function leaveChat() {
  if (!currentChatId || !currentUserId) {
    return false;
  }
  
  return wsClient.leaveChat(currentUserId, currentChatId);
}

/**
 * Display a message in the UI
 */
function displayMessage(message) {
  // This is a placeholder - implement based on your UI framework
  console.log('New message received:', message);
  
  // Example DOM manipulation (if in browser environment)
  /*
  const messagesContainer = document.getElementById('messages');
  const messageElement = document.createElement('div');
  messageElement.className = 'message';
  messageElement.innerHTML = `
    <div class="message-sender">${message.sender_id}</div>
    <div class="message-content">${message.content}</div>
    <div class="message-time">${new Date(message.created_at).toLocaleString()}</div>
  `;
  messagesContainer.appendChild(messageElement);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  */
}

/**
 * Display typing indicator
 */
function displayTypingIndicator(userId, isTyping) {
  // This is a placeholder - implement based on your UI framework
  console.log(`User ${userId} is ${isTyping ? 'typing' : 'not typing'}`);
}

/**
 * Update message read status
 */
function updateMessageReadStatus(messageId, readAt) {
  // This is a placeholder - implement based on your UI framework
  console.log(`Message ${messageId} marked as read at ${readAt}`);
}

/**
 * Display user status (joined/left)
 */
function displayUserStatus(userId, status) {
  // This is a placeholder - implement based on your UI framework
  console.log(`User ${userId} ${status} the chat`);
}

/**
 * Display error message
 */
function displayError(errorMessage) {
  // This is a placeholder - implement based on your UI framework
  console.error('Chat error:', errorMessage);
}

/**
 * Extract user ID from auth token (placeholder implementation)
 */
function getUserIdFromToken(token) {
  // This is a placeholder - implement based on your auth system
  // For JWT tokens, you would decode the token to get the user ID
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.user_id || payload.id;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}

// Export functions for use in other modules
module.exports = {
  initializeChat,
  sendMessage,
  sendTyping,
  markAsRead,
  joinChat,
  leaveChat
};