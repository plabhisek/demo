const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  employeeID: {
    type: String,
    required: true,
    unique:true,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  mobile: {
    type: String,
    unique: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  active: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Remove password field and related methods since we're using LDAP for authentication

module.exports = mongoose.model('User', UserSchema);
