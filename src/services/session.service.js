const AppError = require('../utils/AppError');
const sessionRepository = require('../repositories/session.repository');

class SessionService {
  // Get all sessions with pagination
  async getAllSessions(page = 1, limit = 20) {
    try {
      const result = await sessionRepository.getAllSessions(page, limit);
      return result;
    } catch (error) {
      throw new AppError('Failed to get sessions: ' + error.message, 500);
    }
  }

  // Get session by ID
  async getSessionById(id) {
    try {
      const session = await sessionRepository.getSessionById(id);
      if (!session) {
        throw new AppError('Session not found', 404);
      }
      return session;
    } catch (error) {
      throw new AppError('Failed to get session: ' + error.message, 500);
    }
  }

  // Get sessions by doctor ID with pagination
  async getSessionsByDoctorId(doctor_id, page = 1, limit = 20) {
    try {
      const result = await sessionRepository.getSessionsByDoctorId(doctor_id, page, limit);
      return result;
    } catch (error) {
      throw new AppError('Failed to get sessions: ' + error.message, 500);
    }
  }

  // Create a new session
  async createSession(data) {
    try {
      const session = await sessionRepository.createSession(data);
      return session;
    } catch (error) {
      throw new AppError('Failed to create session: ' + error.message, 500);
    }
  }

  // Update session
  async updateSession(id, data) {
    try {
      const session = await sessionRepository.updateSession(id, data);
      return session;
    } catch (error) {
      if (error.message.includes('Session not found')) {
        throw new AppError('Session not found', 404);
      }
      throw new AppError('Failed to update session: ' + error.message, 500);
    }
  }

  // Delete session
  async deleteSession(id) {
    try {
      const result = await sessionRepository.deleteSession(id);
      return result;
    } catch (error) {
      if (error.message.includes('Session not found')) {
        throw new AppError('Session not found', 404);
      }
      throw new AppError('Failed to delete session: ' + error.message, 500);
    }
  }

  // Toggle session active status
  async toggleSessionStatus(id) {
    try {
      const session = await sessionRepository.toggleSessionStatus(id);
      return session;
    } catch (error) {
      if (error.message.includes('Session not found')) {
        throw new AppError('Session not found', 404);
      }
      throw new AppError('Failed to update session status: ' + error.message, 500);
    }
  }
}

module.exports = new SessionService();