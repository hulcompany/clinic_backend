/**
 * Session Repository for Data Access
 * 
 * This repository provides a centralized data access layer for all session-related operations.
 * It abstracts database interactions for sessions, providing a consistent interface
 * for the session service.
 */

const { Session, Admin } = require('../models/index');

class SessionRepository {
  // Get all sessions with pagination
  async getAllSessions(page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      const { count, rows: sessions } = await Session.findAndCountAll({
        include: [{
          model: Admin,
          as: 'Admin',
          attributes: ['user_id', 'full_name', 'email']
        }],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      return {
        sessions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      };
    } catch (error) {
      throw new Error('Failed to get sessions: ' + error.message);
    }
  }

  // Get session by ID
  async getSessionById(id) {
    try {
      const session = await Session.findByPk(id, {
        include: [{
          model: Admin,
          as: 'Admin',
          attributes: ['user_id', 'full_name', 'email']
        }]
      });
      
      return session;
    } catch (error) {
      throw new Error('Failed to get session: ' + error.message);
    }
  }

  // Get sessions by doctor ID
  async getSessionsByDoctorId(doctor_id, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      const { count, rows: sessions } = await Session.findAndCountAll({
        where: { doctor_id },
        include: [{
          model: Admin,
          as: 'Admin',
          attributes: ['user_id', 'full_name', 'email']
        }],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      return {
        sessions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      };
    } catch (error) {
      throw new Error('Failed to get sessions by doctor: ' + error.message);
    }
  }

  // Create a new session
  async createSession(data) {
    try {
      const session = await Session.create(data);
      return session;
    } catch (error) {
      throw new Error('Failed to create session: ' + error.message);
    }
  }

  // Update session
  async updateSession(id, data) {
    try {
      const session = await Session.findByPk(id);
      if (!session) {
        throw new Error('Session not found');
      }
      
      await session.update(data);
      return session;
    } catch (error) {
      throw new Error('Failed to update session: ' + error.message);
    }
  }

  // Delete session
  async deleteSession(id) {
    try {
      const session = await Session.findByPk(id);
      if (!session) {
        throw new Error('Session not found');
      }
      
      await session.destroy();
      return true;
    } catch (error) {
      throw new Error('Failed to delete session: ' + error.message);
    }
  }

  // Toggle session active status
  async toggleSessionStatus(id) {
    try {
      const session = await Session.findByPk(id);
      if (!session) {
        throw new Error('Session not found');
      }
      
      session.is_active = !session.is_active;
      await session.save();
      
      return session;
    } catch (error) {
      throw new Error('Failed to update session status: ' + error.message);
    }
  }
}

module.exports = new SessionRepository();