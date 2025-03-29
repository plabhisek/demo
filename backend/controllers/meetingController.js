const { validationResult } = require('express-validator');
const Meeting = require('../models/Meeting');
const User = require('../models/User');
const Stakeholder = require('../models/Stakeholder');
const { sendEmail } = require('../config/email');
const { sendWhatsAppMessage } = require('../utils/whatsappNotification');
const { 
  reminderTemplate, 
  checkInTemplate, 
  meetingCreatedTemplate 
} = require('../utils/emailTemplates');
const { 
  generateWhatsAppMessage, 
  generateReminderWhatsAppMessage, 
  generateCheckInWhatsAppMessage 
} = require('../utils/whatsappMessageTemplate');
const { calculateNextMeetingDate } = require('../utils/dateUtils');

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

// Get all meetings
const getAllMeetings = async (req, res) => {
  try {
    // Admins can see all meetings, users can only see meetings assigned to them
    const filter = req.user.role === 'admin' 
      ? { active: true } 
      : { assignedTo: req.userId, active: true };
    
    const meetings = await Meeting.find(filter)
      .populate('stakeholder', 'name email company')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ nextMeetingDate: 1 });
    
    res.json(meetings);
  } catch (error) {
    console.error('Get all meetings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get meeting by ID
const getMeetingById = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('stakeholder', 'name email company')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');
    
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    
    // Check if user is admin or assigned to the meeting
    const isAssignedUser = meeting.assignedTo.some(
      user => user._id.toString() === req.userId.toString()
    );
    
    if (req.user.role !== 'admin' && !isAssignedUser) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(meeting);
  } catch (error) {
    console.error('Get meeting by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create meeting
const createMeeting = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      title, 
      stakeholderId, 
      frequency, 
      assignedToIds, // Changed to support multiple user IDs
      nextMeetingDate, 
      notes 
    } = req.body;
    
    // For non-admin users, automatically assign the meeting to themselves
    const finalAssignedToIds = req.user.role === 'admin' 
      ? assignedToIds || [req.userId]
      : [req.userId];
    
    // Validate stakeholder
    const stakeholder = await Stakeholder.findById(stakeholderId);
    if (!stakeholder || !stakeholder.active) {
      return res.status(400).json({ message: 'Invalid stakeholder' });
    }
    
    // Validate assigned users
    const assignedUsers = await User.find({
      _id: { $in: finalAssignedToIds },
      active: true
    });
    
    if (assignedUsers.length !== finalAssignedToIds.length) {
      return res.status(400).json({ message: 'Invalid user assignment' });
    }
    
    // Create new meeting
    const meeting = new Meeting({
      title,
      stakeholder: stakeholderId,
      frequency,
      assignedTo: finalAssignedToIds,
      nextMeetingDate: new Date(nextMeetingDate),
      notes,
      createdBy: req.userId,
      status: 'scheduled'
    });
    
    await meeting.save();
    
    // Populate meeting data
    const populatedMeeting = await Meeting.findById(meeting._id)
      .populate('stakeholder', 'name email company')
      .populate('assignedTo', 'name email mobile')
      .populate('createdBy', 'name email');
    
    // Send notifications to all assigned users
    const notificationPromises = populatedMeeting.assignedTo.map(user => {
      const whatsappMessage = generateWhatsAppMessage(populatedMeeting);
      return sendNotifications(
        user, 
        populatedMeeting, 
        meetingCreatedTemplate, 
        `New Meeting: ${populatedMeeting.title} with ${populatedMeeting.stakeholder.name}`,
        whatsappMessage
      );
    });
    
    const notificationResults = await Promise.all(notificationPromises);
    
    res.status(201).json({
      meeting: populatedMeeting,
      notifications: notificationResults
    });
  } catch (error) {
    console.error('Create meeting error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update meeting
const updateMeeting = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      title, 
      stakeholderId, 
      frequency, 
      assignedToIds, 
      nextMeetingDate, 
      notes, 
      active 
    } = req.body;
    
    // Find meeting
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    
    // Check if user is admin or assigned to the meeting
    const isAssignedUser = meeting.assignedTo.some(
      id => id.toString() === req.userId.toString()
    );
    
    if (req.user.role !== 'admin' && !isAssignedUser) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Update fields if provided
    if (title) meeting.title = title;
    
    if (stakeholderId) {
      const stakeholder = await Stakeholder.findById(stakeholderId);
      if (!stakeholder || !stakeholder.active) {
        return res.status(400).json({ message: 'Invalid stakeholder' });
      }
      meeting.stakeholder = stakeholderId;
    }
    
    if (frequency) meeting.frequency = frequency;
    
    if (assignedToIds) {
      // Validate assigned users
      const assignedUsers = await User.find({
        _id: { $in: assignedToIds },
        active: true
      });
      
      if (assignedUsers.length !== assignedToIds.length) {
        return res.status(400).json({ message: 'Invalid user assignment' });
      }
      
      meeting.assignedTo = assignedToIds;
    }
    
    if (nextMeetingDate) meeting.nextMeetingDate = new Date(nextMeetingDate);
    
    if (notes !== undefined) meeting.notes = notes;
    
    // Only admins can change active status
    if (req.user.role === 'admin' && active !== undefined) {
      meeting.active = active;
    }
    
    await meeting.save();
    
    // Populate meeting data for response
    const populatedMeeting = await Meeting.findById(meeting._id)
      .populate('stakeholder', 'name email company')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');
    
    res.json(populatedMeeting);
  } catch (error) {
    console.error('Update meeting error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add minutes of meeting
const addMinutesOfMeeting = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, date, attendees, actionItems } = req.body;
    
    // Find meeting
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    
    // Check if user is assigned to the meeting
    const isAssignedUser = meeting.assignedTo.some(
      id => id.toString() === req.userId.toString()
    );
    
    if (req.user.role !== 'admin' && !isAssignedUser) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Create MoM entry
    const mom = {
      date: new Date(date),
      content,
      attendees: attendees || [],
      actionItems: actionItems || []
    };
    
    // Add MoM to meeting
    meeting.minutesOfMeeting.push(mom);
    
    // Update meeting status
    meeting.status = 'completed';
    
    // Calculate next meeting date based on frequency
    meeting.nextMeetingDate = calculateNextMeetingDate(date, meeting.frequency);
    
    // Reset flags for next meeting cycle
    meeting.reminderSent = false;
    meeting.checkInSent = false;
    
    await meeting.save();
    
    // Populate the updated meeting for response
    const populatedMeeting = await Meeting.findById(meeting._id)
      .populate('stakeholder', 'name email company')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');
    
    res.json(populatedMeeting);
  } catch (error) {
    console.error('Add MoM error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add missed meeting reason
const addMissedReason = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reason, date } = req.body;
    
    // Find meeting
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    
    // Check if user is assigned to the meeting
    if (req.user.role !== 'admin' && meeting.assignedTo.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Create missed reason entry
    const missedEntry = {
      date: new Date(date),
      reason
    };
    
    // Add missed reason to meeting
    meeting.missedReasons.push(missedEntry);
    
    // Update meeting status
    meeting.status = 'missed';
    
    // Calculate next meeting date based on frequency
    meeting.nextMeetingDate = calculateNextMeetingDate(date, meeting.frequency);
    
    // Reset flags for next meeting cycle
    meeting.reminderSent = false;
    meeting.checkInSent = false;
    
    await meeting.save();
    
    res.json(meeting);
  } catch (error) {
    console.error('Add missed reason error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Send reminder manually
const sendReminderManually = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('stakeholder', 'name email')
      .populate('assignedTo', 'name email mobile');
    
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    
    // Check user permissions
    if (req.user.role !== 'admin' && meeting.assignedTo._id.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Prepare WhatsApp message
    //const whatsappMessage = `Reminder: Meeting with ${meeting.stakeholder.name} on ${new Date(meeting.nextMeetingDate).toLocaleDateString()}`;
    const whatsappMessage = generateReminderWhatsAppMessage(meeting);
    // Send notifications
    const notificationResult = await sendNotifications(
      meeting.assignedTo, 
      meeting, 
      reminderTemplate, 
      `Reminder: Meeting with ${meeting.stakeholder.name}`,
      whatsappMessage
    );
    
    // Update meeting
    meeting.reminderSent = true;
    await meeting.save();
    
    res.json({ 
      message: 'Reminder sent successfully', 
      meeting,
      notifications: notificationResult
    });
  } catch (error) {
    console.error('Send reminder error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Send check-in manually
const sendCheckInManually = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('stakeholder', 'name email')
      .populate('assignedTo', 'name email mobile');
    
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    
    // Check user permissions
    if (req.user.role !== 'admin' && meeting.assignedTo._id.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Prepare WhatsApp message
    //const whatsappMessage = `Check-in: Did you meet with ${meeting.stakeholder.name}? Please update in the system.`;
    const whatsappMessage = generateCheckInWhatsAppMessage(meeting);
    // Send notifications
    const notificationResult = await sendNotifications(
      meeting.assignedTo, 
      meeting, 
      checkInTemplate, 
      `Check-in: Did you meet with ${meeting.stakeholder.name}?`,
      whatsappMessage
    );
    
    // Update meeting
    meeting.checkInSent = true;
    await meeting.save();
    
    res.json({ 
      message: 'Check-in sent successfully', 
      meeting,
      notifications: notificationResult
    });
  } catch (error) {
    console.error('Send check-in error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete meeting (deactivate)
const deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    
    // Check if user is admin or created the meeting
    if (req.user.role !== 'admin' && meeting.createdBy.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Instead of deleting, set meeting as inactive
    meeting.active = false;
    await meeting.save();
    
    res.json({ message: 'Meeting deactivated successfully' });
  } catch (error) {
    console.error('Delete meeting error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllMeetings,
  getMeetingById,
  createMeeting,
  updateMeeting,
  addMinutesOfMeeting,
  addMissedReason,
  sendReminderManually,
  sendCheckInManually,
  deleteMeeting
};