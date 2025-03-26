// backend/utils/whatsappMessageTemplate.js

const generateWhatsAppMessage = (meeting) => {
    const meetingDate = new Date(meeting.nextMeetingDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  
    return `📅 New Meeting Scheduled
  
  Meeting: ${meeting.title}
  Stakeholder: ${meeting.stakeholder.name} (${meeting.stakeholder.company})
  Date: ${meetingDate}
  Frequency: ${meeting.frequency}
  
  Please log into the Meeting Management System for more details.
  
  Best regards,
  Meeting Management System`;
  };
  
  // Templates for different notification types
  const generateReminderWhatsAppMessage = (meeting) => {
    const meetingDate = new Date(meeting.nextMeetingDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  
    return `⏰ Meeting Reminder
  
  Meeting: ${meeting.title}
  Stakeholder: ${meeting.stakeholder.name}
  Date: ${meetingDate}
  
  Don't forget to prepare and review your meeting details.
  
  Best regards,
  Meeting Management System`;
  };
  
  const generateCheckInWhatsAppMessage = (meeting) => {
    const meetingDate = new Date(meeting.nextMeetingDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  
    return `✔️ Meeting Check-in Required
  
  Meeting: ${meeting.title}
  Stakeholder: ${meeting.stakeholder.name}
  Date: ${meetingDate}
  
  Please update the status of this meeting in the Management System.
  
  Best regards,
  Meeting Management System`;
  };
  
  module.exports = {
    generateWhatsAppMessage,
    generateReminderWhatsAppMessage,
    generateCheckInWhatsAppMessage
  };