/**
 * WebSocket Monitoring Service
 * 
 * This service provides real-time monitoring and statistics for WebSocket connections.
 * It tracks connection counts, message throughput, and system performance metrics.
 */

const logger = require('../../utils/websocket.logger');

class WebSocketMonitoringService {
  constructor(webSocketService) {
    this.webSocketService = webSocketService;
    this.stats = {
      totalConnections: 0,
      activeConnections: 0,
      totalMessages: 0,
      totalErrors: 0,
      peakConnections: 0,
      startTime: new Date()
    };
    
    // Start periodic reporting
    this.startPeriodicReporting();
  }

  /**
   * Track new connection
   */
  trackConnection() {
    this.stats.totalConnections++;
    this.stats.activeConnections++;
    
    if (this.stats.activeConnections > this.stats.peakConnections) {
      this.stats.peakConnections = this.stats.activeConnections;
    }
    
    logger.logStats({
      event: 'connection_added',
      ...this.stats
    });
  }

  /**
   * Track disconnection
   */
  trackDisconnection() {
    this.stats.activeConnections--;
    
    logger.logStats({
      event: 'connection_removed',
      ...this.stats
    });
  }

  /**
   * Track message sent
   */
  trackMessage() {
    this.stats.totalMessages++;
  }

  /**
   * Track error
   */
  trackError() {
    this.stats.totalErrors++;
  }

  /**
   * Get current statistics
   */
  getStats() {
    return {
      ...this.stats,
      uptime: Math.floor((new Date() - this.stats.startTime) / 1000) // in seconds
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalConnections: 0,
      activeConnections: 0,
      totalMessages: 0,
      totalErrors: 0,
      peakConnections: 0,
      startTime: new Date()
    };
  }

  /**
   * Start periodic reporting of statistics
   */
  startPeriodicReporting() {
    // Report every 5 minutes
    setInterval(() => {
      const stats = this.getStats();
      logger.logStats({
        event: 'periodic_report',
        ...stats
      });
      
      // Log warning if active connections are unusually high
      if (stats.activeConnections > 1000) {
        logger.logWarning('High number of active WebSocket connections', {
          activeConnections: stats.activeConnections
        });
      }
    }, 300000); // 5 minutes
  }

  /**
   * Get connection health status
   */
  getConnectionHealth() {
    const stats = this.getStats();
    
    if (stats.activeConnections === 0) {
      return 'idle';
    } else if (stats.activeConnections < 50) {
      return 'healthy';
    } else if (stats.activeConnections < 200) {
      return 'busy';
    } else {
      return 'overloaded';
    }
  }
}

module.exports = WebSocketMonitoringService;