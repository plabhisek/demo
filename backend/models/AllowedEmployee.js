const mongoose = require('mongoose');

const AllowedEmployeeSchema = new mongoose.Schema({
  employeeID: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AllowedEmployee', AllowedEmployeeSchema);