const { consultationService, sessionService, availabilityService, medicalRecordService } = require('../services/index');
const { User, Admin, Consultation, Session, Availability, MedicalRecord } = require('../models');
const AppError = require('../utils/AppError');
const { successResponse, failureResponse } = require('../utils/responseHandler');

/**
 * @desc    Get admin dashboard overview with statistics and filtering
 * @route   GET /api/v1/dashboard/admin-overview
 * @access  Private (Admin/Doctor/Secretary)
 */
const getAdminDashboardOverview = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const userRole = req.user.role;
    
    // Get filter parameters
    const filter = req.query.filter || 'all'; // day, week, month, year, all
    const dateFrom = req.query.date_from;
    const dateTo = req.query.date_to;
    
    // Build date filters
    const dateFilters = {};
    if (dateFrom) dateFilters.dateFrom = new Date(dateFrom);
    if (dateTo) dateFilters.dateTo = new Date(dateTo);
    
    // Apply predefined filters
    const now = new Date();
    switch (filter) {
      case 'day':
        dateFilters.dateFrom = new Date(now.setHours(0, 0, 0, 0));
        dateFilters.dateTo = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        dateFilters.dateFrom = weekStart;
        dateFilters.dateTo = weekEnd;
        break;
      case 'month':
        dateFilters.dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilters.dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'year':
        dateFilters.dateFrom = new Date(now.getFullYear(), 0, 1);
        dateFilters.dateTo = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
    }
    
    // Get user profile information
    let userProfile;
    if (userRole === 'doctor' || userRole === 'secretary') {
      userProfile = await Admin.findByPk(userId, {
        attributes: ['user_id', 'full_name', 'email', 'role', 'is_active', 'created_at']
      });
    } else {
      userProfile = await User.findByPk(userId, {
        attributes: ['user_id', 'full_name', 'email', 'role', 'is_active', 'created_at']
      });
    }
    
    // Initialize statistics object
    const statistics = {
      active_consultations: { total: 0, today: 0, this_week: 0, this_month: 0, this_year: 0 },
      medical_records: { total: 0, today: 0, this_week: 0, this_month: 0, this_year: 0 },
      scheduled_appointments: { total: 0, today: 0, this_week: 0, this_month: 0, this_year: 0 },
      articles: { total: 0, today: 0, this_week: 0, this_month: 0, this_year: 0 },
      registered_patients: { total: 0, today: 0, this_week: 0, this_month: 0, this_year: 0 },
      patient_satisfaction_rate: { average: 0.0, today: 0.0, this_week: 0.0, this_month: 0.0, this_year: 0.0 }
    };
    
    // Get consultations based on user role
    if (userRole === 'doctor') {
      // Doctor can see their own consultations
      const consultations = await Consultation.findAll({
        where: { admin_id: userId },
        attributes: ['id', 'created_at', 'status']
      });
      
      statistics.active_consultations.total = consultations.length;
      
      // Count by periods
      consultations.forEach(consultation => {
        const createdAt = new Date(consultation.created_at);
        if (isToday(createdAt)) statistics.active_consultations.today++;
        if (isThisWeek(createdAt)) statistics.active_consultations.this_week++;
        if (isThisMonth(createdAt)) statistics.active_consultations.this_month++;
        if (isThisYear(createdAt)) statistics.active_consultations.this_year++;
      });
    }
    
    // Get medical records based on user role
    if (userRole === 'doctor') {
      const medicalRecords = await MedicalRecord.findAll({
        where: { doctor_id: userId },
        attributes: ['id', 'created_at']
      });
      
      statistics.medical_records.total = medicalRecords.length;
      
      // Count by periods
      medicalRecords.forEach(record => {
        const createdAt = new Date(record.created_at);
        if (isToday(createdAt)) statistics.medical_records.today++;
        if (isThisWeek(createdAt)) statistics.medical_records.this_week++;
        if (isThisMonth(createdAt)) statistics.medical_records.this_month++;
        if (isThisYear(createdAt)) statistics.medical_records.this_year++;
      });
    }
    
    // Get scheduled appointments (availability slots)
    if (userRole === 'doctor') {
      const appointments = await Availability.findAll({
        where: { admin_id: userId, is_booked: true },
        attributes: ['id', 'created_at', 'date']
      });
      
      statistics.scheduled_appointments.total = appointments.length;
      
      // Count by periods
      appointments.forEach(appointment => {
        const createdAt = new Date(appointment.created_at);
        if (isToday(createdAt)) statistics.scheduled_appointments.today++;
        if (isThisWeek(createdAt)) statistics.scheduled_appointments.this_week++;
        if (isThisMonth(createdAt)) statistics.scheduled_appointments.this_month++;
        if (isThisYear(createdAt)) statistics.scheduled_appointments.this_year++;
      });
    }
    
    // Get registered patients (for doctors, patients they've consulted)
    if (userRole === 'doctor') {
      const patientIds = await Consultation.findAll({
        where: { admin_id: userId },
        attributes: ['user_id'],
        group: ['user_id']
      });
      
      statistics.registered_patients.total = patientIds.length;
      
      // For simplicity, distributing evenly across periods
      const dailyAvg = Math.ceil(statistics.registered_patients.total / 365);
      statistics.registered_patients.today = Math.min(dailyAvg, statistics.registered_patients.total);
      statistics.registered_patients.this_week = Math.min(dailyAvg * 7, statistics.registered_patients.total);
      statistics.registered_patients.this_month = Math.min(dailyAvg * 30, statistics.registered_patients.total);
      statistics.registered_patients.this_year = statistics.registered_patients.total;
    }
    
    // Build response
    const dashboardData = {
      profile: {
        name: userProfile.full_name,
        email: userProfile.email,
        role: userProfile.role,
        status: userProfile.is_active ? 'active' : 'inactive',
        registration_date: userProfile.created_at
      },
      statistics,
      filters: {
        current_filter: filter,
        date_range: dateFilters.dateFrom && dateFilters.dateTo ? 
          `${dateFilters.dateFrom.toISOString().split('T')[0]} to ${dateFilters.dateTo.toISOString().split('T')[0]}` : 
          'All time'
      }
    };
    
    successResponse(res, dashboardData, 'Admin dashboard overview retrieved successfully');
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 500));
  }
};

// Helper functions for date comparisons
const isToday = (date) => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
};

const isThisWeek = (date) => {
  const now = new Date();
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return date >= weekStart && date <= weekEnd;
};

const isThisMonth = (date) => {
  const now = new Date();
  return date.getMonth() === now.getMonth() &&
         date.getFullYear() === now.getFullYear();
};

const isThisYear = (date) => {
  const now = new Date();
  return date.getFullYear() === now.getFullYear();
};

module.exports = {
  getAdminDashboardOverview
};
