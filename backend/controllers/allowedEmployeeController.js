const { validationResult } = require('express-validator');
const AllowedEmployee = require('../models/AllowedEmployee');
const User = require('../models/User');

// Get all allowed employees
const getAllowedEmployees = async (req, res) => {
  try {
    const allowedEmployees = await AllowedEmployee.find();
    res.json(allowedEmployees);
  } catch (error) {
    console.error('Get allowed employees error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add an employee to allowed list
const addAllowedEmployee = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { employeeID } = req.body;

    // Check if employee is already in the list
    let allowedEmployee = await AllowedEmployee.findOne({ employeeID });
    if (allowedEmployee) {
      return res.status(400).json({ message: 'Employee is already in the allowed list' });
    }

    // Add to allowed list
    allowedEmployee = new AllowedEmployee({
      employeeID
    });

    await allowedEmployee.save();

    // Update user status if this employee already has an account
    const user = await User.findOne({ employeeID });
    if (user) {
      user.active = true;
      await user.save();
    }

    res.status(201).json(allowedEmployee);
  } catch (error) {
    console.error('Add allowed employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove an employee from allowed list
const removeAllowedEmployee = async (req, res) => {
  try {
    const { employeeID } = req.params;

    // Remove from allowed list
    const result = await AllowedEmployee.findOneAndDelete({ employeeID });
    
    if (!result) {
      return res.status(404).json({ message: 'Employee not found in allowed list' });
    }

    // Update user status if this employee has an account
    const user = await User.findOne({ employeeID });
    if (user) {
      user.active = false;
      await user.save();
    }

    res.json({ message: 'Employee removed from allowed list' });
  } catch (error) {
    console.error('Remove allowed employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllowedEmployees,
  addAllowedEmployee,
  removeAllowedEmployee
};