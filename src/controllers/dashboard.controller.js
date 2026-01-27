const { consultationService, sessionService, availabilityService, medicalRecordService } = require('../services/index');
const { User, Admin, Consultation, Session, Availability, MedicalRecord ,Blog ,Review} = require('../models');
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
    const filter = req.query.filter || 'month'; // day, week, month, year, all
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
        dateFilters.dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        dateFilters.dateTo = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      case 'week':
        const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay(), 0, 0, 0, 0);
        const weekEnd = new Date(now.getFullYear(), now.getMonth(), weekStart.getDate() + 6, 23, 59, 59, 999);
        dateFilters.dateFrom = weekStart;
        dateFilters.dateTo = weekEnd;
        break;
      case 'month':
        // Fix: Make sure we include the full current month
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        dateFilters.dateFrom = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
        dateFilters.dateTo = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
        break;
      case 'year':
        dateFilters.dateFrom = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
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
        
    // Apply date filters to statistics calculation
    const applyDateFilter = (itemDate) => {
      if (!dateFilters.dateFrom || !dateFilters.dateTo) return true;
      return itemDate >= dateFilters.dateFrom && itemDate <= dateFilters.dateTo;
    };
    
    // Get consultations based on user role
    if (userRole === 'doctor') {
      // Doctor can see their own consultations
      const consultations = await Consultation.findAll({
        where: { admin_id: userId },
        attributes: ['id', 'created_at', 'status']
      });
      
      statistics.active_consultations.total = consultations.length;
      
      // Count by periods WITH FILTER
      consultations.forEach(consultation => {
        const createdAt = new Date(consultation.created_at);
        if (applyDateFilter(createdAt)) {
          if (isToday(createdAt)) statistics.active_consultations.today++;
          if (isThisWeek(createdAt)) statistics.active_consultations.this_week++;
          if (isThisMonth(createdAt)) statistics.active_consultations.this_month++;
          if (isThisYear(createdAt)) statistics.active_consultations.this_year++;
        }
      });
    }
    
    // Get medical records based on user role
    if (userRole === 'doctor') {
      const medicalRecords = await MedicalRecord.findAll({
        where: { doctor_id: userId },
        attributes: ['id', 'created_at']
      });
      
      statistics.medical_records.total = medicalRecords.length;
      
      // Count by periods WITH FILTER
      medicalRecords.forEach(record => {
        const createdAt = new Date(record.created_at);
        if (applyDateFilter(createdAt)) {
          if (isToday(createdAt)) statistics.medical_records.today++;
          if (isThisWeek(createdAt)) statistics.medical_records.this_week++;
          if (isThisMonth(createdAt)) statistics.medical_records.this_month++;
          if (isThisYear(createdAt)) statistics.medical_records.this_year++;
        }
      });
    }
    
    // Get scheduled appointments (availability slots)
    if (userRole === 'doctor') {
      const appointments = await Availability.findAll({
        where: { admin_id: userId, is_booked: true },
        attributes: ['id', 'created_at', 'date']
      });
      
      statistics.scheduled_appointments.total = appointments.length;
      
      // Count by periods WITH FILTER
      appointments.forEach(appointment => {
        const createdAt = new Date(appointment.created_at);
        if (applyDateFilter(createdAt)) {
          if (isToday(createdAt)) statistics.scheduled_appointments.today++;
          if (isThisWeek(createdAt)) statistics.scheduled_appointments.this_week++;
          if (isThisMonth(createdAt)) statistics.scheduled_appointments.this_month++;
          if (isThisYear(createdAt)) statistics.scheduled_appointments.this_year++;
        }
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
    
    // Get articles (blogs) count
    const articles = await Blog.findAll({
      where: { status: 'published' },
      attributes: ['id', 'created_at']
    });
    
    statistics.articles.total = articles.length;
    
    // Count articles by periods
    articles.forEach(article => {
      const createdAt = new Date(article.created_at);
      if (isToday(createdAt)) statistics.articles.today++;
      if (isThisWeek(createdAt)) statistics.articles.this_week++;
      if (isThisMonth(createdAt)) statistics.articles.this_month++;
      if (isThisYear(createdAt)) statistics.articles.this_year++;
    });
    
    // Get patient satisfaction rate (reviews)
    const reviews = await Review.findAll({
      where: { is_active: true },
      attributes: ['rating', 'created_at']
    });
    
    if (reviews.length > 0) {
      // Calculate average rating
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      statistics.patient_satisfaction_rate.average = parseFloat((totalRating / reviews.length).toFixed(1));
      
      // Count reviews by periods
      let todaySum = 0, todayCount = 0;
      let weekSum = 0, weekCount = 0;
      let monthSum = 0, monthCount = 0;
      let yearSum = 0, yearCount = 0;
      
      reviews.forEach(review => {
        const createdAt = new Date(review.created_at);
        if (isToday(createdAt)) {
          todaySum += review.rating;
          todayCount++;
        }
        if (isThisWeek(createdAt)) {
          weekSum += review.rating;
          weekCount++;
        }
        if (isThisMonth(createdAt)) {
          monthSum += review.rating;
          monthCount++;
        }
        if (isThisYear(createdAt)) {
          yearSum += review.rating;
          yearCount++;
        }
      });
      
      // Calculate period averages
      statistics.patient_satisfaction_rate.today = todayCount > 0 ? parseFloat((todaySum / todayCount).toFixed(1)) : 0;
      statistics.patient_satisfaction_rate.this_week = weekCount > 0 ? parseFloat((weekSum / weekCount).toFixed(1)) : 0;
      statistics.patient_satisfaction_rate.this_month = monthCount > 0 ? parseFloat((monthSum / monthCount).toFixed(1)) : 0;
      statistics.patient_satisfaction_rate.this_year = yearCount > 0 ? parseFloat((yearSum / yearCount).toFixed(1)) : 0;
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
