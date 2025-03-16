const cron = require('cron');
const moment = require('moment-business-days');
const Meeting = require('../models/Meeting');
const User = require('../models/User');
const Stakeholder = require('../models/Stakeholder');
const { sendEmail } = require('../config/email');
const { reminderTemplate, checkInTemplate } = require('./emailTemplates');
const { getFirstWorkingDay, getLastWorkingDay, isToday } = require('./dateUtils');

/**
 * Send meeting reminder emails
 * Runs at 8:00 AM every weekday
 */
const sendReminders = async () => {
  try {
    console.log('Running reminder job:', new Date());
    
    // Find meetings that need reminders
    // Criteria: Active meetings, reminder not sent, first day of frequency period is today
    const meetings = await Meeting.find({ 
      active: true, 
      reminderSent: false,
      status: 'scheduled'
    });
    
    for (const meeting of meetings) {
      // Calculate first working day based on meeting frequency
      const firstWorkingDay = getFirstWorkingDay(meeting.nextMeetingDate, meeting.frequency);
      
      // Check if today is the first working day
      if (isToday(firstWorkingDay)) {
        // Get stakeholder and user info
        const stakeholder = await Stakeholder.findById(meeting.stakeholder);
        const user = await User.findById(meeting.assignedTo);
        
        if (stakeholder && user) {
          // Send reminder email
          const emailContent = reminderTemplate(meeting, stakeholder, user);
          const emailResult = await sendEmail(
            user.email,
            `Meeting Reminder: ${meeting.title} with ${stakeholder.name}`,
            emailContent
          );
          
          if (emailResult.success) {
            // Mark reminder as sent
            meeting.reminderSent = true;
            await meeting.save();
            console.log(`Reminder email sent for meeting ${meeting._id}`);
          } else {
            console.error(`Failed to send reminder email for meeting ${meeting._id}:`, emailResult.error);
          }
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
    // Criteria: Active meetings, check-in not sent, last day of frequency period is today
    const meetings = await Meeting.find({ 
      active: true, 
      checkInSent: false,
      status: 'scheduled'
    });
    
    for (const meeting of meetings) {
      // Calculate last working day based on meeting frequency
      const lastWorkingDay = getLastWorkingDay(meeting.nextMeetingDate, meeting.frequency);
      
      // Check if today is the last working day
      if (isToday(lastWorkingDay)) {
        // Get stakeholder and user info
        const stakeholder = await Stakeholder.findById(meeting.stakeholder);
        const user = await User.findById(meeting.assignedTo);
        
        if (stakeholder && user) {
          // Send check-in email
          const emailContent = checkInTemplate(meeting, stakeholder, user);
          const emailResult = await sendEmail(
            user.email,
            `Meeting Check-in: ${meeting.title} with ${stakeholder.name}`,
            emailContent
          );
          
          if (emailResult.success) {
            // Mark check-in as sent
            meeting.checkInSent = true;
            await meeting.save();
            console.log(`Check-in email sent for meeting ${meeting._id}`);
          } else {
            console.error(`Failed to send check-in email for meeting ${meeting._id}:`, emailResult.error);
          }
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
    // Criteria: Active meetings, status still scheduled, date has passed
    const missedMeetings = await Meeting.find({
      active: true,
      status: 'scheduled',
      nextMeetingDate: { $lt: new Date() }
    });
    
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