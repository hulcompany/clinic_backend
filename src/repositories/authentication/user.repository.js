/**
 * User Repository for Data Access
 * 
 * This repository provides a centralized data access layer for all user-related operations.
 * It abstracts database interactions for users, providing a consistent interface
 * for the user service.
 */

const { User } = require('../../models/index');

class UserRepository {
  // Get user by ID
  async getUserById(id) {
    try {
      const user = await User.findByPk(id, {
        attributes: { exclude: ['password'] } // Exclude password from results
      });
      
      return user;
    } catch (error) {
      throw new Error('Failed to get user: ' + error.message);
    }
  }

  // Get user by email
  async getUserByEmail(email) {
    try {
      const user = await User.findOne({
        where: { email }
      });
      
      return user;
    } catch (error) {
      throw new Error('Failed to get user by email: ' + error.message);
    }
  }

  // Get user by phone
  async getUserByPhone(phone) {
    try {
      const user = await User.findOne({
        where: { phone }
      });
      
      return user;
    } catch (error) {
      throw new Error('Failed to get user by phone: ' + error.message);
    }
  }

  // Get all users with pagination
  async getAllUsers(page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      const { count, rows: users } = await User.findAndCountAll({
        attributes: { exclude: ['password'] }, // Exclude password from results
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      return {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      };
    } catch (error) {
      throw new Error('Failed to get users: ' + error.message);
    }
  }

  // Create a new user
  async createUser(data) {
    try {
      const user = await User.create(data);
      
      // Remove password from response
      const userResponse = user.toJSON();
      delete userResponse.password;
      
      return userResponse;
    } catch (error) {
      throw new Error('Failed to create user: ' + error.message);
    }
  }

  // Update user
  async updateUser(id, data) {
    try {
      const user = await User.findByPk(id);
      if (!user) {
        throw new Error('User not found');
      }
      
      const updatedUser = await user.update(data);
      
      // Remove password from response
      const userResponse = updatedUser.toJSON();
      delete userResponse.password;
      
      return userResponse;
    } catch (error) {
      throw new Error('Failed to update user: ' + error.message);
    }
  }

  // Delete user
  async deleteUser(id) {
    try {
      const user = await User.findByPk(id);
      if (!user) {
        throw new Error('User not found');
      }
      
      await user.destroy();
      return true;
    } catch (error) {
      throw new Error('Failed to delete user: ' + error.message);
    }
  }

  // Update user password
  async updatePassword(id, newPassword) {
    try {
      const user = await User.findByPk(id);
      if (!user) {
        throw new Error('User not found');
      }
      
      await user.update({ password: newPassword });
      return true;
    } catch (error) {
      throw new Error('Failed to update user password: ' + error.message);
    }
  }

  // Toggle user restriction status
  async toggleRestrictionStatus(id) {
    try {
      const user = await User.findByPk(id);
      if (!user) {
        throw new Error('User not found');
      }
      
      const newStatus = user.is_restricted ? 0 : 1;
      await user.update({ is_restricted: newStatus });
      
      return { ...user.toJSON(), is_restricted: newStatus };
    } catch (error) {
      throw new Error('Failed to update user restriction status: ' + error.message);
    }
  }
}

module.exports = new UserRepository();