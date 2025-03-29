const express = require('express');
const { check, body } = require('express-validator');
const { 
  getAllMeetings, 
  getMeetingById, 
  createMeeting, 
  updateMeeting, 
  addMinutesOfMeeting, 
  addMissedReason, 
  sendReminderManually, 
  sendCheckInManually, 
  deleteMeeting 
} = require('../controllers/meetingController');
const auth = require('../middleware/auth');

const router = express.Router();
// All routes require authentication
router.use(auth);

// @route   GET /api/meetings
// @desc    Get all meetings
// @access  Private
router.get('/', getAllMeetings);

// @route   GET /api/meetings/:id
// @desc    Get meeting by ID
// @access  Private
router.get('/:id', getMeetingById);

// @route   POST /api/meetings
// @desc    Create meeting
// @access  Private
router.post(
  '/',
  [
    check('title', 'Title is required').not().isEmpty(),
    check('stakeholderId', 'Stakeholder ID is required').not().isEmpty(),
    check('frequency', 'Valid frequency is required').isIn(['weekly', 'biweekly', 'monthly', 'quarterly']),
    // Make assignedToIds validation conditional based on user role
    body('assignedToIds').custom((value, { req }) => {
      // Only require assignedToIds for admin users
      if (req.user.role === 'admin' && (!value || value.length === 0)) {
        throw new Error('At least one user must be assigned');
      }
      return true;
    }),
    check('nextMeetingDate', 'Next meeting date is required').isISO8601()
  ],
  createMeeting
);

// @route   PUT /api/meetings/:id
// @desc    Update meeting
// @access  Private
router.put('/:id', updateMeeting);

// @route   POST /api/meetings/:id/mom
// @desc    Add minutes of meeting
// @access  Private
router.post(
  '/:id/mom',
  [
    check('content', 'Content is required').not().isEmpty(),
    check('date', 'Valid date is required').isISO8601()
  ],
  addMinutesOfMeeting
);

// @route   POST /api/meetings/:id/missed
// @desc    Add missed meeting reason
// @access  Private
router.post(
  '/:id/missed',
  [
    check('reason', 'Reason is required').not().isEmpty(),
    check('date', 'Valid date is required').isISO8601()
  ],
  addMissedReason
);

// @route   POST /api/meetings/:id/send-reminder
// @desc    Send reminder manually
// @access  Private
router.post('/:id/send-reminder', sendReminderManually);

// @route   POST /api/meetings/:id/send-checkin
// @desc    Send check-in manually
// @access  Private
router.post('/:id/send-checkin', sendCheckInManually);

// @route   DELETE /api/meetings/:id
// @desc    Delete meeting
// @access  Private
router.delete('/:id', deleteMeeting);

module.exports = router;