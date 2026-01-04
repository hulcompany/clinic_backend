/**
 * Admin Repository for Data Access
 * 
 * This repository provides a centralized data access layer for all admin-related operations.
 * It abstracts database interactions for admins, providing a consistent interface
 * for the admin service.
 */

const { Admin } = require('../../models/index');

class AdminRepository {
  // Get admin by ID
  async getAdminById(id) {
    try {
      const admin = await Admin.findByPk(id, {
        attributes: { exclude: ['password'] } // Exclude password from results
      });
      
      return admin;
    } catch (error) {
      throw new Error('Failed to get admin: ' + error.message);
    }
  }

  // Get admin by email
  async getAdminByEmail(email) {
    try {
      const admin = await Admin.findOne({
        where: { email }
      });
      
      return admin;
    } catch (error) {
      throw new Error('Failed to get admin by email: ' + error.message);
    }
  }

  // Get admin by phone
  async getAdminByPhone(phone) {
    try {
      const admin = await Admin.findOne({
        where: { phone }
      });
      
      return admin;
    } catch (error) {
      throw new Error('Failed to get admin by phone: ' + error.message);
    }
  }

  // Get all admins with pagination
  async getAllAdmins(page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      const { count, rows: admins } = await Admin.findAndCountAll({
        attributes: { exclude: ['password'] }, // Exclude password from results
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      return {
        admins,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      };
    } catch (error) {
      throw new Error('Failed to get admins: ' + error.message);
    }
  }

  // Create a new admin
  async createAdmin(data) {
    try {
      const admin = await Admin.create(data);
      
      // Remove password from response
      const adminResponse = admin.toJSON();
      delete adminResponse.password;
      
      return adminResponse;
    } catch (error) {
      throw new Error('Failed to create admin: ' + error.message);
    }
  }

  // Update admin
  async updateAdmin(id, data) {
    try {
      const admin = await Admin.findByPk(id);
      if (!admin) {
        throw new Error('Admin not found');
      }
      
      const updatedAdmin = await admin.update(data);
      
      // Remove password from response
      const adminResponse = updatedAdmin.toJSON();
      delete adminResponse.password;
      
      return adminResponse;
    } catch (error) {
      throw new Error('Failed to update admin: ' + error.message);
    }
  }

  // Delete admin
  async deleteAdmin(id) {
    try {
      const admin = await Admin.findByPk(id);
      if (!admin) {
        throw new Error('Admin not found');
      }
      
      await admin.destroy();
      return true;
    } catch (error) {
      throw new Error('Failed to delete admin: ' + error.message);
    }
  }

  // Update admin password
  async updatePassword(id, newPassword) {
    try {
      const admin = await Admin.findByPk(id);
      if (!admin) {
        throw new Error('Admin not found');
      }
      
      await admin.update({ password: newPassword });
      return true;
    } catch (error) {
      throw new Error('Failed to update admin password: ' + error.message);
    }
  }

  // Toggle admin active status
  async toggleActiveStatus(id) {
    try {
      const admin = await Admin.findByPk(id);
      if (!admin) {
        throw new Error('Admin not found');
      }
      
      const newStatus = !admin.is_active;
      await admin.update({ is_active: newStatus });
      
      return { ...admin.toJSON(), is_active: newStatus };
    } catch (error) {
      throw new Error('Failed to update admin status: ' + error.message);
    }
  }
  
  // Get admins by supervisor_id (for getting secretaries assigned to a supervisor)
  async getAdminsBySupervisorId(supervisorId) {
    try {
      const admins = await Admin.findAll({
        where: { supervisor_id: supervisorId },
        attributes: { exclude: ['password'] } // Exclude password from results
      });
      
      return admins;
    } catch (error) {
      throw new Error('Failed to get admins by supervisor ID: ' + error.message);
    }
  }
}

module.exports = new AdminRepository();
