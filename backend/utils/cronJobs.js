const cron = require('cron');
const moment = require('moment-business-days');
const Meeting = require('../models/Meeting');
const User = require('../models/User');
const Stakeholder = require('../models/Stakeholder');
const { sendEmail } = require('../config/email');
const { sendWhatsAppMessage } = require('../utils/whatsappNotification');
const { 
  reminderTemplate, 
  checkInTemplate 
} = require('./emailTemplates');
const { 
  getFirstWorkingDay, 
  getLastWorkingDay, 
  isTodayFirstWorkingDay, 
  isTodayLastWorkingDay, 
  calculateNextMeetingDate 
} = require('./dateUtils');
const { 
  generateReminderWhatsAppMessage, 
  generateCheckInWhatsAppMessage 
} = require('../utils/whatsappMessageTemplate');

// Helper function to send notifications
const sendNotifications = async (user, meeting, emailTemplate, emailSubject, whatsappMessage) => {
  try {
    // Send email
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const meetingUrl = `${frontendUrl}/meetings/${meeting._id}`;
    const html = emailTemplate(meeting, meetingUrl);
    
    const emailResult = await sendEmail(user.email, emailSubject, html);
    
    // Send WhatsApp message if mobile number exists
    let whatsappResult = null;
    if (user.mobile) {
      try {
        whatsappResult = await sendWhatsAppMessage(user.mobile, whatsappMessage);
      } catch (error) {
        console.error('WhatsApp notification failed:', error);
      }
    }
    
    return { emailResult, whatsappResult };
  } catch (error) {
    console.error('Notification sending error:', error);
    return { error: true, message: error.message };
  }
};

/**
 * Send meeting reminder emails
 * Runs at 8:00 AM every weekday
 */
const sendReminders = async () => {
  try {
    console.log('Running reminder job:', new Date());
    
    // Find meetings that need reminders
    const meetings = await Meeting.find({ 
      active: true, 
      reminderSent: false,
      status: 'scheduled'
    }).populate('stakeholder').populate('assignedTo');
    
    for (const meeting of meetings) {
      // Calculate first working day based on meeting frequency
      if (isTodayFirstWorkingDay(meeting.nextMeetingDate, meeting.frequency)) {
        // Validate stakeholder and users
        if (meeting.stakeholder && meeting.assignedTo && meeting.assignedTo.length > 0) {
          // Prepare WhatsApp message
          const whatsappMessage = generateReminderWhatsAppMessage(meeting);
          
          // Send notifications to all assigned users
          const notificationPromises = meeting.assignedTo.map(user => {
            return sendNotifications(
              user, 
              meeting, 
              reminderTemplate, 
              `Meeting Reminder: ${meeting.title} with ${meeting.stakeholder.name}`,
              whatsappMessage
            );
          });
          
          await Promise.all(notificationPromises);
          
          // Mark reminder as sent
          meeting.reminderSent = true;
          await meeting.save();
          console.log(`Reminder notifications sent for meeting ${meeting._id}`);
        }
      }
    }
  } catch (error) {
    console.error('Error in sendReminders job:', error);
  }
};

/**
 * Send meeting check-in emails
 * Runs at 3:00 PM every weekday
 */
const sendCheckIns = async () => {
  try {
    console.log('Running check-in job:', new Date());
    
    // Find meetings that need check-ins
    const meetings = await Meeting.find({ 
      active: true, 
      checkInSent: false,
      status: 'scheduled'
    }).populate('stakeholder').populate('assignedTo');
    
    for (const meeting of meetings) {
      // Check if today is the last working day
      if (isTodayLastWorkingDay(meeting.nextMeetingDate, meeting.frequency)) {
        // Validate stakeholder and users
        if (meeting.stakeholder && meeting.assignedTo && meeting.assignedTo.length > 0) {
          // Prepare WhatsApp message
          const whatsappMessage = generateCheckInWhatsAppMessage(meeting);
          
          // Send notifications to all assigned users
          const notificationPromises = meeting.assignedTo.map(user => {
            return sendNotifications(
              user, 
              meeting, 
              checkInTemplate, 
              `Meeting Check-in: ${meeting.title} with ${meeting.stakeholder.name}`,
              whatsappMessage
            );
          });
          
          await Promise.all(notificationPromises);
          
          // Mark check-in as sent
          meeting.checkInSent = true;
          await meeting.save();
          console.log(`Check-in notifications sent for meeting ${meeting._id}`);
        }
      }
    }
  } catch (error) {
    console.error('Error in sendCheckIns job:', error);
  }
};

/**
 * Update meeting statuses for missed meetings
 * Runs at midnight every day
 */
const updateMissedMeetings = async () => {
  try {
    console.log('Running missed meetings job:', new Date());
    
    // Find meetings that were missed
    const missedMeetings = await Meeting.find({
      active: true,
      status: 'scheduled',
      nextMeetingDate: { $lt: new Date() }
    }).populate('stakeholder').populate('assignedTo');
    
    for (const meeting of missedMeetings) {
      // If no response after 2 days, mark as missed
      const daysPassed = moment().diff(moment(meeting.nextMeetingDate), 'days');
      
      if (daysPassed >= 2) {
        meeting.status = 'missed';
        meeting.missedReasons.push({
          date: meeting.nextMeetingDate,
          reason: 'No response from user'
        });
        
        // Schedule next meeting
        const newNextMeetingDate = calculateNextMeetingDate(meeting.nextMeetingDate, meeting.frequency);
        meeting.nextMeetingDate = newNextMeetingDate;
        meeting.reminderSent = false;
        meeting.checkInSent = false;
        
        await meeting.save();
        console.log(`Meeting ${meeting._id} marked as missed and rescheduled`);
      }
    }
  } catch (error) {
    console.error('Error in updateMissedMeetings job:', error);
  }
};

/**
 * Set up all cron jobs
 */
const setupCronJobs = () => {
  // Send reminders at 8:00 AM every weekday (Monday-Friday)
  const reminderJob = new cron.CronJob('0 8 * * 1-5', sendReminders);
  
  // Send check-ins at 3:00 PM every weekday (Monday-Friday)
  const checkInJob = new cron.CronJob('0 15 * * 1-5', sendCheckIns);
  
  // Update missed meetings at midnight every day
  const missedMeetingsJob = new cron.CronJob('0 0 * * *', updateMissedMeetings);
  
  // Start cron jobs
  reminderJob.start();
  checkInJob.start();
  missedMeetingsJob.start();
  
  console.log('Cron jobs scheduled');
};

// For testing purposes, you can call these functions directly
const runJobs = async () => {
  await sendReminders();
  await sendCheckIns();
  await updateMissedMeetings();
};

module.exports = {
  setupCronJobs,
  runJobs // Export for testing
};