const AppError = require('../../utils/AppError');
const adminRepository = require('../../repositories/authentication/admin.repository');

class AdminService {
  /**
   * Register a new admin (doctor or secretary)
   * @param {Object} adminData - Admin registration data
   * @returns {Object} Registered admin data
   */
  async registerAdmin(adminData) {
    try {
      // Check if admin already exists with the same email
      const existingAdmin = await adminRepository.getAdminByEmail(adminData.email);

      if (existingAdmin) {
        throw new AppError('Admin already exists with this email', 400);
      }

      // Validate role is either 'doctor' or 'secretary'
      if (adminData.role && !['doctor', 'secretary'].includes(adminData.role)) {
        throw new AppError('Role must be either "doctor" or "secretary"', 400);
      }

      // Handle doctor_id for secretary association
      const adminDataToCreate = {
        full_name: adminData.full_name,
        email: adminData.email,
        password: adminData.password,
        phone: adminData.phone,
        image: adminData.image,
        role: adminData.role || 'doctor' // Default to 'doctor' if not specified
      };
      
      // If the admin is a secretary and a supervisor_id is provided, validate the supervisor exists
      if (adminData.role === 'secretary' && adminData.supervisor_id) {
        // Check if the supervisor_id exists and is a doctor
        const supervisor = await adminRepository.getAdminById(adminData.supervisor_id);
        if (!supervisor || supervisor.role !== 'doctor') {
          throw new AppError('Invalid supervisor_id. Must be a valid doctor.', 400);
        }
        adminDataToCreate.supervisor_id = adminData.supervisor_id;
      } else if (adminData.role === 'doctor') {
        // Doctors cannot be assigned to another doctor
        adminDataToCreate.supervisor_id = null;
      }
      
      const admin = await adminRepository.createAdmin(adminDataToCreate);

      return {
        success: true,
        admin
      };
    } catch (error) {
      throw new AppError(error.message || 'Error registering admin', error.statusCode || 500);
    }
  }

  /**
   * Login admin
   * @param {Object} credentials - Admin login credentials
   * @returns {Object} Logged in admin data
   */
  async loginAdmin(credentials) {
    try {
      const { email, password } = credentials;

      // Find admin by email
      const admin = await adminRepository.getAdminByEmail(email);

      // Check if admin exists
      if (!admin) {
        throw new AppError('Invalid credentials', 401);
      }

      // Check if password matches
      const isMatch = await admin.matchPassword(password);

      if (!isMatch) {
        throw new AppError('Invalid credentials', 401);
      }

      // Check if admin account is active/verified
      if (!admin.is_active) {
        throw new AppError('Please verify your email before logging in', 401);
      }

      // Remove password from response
      const adminResponse = admin.toJSON();
      delete adminResponse.password;

      return {
        success: true,
        admin: adminResponse
      };
    } catch (error) {
      throw new AppError(error.message || 'Error logging in admin', error.statusCode || 500);
    }
  }

  /**
   * Get all admins
   * @returns {Array} List of all admins
   */
  async getAllAdmins(page = 1, limit = 20) {
    try {
      const result = await adminRepository.getAllAdmins(page, limit);
      
      return {
        success: true,
        ...result
      };
    } catch (error) {
      throw new AppError(error.message || 'Error fetching admins', error.statusCode || 500);
    }
  }

  /**
   * Get admin by ID
   * @param {Number} id - Admin ID
   * @returns {Object} Admin data
   */
  async getAdminById(id) {
    try {
      const admin = await adminRepository.getAdminById(id);

      if (!admin) {
        throw new AppError('Admin not found', 404);
      }

      return {
        success: true,
        admin
      };
    } catch (error) {
      throw new AppError(error.message || 'Error fetching admin', error.statusCode || 500);
    }
  }

  /**
   * Update admin
   * @param {Number} id - Admin ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated admin data
   */
  async updateAdmin(id, updateData) {
    try {
      // Validate role if being updated
      if (updateData.role && !['doctor', 'secretary'].includes(updateData.role)) {
        throw new AppError('Role must be either "doctor" or "secretary"', 400);
      }

      const admin = await adminRepository.updateAdmin(id, updateData);

      return {
        success: true,
        admin
      };
    } catch (error) {
      throw new AppError(error.message || 'Error updating admin', error.statusCode || 500);
    }
  }

  /**
   * Delete admin
   * @param {Number} id - Admin ID
   * @returns {Object} Deletion result
   */
  async deleteAdmin(id) {
    try {
      const result = await adminRepository.deleteAdmin(id);

      return {
        success: true,
        message: 'Admin deleted successfully'
      };
    } catch (error) {
      throw new AppError(error.message || 'Error deleting admin', error.statusCode || 500);
    }
  }
  
  /**
   * Assign secretary to doctor
   * @param {Number} secretaryId - Secretary ID
   * @param {Number} doctorId - Doctor ID to assign the secretary to
   * @returns {Object} Updated secretary data
   */
  async assignSecretaryToDoctor(secretaryId, doctorId) {
    try {
      // Get the secretary to verify they exist and are a secretary
      const secretary = await adminRepository.getAdminById(secretaryId);
      
      if (!secretary) {
        throw new AppError('Secretary not found', 404);
      }
      
      if (secretary.role !== 'secretary') {
        throw new AppError('Only secretaries can be assigned to doctors', 400);
      }
      
      // Get the doctor to verify they exist and are a doctor
      const doctor = await adminRepository.getAdminById(doctorId);
      
      if (!doctor || doctor.role !== 'doctor') {
        throw new AppError('Invalid doctor ID. Must be a valid doctor.', 400);
      }
      
      // Update the secretary's supervisor_id
      const updatedSecretary = await adminRepository.updateAdmin(secretaryId, { supervisor_id: doctorId });
      
      return {
        success: true,
        admin: updatedSecretary
      };
    } catch (error) {
      throw new AppError(error.message || 'Error assigning secretary to doctor', error.statusCode || 500);
    }
  }
  
  /**
   * Get secretaries assigned to a doctor
   * @param {Number} doctorId - Doctor ID
   * @returns {Array} List of secretaries assigned to the doctor
   */
  async getSecretariesByDoctor(doctorId) {
    try {
      // Verify the doctor exists and is a doctor
      const doctor = await adminRepository.getAdminById(doctorId);
      
      if (!doctor || doctor.role !== 'doctor') {
        throw new AppError('Invalid doctor ID. Must be a valid doctor.', 400);
      }
      
      const secretaries = await adminRepository.getAdminsBySupervisorId(doctorId);
      
      return {
        success: true,
        secretaries
      };
    } catch (error) {
      throw new AppError(error.message || 'Error fetching secretaries', error.statusCode || 500);
    }
  }
  
  /**
   * Register a secretary account by doctor (doctor only)
   * @param {Number} doctorId - ID of the doctor registering the secretary
   * @param {Object} secretaryData - Secretary registration data
   * @returns {Object} Registered secretary data
   */
  async registerSecretaryByDoctor(doctorId, secretaryData) {
    try {
      // Validate that the requesting user is a doctor
      const doctor = await adminRepository.getAdminById(doctorId);
      if (!doctor || doctor.role !== 'doctor') {
        throw new AppError('Only doctors can register secretaries', 403);
      }
      
      // Ensure the role is secretary
      if (secretaryData.role && secretaryData.role !== 'secretary') {
        throw new AppError('Doctors can only register secretaries', 400);
      }
      
      // Check if admin already exists with the same email
      const existingAdmin = await adminRepository.getAdminByEmail(secretaryData.email);
      
      if (existingAdmin) {
        throw new AppError('Admin already exists with this email', 400);
      }
      
      // Ensure no supervisor_id is provided (auto-assign to the registering doctor)
      if (secretaryData.supervisor_id) {
        throw new AppError('Cannot assign secretary to another supervisor when registering through doctor', 400);
      }
      
      // Create the secretary with the doctor as supervisor
      const secretary = await adminRepository.createAdmin({
        full_name: secretaryData.full_name,
        email: secretaryData.email,
        password: secretaryData.password,
        phone: secretaryData.phone,
        image: secretaryData.image,
        role: 'secretary',
        supervisor_id: doctorId  // Automatically assign to the registering doctor
      });
      
      return {
        success: true,
        admin: secretary
      };
    } catch (error) {
      throw new AppError(error.message || 'Error registering secretary by doctor', error.statusCode || 500);
    }
  }
}

module.exports = new AdminService();