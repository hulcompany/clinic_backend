const availabilityService = require('../services/availability.service');
const AppError = require('../utils/AppError');
const { successResponse, createdResponse, failureResponse } = require('../utils/responseHandler');
const adminRepository = require('../repositories/authentication/admin.repository');
const { hasPermission } = require('../config/roles');

// Helper function to validate doctor/secretary permissions
const validateProfessionalPermission = (user) => {
  return user.role === 'doctor' || user.role === 'admin' || user.role === 'super_admin';
};

// Helper function to validate secretary permissions with specific permission
const validateSecretaryPermission = (user) => {
  return user.role === 'secretary' && hasPermission(user.role, 'manage_appointments_for_assigned_doctor');
};

// Helper function to check if a user is a secretary assigned to any doctor
const validateSecretaryAssignment = async (userId) => {
  try {
    const secretary = await adminRepository.getAdminById(userId);
    
    if (!secretary || secretary.role !== 'secretary') {
      return { isValid: false, message: 'User is not a secretary', assignedDoctorId: null };
    }
    
    if (!secretary.supervisor_id) {
      return { isValid: false, message: 'Secretary is not assigned to any doctor', assignedDoctorId: null };
    }
    
    return { isValid: true, message: 'Secretary is valid', assignedDoctorId: secretary.supervisor_id };
  } catch (error) {
    console.error('Error validating secretary assignment:', error);
    return { isValid: false, message: 'Error checking secretary assignment', assignedDoctorId: null };
  }
};

// Helper function to check if a secretary belongs to a specific doctor
const checkSecretaryDoctorRelationship = async (secretaryId, doctorId) => {
  
  try {
    const secretary = await adminRepository.getAdminById(secretaryId);
    
    if (!secretary || secretary.role !== 'secretary') {
      return false;
    }
    
    return secretary.supervisor_id === doctorId;
  } catch (error) {
    console.error('Error checking secretary-doctor relationship:', error);
    return false;
  }
};

/**
 * @desc    Get all availability slots (public)
 * @route   GET /api/v1/availability
 * @access  Public
 */
const getAllAvailability = async (req, res, next) => {
  try {
    // Get pagination parameters from query, with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    // Get filter parameters
    const filters = {};
    
    // Status filter
    if (req.query.status) {
      filters.status = req.query.status;
    }
    
    // Booked status filter
    if (req.query.is_booked !== undefined) {
      filters.is_booked = req.query.is_booked === 'true';
    }
    
    // Booked by user filter
    if (req.query.booked_by_user_id) {
      filters.booked_by_user_id = parseInt(req.query.booked_by_user_id);
    }
    
    // Admin ID filter
    if (req.query.admin_id) {
      filters.admin_id = parseInt(req.query.admin_id);
    }
    
    const result = await availabilityService.getAllAvailability(page, limit, filters);
    
    successResponse(res, result, 'Availability slots retrieved successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Get availability by ID (public)
 * @route   GET /api/v1/availability/:id
 * @access  Public
 */
const getAvailabilityById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const availability = await availabilityService.getAvailabilityById(id);
    
    successResponse(res, availability, 'Availability slot retrieved successfully');
  } catch (error) {
    if (error.statusCode === 404) {
      return failureResponse(res, 'Availability slot not found', 404);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Get availability by admin ID (public)
 * @route   GET /api/v1/availability/admin/:adminId
 * @access  Public
 */
const getAvailabilityByAdminId = async (req, res, next) => {
  try {
    const { adminId } = req.params;
    
    // Get pagination parameters from query, with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    // Get search and sort parameters
    const { search, sortBy, sortOrder, ...filterParams } = req.query;
    
    // Get filter parameters
    const filters = {};
    
    // Apply search filter
    if (search) {
      filters.search = search;
    }
    
    // Apply sort parameters
    if (sortBy) {
      filters.sortBy = sortBy;
    }
    
    if (sortOrder) {
      filters.sortOrder = sortOrder.toUpperCase();
      if (!['ASC', 'DESC'].includes(filters.sortOrder)) {
        filters.sortOrder = 'ASC'; // Default to ASC if invalid
      }
    }
    
    // Status filter
    if (filterParams.status) {
      filters.status = filterParams.status;
    }
    
    // Booked status filter
    if (filterParams.is_booked !== undefined) {
      filters.is_booked = filterParams.is_booked === 'true';
    }
    
    // Booked by user filter
    if (filterParams.booked_by_user_id) {
      filters.booked_by_user_id = parseInt(filterParams.booked_by_user_id);
    }
    
    const result = await availabilityService.getAvailabilityByAdminId(adminId, page, limit, filters);
    
    successResponse(res, result, 'Availability slots retrieved successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Create a new availability slot
 * @route   POST /api/v1/availability
 * @access  Private (Doctor/Secretary)
 */
const createAvailability = async (req, res, next) => {
  try {
    // Check if user has permission to create availability
    if (!validateProfessionalPermission(req.user) && !validateSecretaryPermission(req.user)) {
      return failureResponse(res, 'Not authorized to create availability slots', 403);
    }

    //admin_id اختياري 
    
    const { date, start_time, end_time, booked_by_user_id, admin_id } = req.body;
    
    // Validate required fields
    if (!date || !start_time) {
      return failureResponse(res, 'Date and start time are required', 400);
    }
    
    let targetAdminId = req.user.user_id;
    
    // If user is a secretary and wants to create for a doctor, validate the relationship
    if (req.user.role === 'secretary') {
      if (admin_id) {
        // Secretary wants to create availability for a specific doctor
        if (!(await checkSecretaryDoctorRelationship(req.user.user_id, admin_id))) {
          return failureResponse(res, 'Not authorized to create availability for this doctor', 403);
        }
        targetAdminId = admin_id;
      } else {
        // Secretary creates for their assigned doctor
        const adminRepository = require('../repositories/authentication/admin.repository');
        const secretary = await adminRepository.getAdminById(req.user.user_id);
        if (!secretary || !secretary.supervisor_id) {
          return failureResponse(res, 'Secretary is not assigned to any doctor', 403);
        }
        targetAdminId = secretary.supervisor_id;
      }
    } else if (admin_id && req.user.user_id !== admin_id) {
      // If doctor tries to create for another doctor, deny
      return failureResponse(res, 'Doctors can only create availability for themselves', 403);
    }
    
    const availabilityData = {
      date,
      start_time,
      end_time,
      booked_by_user_id
    };
    
    const availability = await availabilityService.createAvailability(targetAdminId, availabilityData);
    
    createdResponse(res, availability, 'Availability slot created successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Update availability slot
 * @route   PUT /api/v1/availability/:id
 * @access  Private (Owner/Doctor/Secretary)
 */
const updateAvailability = async (req, res, next) => {
  try {
    // Check if user has permission to update this availability
    if (!validateProfessionalPermission(req.user) && !validateSecretaryPermission(req.user)) {
      return failureResponse(res, 'Not authorized to update availability slots', 403);
    }
    
    const { id } = req.params;
    
    // Get the existing availability to check ownership
    const existingAvailability = await availabilityService.getAvailabilityById(id);
    
    let hasPermission = false;
    
    // Check if user is the owner of the availability slot
    if (existingAvailability.admin_id === req.user.user_id) {
      hasPermission = true;
    }
    // Check if user is a secretary and the availability belongs to their assigned doctor
    else if (req.user.role === 'secretary') {
      if (await checkSecretaryDoctorRelationship(req.user.user_id, existingAvailability.admin_id)) {
        hasPermission = true;
      }
    }
    
    if (!hasPermission) {
      return failureResponse(res, 'Not authorized to update this availability slot', 403);
    }
    
    const { date, start_time, end_time, booked_by_user_id, status } = req.body;
    
    // Prepare update data
    const updateData = {};
    
    if (date) {
      updateData.date = date;
    }
    
    if (start_time) {
      updateData.start_time = start_time;
    }
    
    if (end_time !== undefined) {
      updateData.end_time = end_time;
    }
    
    if (booked_by_user_id !== undefined) {
      updateData.booked_by_user_id = booked_by_user_id;
    }
    
    if (status) {
      updateData.status = status;
    }
    
    const updatedAvailability = await availabilityService.updateAvailability(id, req.user.user_id, req.user.role, updateData);
    
    successResponse(res, updatedAvailability, 'Availability slot updated successfully');
  } catch (error) {
    if (error.statusCode === 404) {
      return failureResponse(res, 'Availability slot not found', 404);
    }
    if (error.statusCode === 403) {
      return failureResponse(res, error.message, 403);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Delete availability slot (hard delete)
 * @route   DELETE /api/v1/availability/:id
 * @access  Private (Owner/Doctor/Secretary)
 */
const deleteAvailability = async (req, res, next) => {
  try {
    // Check if user has permission to delete this availability
    if (!validateProfessionalPermission(req.user) && !validateSecretaryPermission(req.user)) {
      return failureResponse(res, 'Not authorized to delete availability slots', 403);
    }
    
    const { id } = req.params;
    
    // Get the existing availability to check ownership
    const existingAvailability = await availabilityService.getAvailabilityById(id);
    
    let hasPermission = false;
    
    // Check if user is the owner of the availability slot
    if (existingAvailability.admin_id === req.user.user_id) {
      hasPermission = true;
    }
    // Check if user is a secretary and the availability belongs to their assigned doctor
    else if (req.user.role === 'secretary') {
      if (await checkSecretaryDoctorRelationship(req.user.user_id, existingAvailability.admin_id)) {
        hasPermission = true;
      }
    }
    
    if (!hasPermission) {
      return failureResponse(res, 'Not authorized to delete this availability slot', 403);
    }
    
    await availabilityService.deleteAvailability(id);
    
    successResponse(res, null, 'Availability slot deleted successfully');
  } catch (error) {
    if (error.statusCode === 404) {
      return failureResponse(res, 'Availability slot not found', 404);
    }
    if (error.statusCode === 403) {
      return failureResponse(res, error.message, 403);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Book an availability slot
 * @route   POST /api/v1/availability/:id/book
 * @access  Private (User)
 */
const bookAvailabilitySlot = async (req, res, next) => {
  try {
    // Only regular users can book slots
    if (req.user.role !== 'user') {
      return failureResponse(res, 'Only users can book availability slots', 403);
    }
    
    const { id } = req.params;
    
    const availability = await availabilityService.bookAvailabilitySlot(id, req.user.user_id, req.user.role);
    
    successResponse(res, availability, 'Availability slot booked successfully');
  } catch (error) {
    if (error.statusCode === 404) {
      return failureResponse(res, 'Availability slot not found', 404);
    }
    if (error.statusCode === 400) {
      return failureResponse(res, error.message, 400);
    }
    if (error.statusCode === 403) {
      return failureResponse(res, error.message, 403);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Cancel booking of an availability slot
 * @route   POST /api/v1/availability/:id/cancel
 * @access  Private (Booking Owner/Doctor/Secretary)
 */
const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get the availability to check ownership
    const availability = await availabilityService.getAvailabilityById(id);
    
    // Check if user is authorized to cancel
    if (req.user.role === 'user') {
      // Regular users can only cancel their own bookings
      if (availability.booked_by_user_id !== req.user.user_id) {
        return failureResponse(res, 'Not authorized to cancel this booking', 403);
      }
    } else if (validateProfessionalPermission(req.user) || validateSecretaryPermission(req.user)) {
      let hasPermission = false;
      
      // Check if user is the owner of the availability slot
      if (availability.admin_id === req.user.user_id) {
        hasPermission = true;
      }
      // Check if user is a secretary and the availability belongs to their assigned doctor
      else if (req.user.role === 'secretary') {
        if (await checkSecretaryDoctorRelationship(req.user.user_id, availability.admin_id)) {
          hasPermission = true;
        }
      }
      
      if (!hasPermission) {
        return failureResponse(res, 'Not authorized to cancel this booking', 403);
      }
    } else {
      // Any other role is not authorized
      return failureResponse(res, 'Not authorized to cancel this booking', 403);
    }
    
    const result = await availabilityService.cancelBooking(id);
    
    successResponse(res, result, 'Booking cancelled successfully');
  } catch (error) {
    if (error.statusCode === 404) {
      return failureResponse(res, 'Availability slot not found', 404);
    }
    if (error.statusCode === 400) {
      return failureResponse(res, error.message, 400);
    }
    if (error.statusCode === 403) {
      return failureResponse(res, error.message, 403);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Get users who have appointments with a specific doctor
 * @route   GET /api/v1/availability/doctor/:adminId/users
 * @access  Private (Doctor/Secretary)
 */
const getUsersWithAppointments = async (req, res, next) => {
  try {
    // Check if user has permission
    if (!validateProfessionalPermission(req.user) && !validateSecretaryPermission(req.user)) {
      return failureResponse(res, 'Not authorized to access user appointments', 403);
    }
    
    const { adminId } = req.params;
    
    // If user is a secretary, check if they are assigned to the doctor
    if (req.user.role === 'secretary') {
      const validation = await validateSecretaryAssignment(req.user.user_id);
      if (!validation.isValid) {
        return failureResponse(res, validation.message, 403);
      }
      
      // Secretary can only access users for their assigned doctor
      if (validation.assignedDoctorId !== parseInt(adminId)) {
        return failureResponse(res, 'Not authorized to access appointments for this doctor', 403);
      }
    }
    
    // Get query parameters for date filtering
    const { page = 1, limit = 20, date, month, year } = req.query;
    
    // Build date filters
    let dateFilter = {};
    if (date) {
      // Filter for specific date (YYYY-MM-DD)
      dateFilter.date = date;
    } else if (month && year) {
      // Filter for specific month and year
      const startDate = `${year}-${month.padStart(2, '0')}-01`;
      const endDate = new Date(year, parseInt(month), 0);
      endDate.setDate(endDate.getDate() + 1); // Next day
      const endDateStr = endDate.toISOString().split('T')[0];
      
      dateFilter.date = {
        [require('sequelize').Op.gte]: startDate,
        [require('sequelize').Op.lt]: endDateStr
      };
    } else if (year) {
      // Filter for specific year
      const startDate = `${year}-01-01`;
      const endDate = `${parseInt(year) + 1}-01-01`;
      
      dateFilter.date = {
        [require('sequelize').Op.gte]: startDate,
        [require('sequelize').Op.lt]: endDate
      };
    }
    
    // Get appointments for the doctor that are booked by users
    const filters = {
      is_booked: true,
      ...dateFilter
    };
    
    const appointments = await availabilityService.getAvailabilityByAdminId(adminId, page, limit, filters);
    
    if (!appointments || !appointments.availability || appointments.availability.length === 0) {
      // If no appointments, return empty result
      return successResponse(res, {
        data: [],
        pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: limit }
      }, 'No users found with appointments for this doctor');
    }
    
    // Group appointments by user ID
    const userAppointmentsMap = {};
    appointments.availability.forEach(appointment => {
      if (appointment.booked_by_user_id) {
        if (!userAppointmentsMap[appointment.booked_by_user_id]) {
          userAppointmentsMap[appointment.booked_by_user_id] = [];
        }
        userAppointmentsMap[appointment.booked_by_user_id].push(appointment);
      }
    });
    
    // Get user details for each user with appointments
    const userService = require('../services/authentication/userService');
    const usersWithAppointments = [];
    
    for (const userId of Object.keys(userAppointmentsMap)) {
      try {
        const user = await userService.getUserById(userId);
        if (user) {
          // Convert Sequelize instance to plain object to ensure appointments are included in response
          const userPlainObject = user.get ? user.get({ plain: true }) : user;
          
          // Add appointments to the user object, but only include the relevant appointment data
          const appointments = userAppointmentsMap[userId].map(appointment => {
            // Make sure we're accessing the correct appointment data
            return {
              id: appointment.id,
              date: appointment.date,
              start_time: appointment.start_time,
              end_time: appointment.end_time,
              is_booked: appointment.is_booked,
              status: appointment.status,
              created_at: appointment.created_at,
              updated_at: appointment.updated_at,
              admin_id: appointment.admin_id,  // Doctor's ID
              booked_by_user_id: appointment.booked_by_user_id,  // User ID who booked
              consultation: appointment.Consultation ? {
                id: appointment.Consultation.id,
                admin_id: appointment.Consultation.admin_id,
                user_id: appointment.Consultation.user_id,
                initial_issue: appointment.Consultation.initial_issue,
                status: appointment.Consultation.status,
                created_at: appointment.Consultation.created_at,
                updated_at: appointment.Consultation.updated_at
              } : null,  // Include consultation details if available
              session: appointment.Session ? {
                id: appointment.Session.id,
                admin_id: appointment.Session.admin_id,
                link: appointment.Session.link,
                link_type: appointment.Session.link_type,
                is_active: appointment.Session.is_active,
                created_at: appointment.Session.created_at,
                updated_at: appointment.Session.updated_at
              } : null,  // Include session details if available
              join_enabled: appointment.join_enabled,
              reminder_sent: appointment.reminder_sent
            };
          });
          
          // Add appointments to the plain user object
          userPlainObject.appointments = appointments;
          usersWithAppointments.push(userPlainObject);
        }
      } catch (error) {
        // Skip users that cannot be found
        console.error('Error fetching user:', error);
        continue;
      }
    }
    
    // Debug: Log the users with appointments to see what we're returning
    console.log('Users with appointments:', usersWithAppointments);
    
    successResponse(res, {
      data: usersWithAppointments,
      pagination: { 
        currentPage: appointments && appointments.currentPage ? appointments.currentPage : 1, 
        totalPages: appointments && appointments.totalPages ? appointments.totalPages : 1, 
        totalItems: usersWithAppointments.length, 
        itemsPerPage: limit 
      }
    }, 'Users with appointments retrieved successfully');
    
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

/**
 * @desc    Toggle availability slot join enabled status
 * @route   PUT /api/v1/availability/:id/toggle-join
 * @access  Private (Doctor/Secretary with permission)
 */
const toggleJoinEnabled = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if user has permission to modify this availability slot
    if (!validateProfessionalPermission(req.user) && !validateSecretaryPermission(req.user)) {
      return failureResponse(res, 'Not authorized to modify availability slots', 403);
    }
    
    // Get the availability slot to check ownership
    const availability = await availabilityService.getAvailabilityById(id);
    
    // If user is a secretary, check if they are assigned to the doctor who owns this slot
    if (req.user.role === 'secretary') {
      const isAssigned = await checkSecretaryDoctorRelationship(req.user.user_id, availability.admin_id);
      if (!isAssigned) {
        return failureResponse(res, 'Not authorized to modify this availability slot', 403);
      }
    }
    // If user is a doctor, check if they own this slot
    else if (req.user.role === 'doctor' && availability.admin_id !== req.user.user_id) {
      return failureResponse(res, 'Not authorized to modify this availability slot', 403);
    }
    
    // Toggle the join_enabled status
    const updatedData = {
      join_enabled: !availability.join_enabled
    };
    
    const updatedAvailability = await availabilityService.updateAvailability(id, updatedData);
    
    successResponse(res, updatedAvailability, `Join enabled status updated to ${updatedAvailability.join_enabled}`);
  } catch (error) {
    if (error.statusCode === 404) {
      return failureResponse(res, 'Availability slot not found', 404);
    }
    next(new AppError(error.message, error.statusCode || 500));
  }
};

module.exports = {
  getAllAvailability,
  getAvailabilityById,
  getAvailabilityByAdminId,
  createAvailability,
  updateAvailability,
  deleteAvailability,
  bookAvailabilitySlot,
  cancelBooking,
  getUsersWithAppointments,
  toggleJoinEnabled
};
