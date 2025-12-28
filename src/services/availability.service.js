const availabilityRepository = require('../repositories/availability.repository');
const AppError = require('../utils/AppError');

class AvailabilityService {
  // Get all availability slots with pagination and filtering
  async getAllAvailability(page, limit, filters) {
    try {
      // Automatically mark past slots as unavailable before fetching
      await availabilityRepository.markPastSlotsAsUnavailable();
      
      const result = await availabilityRepository.getAllAvailability(page, limit, filters);
      return result;
    } catch (error) {
      throw new AppError('Failed to get availability: ' + error.message, 500);
    }
  }

  // Get availability by ID
  async getAvailabilityById(id) {
    try {
      const availability = await availabilityRepository.getAvailabilityById(id);
      return availability;
    } catch (error) {
      if (error.message.includes('Availability not found')) {
        throw new AppError('Availability not found', 404);
      }
      throw new AppError('Failed to get availability: ' + error.message, 500);
    }
  }

  // Get availability by admin ID
  async getAvailabilityByAdminId(adminId, page, limit, filters) {
    try {
      // Automatically mark past slots as unavailable before fetching
      await availabilityRepository.markPastSlotsAsUnavailable();
      
      const result = await availabilityRepository.getAvailabilityByAdminId(adminId, page, limit, filters);
      return result;
    } catch (error) {
      throw new AppError('Failed to get availability: ' + error.message, 500);
    }
  }

  // Create new availability slot (doctor/secretary only)
  async createAvailability(adminId, data) {
    try {
      // Validate required fields
      if (!data.date || !data.start_time) {
        throw new AppError('Date and start time are required', 400);
      }

      const availabilityData = {
        admin_id: adminId,
        date: data.date,
        start_time: data.start_time,
        end_time: data.end_time || null,
        is_booked: data.is_booked || false,
        booked_by_user_id: data.booked_by_user_id || null,
        consultation_id: data.consultation_id || null,
        session_id: data.session_id || null,
        join_enabled: data.join_enabled !== undefined ? data.join_enabled : false,
        reminder_sent: data.reminder_sent !== undefined ? data.reminder_sent : false
      };

      const availability = await availabilityRepository.createAvailability(availabilityData);
      return availability;
    } catch (error) {
      throw new AppError('Failed to create availability: ' + error.message, 500);
    }
  }

  // Update availability slot (doctor/secretary owner only)
  async updateAvailability(id, adminId, userRole, data) {
    try {
      const updateData = {};
      
      if (data.date) {
        updateData.date = data.date;
      }
      
      if (data.start_time) {
        updateData.start_time = data.start_time;
      }
      
      if (data.end_time !== undefined) {
        updateData.end_time = data.end_time;
      }
      
      if (data.booked_by_user_id !== undefined) {
        updateData.booked_by_user_id = data.booked_by_user_id;
      }
      
      if (data.status) {
        updateData.status = data.status;
      }
      
      if (data.consultation_id !== undefined) {
        updateData.consultation_id = data.consultation_id;
      }
      
      if (data.session_id !== undefined) {
        updateData.session_id = data.session_id;
      }
      
      if (data.join_enabled !== undefined) {
        updateData.join_enabled = data.join_enabled;
      }
      
      if (data.reminder_sent !== undefined) {
        updateData.reminder_sent = data.reminder_sent;
      }

      const updatedAvailability = await availabilityRepository.updateAvailability(id, updateData);
      return updatedAvailability;
    } catch (error) {
      if (error.message.includes('Availability not found')) {
        throw new AppError('Availability not found', 404);
      }
      throw new AppError('Failed to update availability: ' + error.message, 500);
    }
  }

  // Delete availability slot (doctor/secretary owner only)
  async deleteAvailability(id) {
    try {
      const result = await availabilityRepository.deleteAvailability(id);
      return result;
    } catch (error) {
      if (error.message.includes('Availability not found')) {
        throw new AppError('Availability not found', 404);
      }
      throw new AppError('Failed to delete availability: ' + error.message, 500);
    }
  }

  // Book an availability slot (user only)
  async bookAvailabilitySlot(id, userId, userRole) {
    try {
      const availability = await availabilityRepository.bookAvailabilitySlot(id, userId);
      return availability;
    } catch (error) {
      if (error.message.includes('Availability not found')) {
        throw new AppError('Availability not found', 404);
      }
      if (error.message.includes('already booked')) {
        throw new AppError('This slot is already booked', 400);
      }
      if (error.message.includes('not available')) {
        throw new AppError('This slot is not available for booking', 400);
      }
      throw new AppError('Failed to book availability slot: ' + error.message, 500);
    }
  }

  // Cancel booking of an availability slot
  async cancelBooking(id) {
    try {
      const result = await availabilityRepository.cancelBooking(id);
      return result;
    } catch (error) {
      if (error.message.includes('Availability not found')) {
        throw new AppError('Availability not found', 404);
      }
      if (error.message.includes('not booked')) {
        throw new AppError('This slot is not booked', 400);
      }
      throw new AppError('Failed to cancel booking: ' + error.message, 500);
    }
  }
  
  // Mark past slots as unavailable
  async markPastSlotsAsUnavailable() {
    try {
      const result = await availabilityRepository.markPastSlotsAsUnavailable();
      return result;
    } catch (error) {
      throw new AppError('Failed to update past slots: ' + error.message, 500);
    }
  }
}

module.exports = new AvailabilityService();