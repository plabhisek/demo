const mongoose = require('mongoose');

const MeetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  stakeholder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stakeholder',
    required: true
  },
  frequency: {
    type: String,
    enum: ['weekly', 'biweekly', 'monthly', 'quarterly'],
    required: true
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'missed'],
    default: 'scheduled'
  },
  nextMeetingDate: {
    type: Date,
    required: true
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  complianceStats: {
    totalScheduled: {
      type: Number,
      default: 1  // Starts at 1 since creating a meeting schedules one
    },
    totalAttended: {
      type: Number,
      default: 0
    },
    totalMissed: {
      type: Number,
      default: 0
    }
  },
  checkInSent: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String
  },
  active: {
    type: Boolean,
    default: true
  },
  minutesOfMeeting: [{
    date: {
      type: Date,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    attendees: [String],
    actionItems: [{
      task: String,
      assignedTo: String,
      dueDate: Date,
      status: {
        type: String,
        enum: ['pending', 'completed'],
        default: 'pending'
      }
    }]
  }],
  missedReasons: [{
    date: {
      type: Date,
      required: true
    },
    reason: {
      type: String,
      required: true
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Meeting', MeetingSchema);
MeetingSchema.virtual('compliancePercentage').get(function() {
  const total = this.complianceStats.totalAttended + this.complianceStats.totalMissed;
  return total > 0 ? Math.round((this.complianceStats.totalAttended / total) * 100) : 100;
});