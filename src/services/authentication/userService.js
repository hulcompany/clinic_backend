const AppError = require('../../utils/AppError');
const userRepository = require('../../repositories/authentication/user.repository');

class UserService {
  // Get user by ID
  async getUserById(id) {
    try {
      const user = await userRepository.getUserById(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }
      return user;
    } catch (error) {
      throw new AppError('Failed to get user: ' + error.message, 500);
    }
  }

  // Get all users with pagination
  async getAllUsers(page = 1, limit = 20) {
    try {
      const result = await userRepository.getAllUsers(page, limit);
      return result;
    } catch (error) {
      throw new AppError('Failed to get users: ' + error.message, 500);
    }
  }

  // Update user
  async updateUser(id, data) {
    try {
      const user = await userRepository.updateUser(id, data);
      return user;
    } catch (error) {
      if (error.message.includes('User not found')) {
        throw new AppError('User not found', 404);
      }
      throw new AppError('Failed to update user: ' + error.message, 500);
    }
  }

  // Delete user
  async deleteUser(id) {
    try {
      const result = await userRepository.deleteUser(id);
      return result;
    } catch (error) {
      if (error.message.includes('User not found')) {
        throw new AppError('User not found', 404);
      }
      throw new AppError('Failed to delete user: ' + error.message, 500);
    }
  }

  // Update user password
  async updatePassword(id, newPassword) {
    try {
      const result = await userRepository.updatePassword(id, newPassword);
      return result;
    } catch (error) {
      if (error.message.includes('User not found')) {
        throw new AppError('User not found', 404);
      }
      throw new AppError('Failed to update user password: ' + error.message, 500);
    }
  }

  // Toggle user restriction status
  async toggleRestrictionStatus(id) {
    try {
      const user = await userRepository.toggleRestrictionStatus(id);
      return user;
    } catch (error) {
      if (error.message.includes('User not found')) {
        throw new AppError('User not found', 404);
      }
      throw new AppError('Failed to update user restriction status: ' + error.message, 500);
    }
  }
}

module.exports = new UserService();