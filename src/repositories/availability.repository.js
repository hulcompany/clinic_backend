const { Availability, Admin, User, Consultation, Session } = require('../models');
const { Op } = require('sequelize');
const AppError = require('../utils/AppError');

class AvailabilityRepository {
  // Get all availability slots with pagination and filtering
  async getAllAvailability(page = 1, limit = 10, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      
      // Build where clause based on filters
      const whereClause = {};
      
      // Status filter
      if (filters.status) {
        whereClause.status = filters.status;
      }
      
      // Booked status filter
      if (filters.is_booked !== undefined) {
        whereClause.is_booked = filters.is_booked;
      }
      
      // Booked by user filter
      if (filters.booked_by_user_id) {
        whereClause.booked_by_user_id = filters.booked_by_user_id;
      }
      
      // Admin ID filter
      if (filters.admin_id) {
        whereClause.admin_id = filters.admin_id;
      }
      
      const { count, rows } = await Availability.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [
          ['status', 'ASC'], // available, cancelled, unavailable
          ['is_booked', 'ASC'], // not booked first
          ['date', 'ASC'],
          ['start_time', 'ASC']
        ],
        include: [
          {
            model: Admin,
            as: 'Admin',
            attributes: ['user_id', 'full_name', 'email', 'phone', 'role', 'image']
          },
          {
            model: User,
            as: 'User',
            attributes: ['user_id', 'full_name', 'email', 'phone', 'image'],
            required: false
          },
          {
            model: Session,
            as: 'Session',
            attributes: ['id', 'admin_id', 'link', 'link_type', 'is_active', 'created_at', 'updated_at'],
            required: false
          }
        ]
      });
      
      return {
        availability: rows,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalItems: count
      };
    } catch (error) {
      throw new AppError('Failed to get availability: ' + error.message, 500);
    }
  }

  // Get availability by ID
  async getAvailabilityById(id) {
    try {
      const availability = await Availability.findByPk(id, {
        include: [
          {
            model: Admin,
            as: 'Admin',
            attributes: ['user_id', 'full_name', 'email', 'phone', 'role', 'image']
          },
          {
            model: User,
            as: 'User',
            attributes: ['user_id', 'full_name', 'email', 'phone', 'image'],
            required: false
          },
          {
            model: Consultation,
            as: 'Consultation',
            attributes: ['id', 'admin_id', 'user_id', 'initial_issue', 'status', 'created_at', 'updated_at'],
            required: false
          },
          {
            model: Session,
            as: 'Session',
            attributes: ['id', 'admin_id', 'link', 'link_type', 'is_active', 'created_at', 'updated_at'],
            required: false
          }
        ]
      });
      
      if (!availability) {
        throw new AppError('Availability not found', 404);
      }
      
      return availability;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get availability: ' + error.message, 500);
    }
  }

  // Get availability by admin ID
  async getAvailabilityByAdminId(adminId, page = 1, limit = 10, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      
      // Build where clause
      const whereClause = { admin_id: adminId };
      
      // Status filter
      if (filters.status) {
        whereClause.status = filters.status;
      }
      
      // Booked status filter
      if (filters.is_booked !== undefined) {
        whereClause.is_booked = filters.is_booked;
      }
      
      // Booked by user filter
      if (filters.booked_by_user_id) {
        whereClause.booked_by_user_id = filters.booked_by_user_id;
      }
      
      // Date filters
      if (filters.date) {
        whereClause.date = filters.date;
      }
      
      if (filters.date && typeof filters.date === 'object') {
        // Handle date range filters
        Object.assign(whereClause, filters.date);
      }
      
      // Build include with potential search conditions
      const includeArray = [
        {
          model: Admin,
          as: 'Admin',
          attributes: ['user_id', 'full_name', 'email', 'phone', 'role', 'image']
        },
        {
          model: User,
          as: 'User',
          attributes: ['user_id', 'full_name', 'email', 'phone', 'image'],
          required: false
        },
        {
          model: Consultation,
          as: 'Consultation',
          attributes: ['id', 'admin_id', 'user_id', 'initial_issue', 'status', 'created_at', 'updated_at'],
          required: false
        },
        {
          model: Session,
          as: 'Session',
          attributes: ['id', 'admin_id', 'link', 'link_type', 'is_active', 'created_at', 'updated_at'],
          required: false
        }
      ];
      
      // Add search functionality for user details
      if (filters.search) {
        // Add a condition to the User model include to enable searching
        const searchInclude = includeArray.find(inc => inc.as === 'User');
        if (searchInclude) {
          searchInclude.where = {
            [Op.or]: [
              { full_name: { [Op.like]: `%${filters.search}%` } },
              { email: { [Op.like]: `%${filters.search}%` } },
              { phone: { [Op.like]: `%${filters.search}%` } }
            ]
          };
        }
      }
      
      // Define order based on filters
      let order = [];
      
      // Apply sorting based on filters
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case 'date':
            order.push(['date', filters.sortOrder || 'ASC']);
            break;
          case 'status':
            order.push(['status', filters.sortOrder || 'ASC']);
            break;
          case 'is_booked':
            order.push(['is_booked', filters.sortOrder || 'ASC']);
            break;
          case 'booked_by_user_id':
            order.push(['booked_by_user_id', filters.sortOrder || 'ASC']);
            break;
          case 'user_name':
            // Sort by user's full name
            order.push([{ model: User, as: 'User' }, 'full_name', filters.sortOrder || 'ASC']);
            break;
          default:
            // Default sorting
            order.push(['status', 'ASC']);
            order.push(['is_booked', 'ASC']);
            order.push(['date', 'ASC']);
            order.push(['start_time', 'ASC']);
        }
      } else {
        // Default sorting
        order.push(['status', 'ASC']);
        order.push(['is_booked', 'ASC']);
        order.push(['date', 'ASC']);
        order.push(['start_time', 'ASC']);
      }
      
      const { count, rows } = await Availability.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order,
        include: includeArray
      });
      
      return {
        availability: rows,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalItems: count
      };
    } catch (error) {
      throw new AppError('Failed to get availability: ' + error.message, 500);
    }
  }

  // Create new availability slot
  async createAvailability(data) {
    try {
      // Automatically set status based on date/time
      const now = new Date();
      const slotDateTime = new Date(data.date);
      slotDateTime.setHours(
        parseInt(data.start_time.split(':')[0]),
        parseInt(data.start_time.split(':')[1]),
        parseInt(data.start_time.split(':')[2] || 0)
      );
      
      // If slot is in the past, set status to unavailable
      if (slotDateTime < now) {
        data.status = 'unavailable';
      } else {
        data.status = 'available';
      }
      
      // Logical consistency: if booked_by_user_id is provided, mark as booked and unavailable
      if (data.booked_by_user_id) {
        data.is_booked = true;
        data.status = 'unavailable';
      }
      
      // If marked as booked, ensure booked_by_user_id is provided
      if (data.is_booked && !data.booked_by_user_id) {
        throw new AppError('booked_by_user_id is required when is_booked is true', 400);
      }
      
      const availability = await Availability.create(data);
      return await this.getAvailabilityById(availability.id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create availability: ' + error.message, 500);
    }
  }

  // Update availability slot
  async updateAvailability(id, data) {
    try {
      const availability = await this.getAvailabilityById(id);
      
      // Only perform date/time validation if date or start_time is being updated
      if (data.date || data.start_time) {
        const now = new Date();
        const slotDate = data.date || availability.date;
        const slotTime = data.start_time || availability.start_time;
        
        const slotDateTime = new Date(slotDate);
        slotDateTime.setHours(
          parseInt(slotTime.split(':')[0]),
          parseInt(slotTime.split(':')[1]),
          parseInt(slotTime.split(':')[2] || 0)
        );
        
        // If slot is in the past, set status to unavailable
        if (slotDateTime < now) {
          data.status = 'unavailable';
        } else {
          // Only set to available if it's not already booked or cancelled
          if (availability.status !== 'cancelled' && !availability.is_booked) {
            data.status = 'available';
          }
        }
      }
      
      // Logical consistency: if booked_by_user_id is provided, mark as booked and unavailable
      if (data.booked_by_user_id) {
        data.is_booked = true;
        // Only set status to unavailable if it's not already cancelled
        if (data.status !== 'cancelled') {
          data.status = 'unavailable';
        }
      }
      
      // If marked as booked, ensure booked_by_user_id is provided
      if (data.is_booked && !data.booked_by_user_id && !availability.booked_by_user_id) {
        throw new AppError('booked_by_user_id is required when is_booked is true', 400);
      }
      
      await availability.update(data);
      return await this.getAvailabilityById(id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update availability: ' + error.message, 500);
    }
  }

  // Simple toggle method for join_enabled field only
  async toggleJoinEnabled(id) {
    try {
      const availability = await this.getAvailabilityById(id);
      const newJoinEnabled = !availability.join_enabled;
      
      await availability.update({ join_enabled: newJoinEnabled });
      return await this.getAvailabilityById(id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to toggle join enabled: ' + error.message, 500);
    }
  }

  // Delete availability slot
  async deleteAvailability(id) {
    try {
      const availability = await this.getAvailabilityById(id);
      await availability.destroy();
      return { message: 'Availability slot permanently deleted from database' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete availability: ' + error.message, 500);
    }
  }

  // Book an availability slot
  async bookAvailabilitySlot(id, userId) {
    try {
      const availability = await this.getAvailabilityById(id);
      
      if (availability.is_booked) {
        throw new AppError('This slot is already booked', 400);
      }
      
      if (availability.status !== 'available') {
        throw new AppError('This slot is not available for booking', 400);
      }
      
      // Find the latest consultation for this user
      const latestConsultation = await Consultation.findOne({
        where: {
          user_id: userId,
          admin_id: availability.admin_id  // Match the doctor who owns the availability slot
        },
        order: [['created_at', 'DESC']]
      });
      
      // Find active sessions for the doctor
      const activeSessions = await Session.findAll({
        where: {
          admin_id: availability.admin_id,
          is_active: true
        },
        order: [['created_at', 'DESC']]
      });
      
      // Prepare update data
      const updateData = {
        is_booked: true,
        booked_by_user_id: userId,
        status: 'unavailable',
        join_enabled: false,  // Default to false for new bookings
        reminder_sent: false  // Default to false for new bookings
      };
      
      // Add consultation and session associations if found
      if (latestConsultation) {
        updateData.consultation_id = latestConsultation.id;
      }
      
      if (activeSessions.length > 0) {
        // Use the most recent active session
        updateData.session_id = activeSessions[0].id;
      }
      
      await availability.update(updateData);
      
      return await this.getAvailabilityById(id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to book availability slot: ' + error.message, 500);
    }
  }

  // Cancel booking of an availability slot
  async cancelBooking(id) {
    try {
      const availability = await this.getAvailabilityById(id);
      
      if (!availability.is_booked) {
        throw new AppError('This slot is not booked', 400);
      }
      
      // When cancelling, set status to cancelled, preserve booked_by_user_id, and set join_enabled to false
      await availability.update({
        is_booked: false,
        status: 'cancelled',
        join_enabled: false
        // Don't update booked_by_user_id to preserve the original user ID
      });
      
      return await this.getAvailabilityById(id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to cancel booking: ' + error.message, 500);
    }
  }
  
  // Mark past slots as unavailable
  async markPastSlotsAsUnavailable() {
    try {
      const now = new Date();
      const result = await Availability.update(
        { status: 'unavailable' },
        {
          where: {
            status: 'available',
            [Op.or]: [
              {
                date: {
                  [Op.lt]: now.toISOString().split('T')[0]
                }
              },
              {
                date: now.toISOString().split('T')[0],
                start_time: {
                  [Op.lt]: now.toTimeString().substring(0, 8)
                }
              }
            ]
          }
        }
      );
      
      return { message: `Updated ${result[0]} slots to unavailable status` };
    } catch (error) {
      throw new AppError('Failed to update past slots: ' + error.message, 500);
    }
  }
}

module.exports = new AvailabilityRepository();

