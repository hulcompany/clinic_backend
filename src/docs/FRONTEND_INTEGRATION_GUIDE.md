# Frontend Integration Guide for Real-time Chat

This guide explains how frontend developers can integrate with the real-time chat system using WebSocket technology.

## Table of Contents
1. [System Overview](#system-overview)
2. [WebSocket Client Utility](#websocket-client-utility)
3. [Integration Steps](#integration-steps)
4. [Authentication](#authentication)
5. [Chat Initialization](#chat-initialization)
6. [Sending Messages](#sending-messages)
7. [Receiving Messages](#receiving-messages)
8. [Typing Indicators](#typing-indicators)
9. [Read Receipts](#read-receipts)
10. [User Presence](#user-presence)
11. [Error Handling](#error-handling)
12. [Best Practices](#best-practices)

## System Overview

The real-time chat system uses WebSocket technology to enable instant messaging between users. The system provides:

- Instant message delivery
- Typing indicators
- Read receipts
- User presence tracking
- Room-based messaging

## WebSocket Client Utility

The system provides a pre-built WebSocket client utility (`src/utils/websocket.client.js`) that simplifies integration. This utility handles:

- Connection management
- Automatic reconnection
- Event subscription
- Message queuing
- Error handling

## Integration Steps

### 1. Import the WebSocket Client

```javascript
import wsClient from './path/to/websocket.client.js';
// or
const wsClient = require('./path/to/websocket.client.js');
```

### 2. Establish Connection

```javascript
// Connect to WebSocket server
wsClient.connect('ws://localhost:3000', {
  // Optional connection options
});
```

### 3. Authenticate the Connection

```javascript
// Authentication is handled through the connection URL
// Include JWT token as query parameter
const token = localStorage.getItem('authToken');
wsClient.connect(`ws://localhost:3000?token=${token}`);
```

### 4. Join a Chat Room

```javascript
// Join a specific chat room
wsClient.joinChat(userId, chatId);
```

## Authentication

Authentication is handled through JWT tokens passed as query parameters:

```javascript
const authToken = 'your-jwt-token';
wsClient.connect(`ws://localhost:3000?token=${authToken}`, {
  // Additional options if needed
});
```

The server validates the token and associates the WebSocket connection with the authenticated user.

## Chat Initialization

To initialize a chat session:

### 1. Get Chat Details via REST API

```javascript
async function initializeChat(consultationId) {
  try {
    const response = await fetch('/api/v1/realtime-chat/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ consultation_id: consultationId })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Store chat details
      const chatId = data.data.chat_id;
      const wsUrl = data.data.ws_url;
      
      // Connect to WebSocket
      wsClient.connect(`${wsUrl}?token=${authToken}`);
      
      // Join chat room
      wsClient.joinChat(currentUserId, chatId);
      
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Failed to initialize chat:', error);
    throw error;
  }
}
```

## Sending Messages

### Send Text Messages

```javascript
function sendTextMessage(chatId, messageText, senderId) {
  // Send via WebSocket for real-time delivery
  const success = wsClient.sendMessage(
    chatId, 
    messageText, 
    senderId, 
    'text'
  );
  
  if (!success) {
    console.warn('Failed to send message via WebSocket, falling back to REST API');
    // Fallback to REST API
    sendTextMessageViaRest(chatId, messageText, senderId);
  }
}

async function sendTextMessageViaRest(chatId, messageText, senderId) {
  try {
    const response = await fetch(`/api/v1/realtime-chat/${chatId}/send-realtime`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        content: messageText,
        message_type: 'text'
      })
    });
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to send message via REST API:', error);
    throw error;
  }
}
```

### Send Media Messages

```javascript
function sendMediaMessage(chatId, fileUrl, senderId, messageType = 'image') {
  wsClient.sendMessage(
    chatId, 
    '', // Empty content for media messages
    senderId, 
    messageType,
    fileUrl
  );
}
```

## Receiving Messages

Subscribe to receive messages:

```javascript
// Set up message listener
wsClient.on('receive_message', (messageData) => {
  // Handle incoming message
  displayMessage(messageData);
});

function displayMessage(message) {
  const messageContainer = document.getElementById('messages');
  
  const messageElement = document.createElement('div');
  messageElement.className = 'message';
  messageElement.innerHTML = `
    <div class="message-header">
      <span class="sender">${message.sender_id}</span>
      <span class="timestamp">${new Date(message.created_at).toLocaleTimeString()}</span>
    </div>
    <div class="message-content">
      ${message.message_type === 'text' ? message.content : ''}
      ${message.file_url ? `<img src="${message.file_url}" alt="Attachment" />` : ''}
    </div>
  `;
  
  messageContainer.appendChild(messageElement);
  
  // Scroll to bottom
  messageContainer.scrollTop = messageContainer.scrollHeight;
}
```

## Typing Indicators

### Send Typing Status

```javascript
let typingTimer;

function handleInputChange(chatId, userId) {
  // Clear previous timer
  clearTimeout(typingTimer);
  
  // Send typing started
  wsClient.sendTyping(chatId, userId, true);
  
  // Set timer to send typing stopped
  typingTimer = setTimeout(() => {
    wsClient.sendTyping(chatId, userId, false);
  }, 1000); // Stop typing after 1 second of inactivity
}
```

### Receive Typing Status

```javascript
wsClient.on('user_typing', (data) => {
  const { userId, isTyping } = data;
  
  const typingIndicator = document.getElementById(`typing-${userId}`);
  if (typingIndicator) {
    typingIndicator.style.display = isTyping ? 'block' : 'none';
  }
});
```

## Read Receipts

### Mark Message as Read

```javascript
function markMessageAsRead(messageId, userId, chatId) {
  wsClient.markAsRead(messageId, userId, chatId);
  
  // Also update via REST API for persistence
  markMessageAsReadViaRest(messageId);
}

async function markMessageAsReadViaRest(messageId) {
  try {
    const response = await fetch(`/api/v1/messages/${messageId}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to mark message as read:', error);
    throw error;
  }
}
```

### Receive Read Status Updates

```javascript
wsClient.on('message_read', (data) => {
  const { message_id, read_at } = data;
  
  // Update UI to show message as read
  const messageElement = document.querySelector(`[data-message-id="${message_id}"]`);
  if (messageElement) {
    messageElement.classList.add('read');
    messageElement.querySelector('.read-status').textContent = 'Read';
  }
});
```

## User Presence

### Receive User Join/Leave Events

```javascript
wsClient.on('user_joined', (data) => {
  const { userId, chatId } = data;
  console.log(`User ${userId} joined chat ${chatId}`);
  
  // Update UI to show user as online
  updateUserStatus(userId, 'online');
});

wsClient.on('user_left', (data) => {
  const { userId, chatId } = data;
  console.log(`User ${userId} left chat ${chatId}`);
  
  // Update UI to show user as offline
  updateUserStatus(userId, 'offline');
});
```

## Error Handling

Handle WebSocket errors gracefully:

```javascript
wsClient.on('error', (error) => {
  console.error('WebSocket error occurred:', error);
  
  // Show user-friendly error message
  showNotification('Connection error occurred. Please check your network.', 'error');
});

wsClient.on('disconnected', (event) => {
  console.log('WebSocket disconnected:', event);
  
  // Show reconnection status
  showNotification('Reconnecting...', 'info');
});

wsClient.on('connected', (event) => {
  console.log('WebSocket connected:', event);
  
  // Hide reconnection status
  hideNotification();
});
```

## Best Practices

### 1. Graceful Degradation

Always provide fallbacks to REST API when WebSocket is unavailable:

```javascript
function sendMessage(chatId, content, senderId) {
  // Try WebSocket first
  if (wsClient.isConnected()) {
    wsClient.sendMessage(chatId, content, senderId, 'text');
  } else {
    // Fallback to REST API
    sendTextMessageViaRest(chatId, content, senderId);
  }
}
```

### 2. Efficient Event Handling

Remove event listeners when components unmount:

```javascript
const messageHandler = (messageData) => {
  displayMessage(messageData);
};

// Add listener
wsClient.on('receive_message', messageHandler);

// Remove listener when component unmounts
function cleanup() {
  wsClient.off('receive_message', messageHandler);
}
```

### 3. Connection State Management

Monitor connection state and inform users:

```javascript
function updateConnectionStatus() {
  const statusElement = document.getElementById('connection-status');
  
  if (wsClient.isConnected()) {
    statusElement.textContent = 'Connected';
    statusElement.className = 'status-connected';
  } else {
    statusElement.textContent = 'Disconnected';
    statusElement.className = 'status-disconnected';
  }
}

// Update status when connection changes
wsClient.on('connected', updateConnectionStatus);
wsClient.on('disconnected', updateConnectionStatus);
```

### 4. Memory Management

Clean up resources when leaving chat:

```javascript
function leaveChat(chatId, userId) {
  // Leave chat room
  wsClient.leaveChat(userId, chatId);
  
  // Clean up event listeners
  wsClient.off('receive_message', messageHandler);
  wsClient.off('user_typing', typingHandler);
  wsClient.off('message_read', readHandler);
  
  // Disconnect if no other chats are active
  if (noActiveChats()) {
    wsClient.disconnect();
  }
}
```

## Testing Your Integration

### Console Logs to Verify Functionality

When your integration is working correctly, you should see logs like:

```
[WEBSOCKET CLIENT] WebSocket connection established
[WEBSOCKET CLIENT] Attempting to reconnect (1/5)
[WEBSOCKET] User connected: socket-id-123
[WEBSOCKET] User 1 joined chat 5
[WEBSOCKET] Message sent to chat 5
[MESSAGE SERVICE] Broadcasting message 10 to chat 5
[MESSAGE SERVICE] Message broadcast complete
```

### Testing Steps

1. **Connection Test**
   - Open browser console
   - Verify WebSocket connection is established
   - Check for "[WEBSOCKET CLIENT] WebSocket connection established" log

2. **Message Test**
   - Send a message from one client
   - Verify it appears instantly on another client
   - Check console logs for message broadcast

3. **Typing Indicator Test**
   - Type in message input field
   - Verify typing indicator appears for other users
   - Check that it disappears after stopping typing

4. **Read Receipt Test**
   - Open a message on recipient side
   - Verify read status updates for sender
   - Check console logs for read status broadcast

## Troubleshooting

### Common Issues

1. **Connection Failures**
   - Check WebSocket URL and port
   - Verify authentication token is valid
   - Ensure CORS settings allow the connection

2. **Message Not Delivered**
   - Verify users are in the same chat room
   - Check network connectivity
   - Look for error messages in console

3. **Typing Indicators Not Working**
   - Ensure event listeners are properly set up
   - Check that userId and chatId are correct
   - Verify typing events are being sent

### Debugging Tips

1. Enable verbose logging in development
2. Use browser WebSocket inspection tools
3. Monitor server logs for error messages
4. Check network tab for connection issues

## API Reference

### WebSocket Client Methods

| Method | Description | Parameters |
|--------|-------------|------------|
| `connect(url, options)` | Establish WebSocket connection | `url`: WebSocket URL, `options`: Connection options |
| `disconnect()` | Close WebSocket connection | None |
| `isConnected()` | Check connection status | None |
| `joinChat(userId, chatId)` | Join a chat room | `userId`: User ID, `chatId`: Chat ID |
| `leaveChat(userId, chatId)` | Leave a chat room | `userId`: User ID, `chatId`: Chat ID |
| `sendMessage(chatId, message, senderId, messageType, fileUrl)` | Send a message | All message parameters |
| `sendTyping(chatId, userId, isTyping)` | Send typing indicator | `chatId`, `userId`, `isTyping`: Boolean |
| `markAsRead(messageId, userId, chatId)` | Mark message as read | All parameters |
| `on(event, callback)` | Subscribe to events | `event`: Event name, `callback`: Handler function |
| `off(event, callback)` | Unsubscribe from events | `event`: Event name, `callback`: Handler function |

### WebSocket Events

| Event | Description | Payload |
|-------|-------------|---------|
| `connected` | Connection established | Connection event object |
| `disconnected` | Connection closed | Disconnection event object |
| `error` | Error occurred | Error object |
| `receive_message` | New message received | Message data object |
| `user_typing` | User typing status | `{ userId, isTyping }` |
| `message_read` | Message read status | `{ message_id, read_at }` |
| `user_joined` | User joined chat | `{ userId, chatId }` |
| `user_left` | User left chat | `{ userId, chatId }` |

## Conclusion

The real-time chat system provides a robust foundation for instant messaging in your clinic management application. By following this guide, you can integrate WebSocket functionality to create a seamless user experience with instant message delivery, typing indicators, and read receipts.