const cron = require('node-cron');
const { tokenService, notificationService } = require('../services/index');
const { sequelize } = require('../config/database');
const { User, Admin, Availability, Consultation } = require('../models');
const { emailService } = require('../services');
const path = require('path');
const fs = require('fs');

/**
 * Cleanup Jobs Utility
 * 
 * This file contains scheduled jobs for cleaning up expired data
 * to maintain optimal database performance.
 */

// Weekly cleanup job for expired blacklisted tokens
// Runs every Sunday at 2:00 AM
const startWeeklyCleanupJob = () => {
    cron.schedule('0 2 * * 0', async () => {
        console.log('Starting weekly cleanup of expired blacklisted tokens...');
        try {
            const cleanedCount = await tokenService.cleanupExpiredBlacklistedTokens();
            console.log(`Weekly cleanup completed. Removed ${cleanedCount} expired blacklisted tokens.`);
        } catch (error) {
            console.error('Error during weekly cleanup:', error);
        }
    } 
    , {
    scheduled: true,
    timezone: "Europe/London"
  });
    console.log('Weekly cleanup job scheduled to run every Sunday at 2:00 AM');
};
 
// Daily appointment reminder job
// Runs every day at 7:00 AM to send reminders for appointments scheduled for today
const startDailyAppointmentReminderJob = () => {
    cron.schedule('0 7 * * *', async () => {
       
 
        console.log('Starting daily appointment reminder job...');
        try {
            const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
            
            // Find all availability slots for today that are booked and haven't had reminders sent yet
            const availabilitySlots = await Availability.findAll({
                where: {
                    date: today,
                    is_booked: true,
                    reminder_sent: false
                },
                include: [
                    {
                        model: User,
                        attributes: ['user_id', 'full_name', 'email']
                    },
                    {
                        model: Admin,
                        attributes: ['user_id', 'full_name']
                    },
                    {
                        model: Consultation,
                        attributes: ['id', 'initial_issue']
                    }
                ]
            });
            
            console.log(`Found ${availabilitySlots.length} booked appointments for today`);
            
            for (const slot of availabilitySlots) {
                try {
                    // Get user details from the joined result using proper aliases
                    const user = slot.User; // Based on the SQL: User.user_id AS User.user_id
                    const admin = slot.Admin; // Based on the SQL: Admin.user_id AS Admin.user_id
                    const consultation = slot.Consultation; // Based on the SQL: Consultation.id AS Consultation.id
                    
                    // Check if user and admin exist before sending email
                    if (user && user.email && user.full_name && admin && admin.full_name) {
                        // Send email reminder
                        const emailTemplatePath = path.join(__dirname, '../templates/emails/appointment-reminder.html');
                        let emailTemplate;
                        
                        // Read the appointment reminder template
                        emailTemplate = fs.readFileSync(emailTemplatePath, 'utf8');
                        
                        // Replace placeholders in the template
                        const emailContent = emailTemplate
                            .replace('{{name}}', user.full_name)
                            .replace('{{appointment_date}}', slot.date)
                            .replace('{{start_time}}', slot.start_time)
                            .replace('{{end_time}}', slot.end_time || 'TBD')
                            .replace('{{doctor_name}}', admin.full_name)
                            .replace('{{consultation_title}}', consultation ? consultation.initial_issue : 'General Consultation');
                        
                        // Send the email
                        await emailService.sendEmail({
                            to: user.email,
                            subject: `Appointment Reminder - ${slot.date}`,
                            html: emailContent
                        });
                        
                        console.log(`Email reminder sent to ${user.email} for appointment on ${slot.date}`);
                    } else {
                        console.log(`User or admin not found for slot ${slot.id}, skipping email`);
                    }
                    
                    // Create notification for the user if user and admin exist
                    if (user && admin && admin.full_name) {
                        try {
                            const notificationData = {
                                user_id: user.user_id,
                                title: { en: 'Appointment Reminder', ar: 'تذكير بالموعد' },
                                message: { 
                                    en: `You have an appointment scheduled for today (${slot.date}) from ${slot.start_time}${slot.end_time ? ` to ${slot.end_time}` : ''} with Dr. ${admin.full_name}.`,
                                    ar: `لديك موعد مجدول اليوم (${slot.date}) من ${slot.start_time}${slot.end_time ? ` إلى ${slot.end_time}` : ''} مع د. ${admin.full_name}.`
                                },
                                type: 'appointment',
                                related_id: slot.id,
                                target_route: `/appointments/${slot.id}`
                            };
                            
                            await notificationService.createNotification(notificationData);
                            console.log(`Notification created for user ${user.user_id} for appointment on ${slot.date}`);
                            
                        } catch (notificationError) {
                            console.error(`Failed to create notification for slot ${slot.id}:`, notificationError.message);
                            console.log(`Continuing with email reminder and updating reminder_sent flag for slot ${slot.id}`);
                        }
                    } else {
                        console.log(`User or admin not found for slot ${slot.id}, skipping notification`);
                    }
                    
                    // Mark reminder as sent (this should happen regardless of notification success)
                    await slot.update({ reminder_sent: true });
                    console.log(`Reminder sent flag updated for slot ${slot.id}`);
                    
                } catch (error) {
                    console.error(`Error processing appointment reminder for slot ${slot.id}:`, error);
                }
            }
            
            console.log('Daily appointment reminder job completed.');
        } catch (error) {
            console.error('Error during daily appointment reminder job:', error);
        }
    }, {
    scheduled: true,
    timezone: "Europe/London"
  });
    
    console.log('Daily appointment reminder job scheduled to run every day at 7:00 AM');
};

module.exports = {
    startWeeklyCleanupJob,
    startDailyAppointmentReminderJob
};

