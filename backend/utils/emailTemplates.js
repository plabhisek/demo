// Reminder email template
const reminderTemplate = (meeting) => {
    const meetingDate = new Date(meeting.nextMeetingDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #333;">Meeting Reminder</h2>
        <p>Hello ${meeting.assignedTo.name},</p>
        <p>This is a reminder about your upcoming meeting:</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Title:</strong> ${meeting.title}</p>
          <p><strong>Stakeholder:</strong> ${meeting.stakeholder.name}</p>
          <p><strong>Date:</strong> ${meetingDate}</p>
        </div>
        <p>Please ensure you are prepared for this meeting. You can view the meeting details and update its status by logging into the Meeting Management System.</p>
        <p>Thanks,<br>Meeting Management System</p>
      </div>
    `;
  };
  
  // Check-in email template
  const checkInTemplate = (meeting) => {
    const meetingDate = new Date(meeting.nextMeetingDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #333;">Meeting Check-in</h2>
        <p>Hello ${meeting.assignedTo.name},</p>
        <p>We're checking in about your scheduled meeting:</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Title:</strong> ${meeting.title}</p>
          <p><strong>Stakeholder:</strong> ${meeting.stakeholder.name}</p>
          <p><strong>Date:</strong> ${meetingDate}</p>
        </div>
        <p>Did this meeting take place? Please log into the Meeting Management System to:</p>
        <ul>
          <li>Record minutes of the meeting if it happened</li>
          <li>Provide a reason if the meeting didn't occur</li>
        </ul>
        <p>Your prompt update is appreciated.</p>
        <p>Thanks,<br>Meeting Management System</p>
      </div>
    `;
  };
  
  module.exports = {
    reminderTemplate,
    checkInTemplate
  };