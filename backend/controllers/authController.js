const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const ldapService = require('../services/ldapService');

// Register a new user
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, employeeID } = req.body;

    // Check if user already exists
    let user = await User.findOne({ $or: [{ email }, { employeeID }] });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user (status will be inactive by default)
    user = new User({
      name,
      email,
      password,
      employeeID,
      role: 'user'
    });

    await user.save();

    res.status(201).json({
      message: 'Registration successful. Account is pending approval.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        employeeID: user.employeeID,
        active: user.active
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login user via LDAP
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { employeeID, password } = req.body;

    // Authenticate with LDAP
    let ldapData;
    try {
      ldapData = await ldapService.authenticate(employeeID, password);
    } catch (error) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if employee is allowed
    if (!ldapData.isAllowed) {
      return res.status(403).json({ message: 'Your account is not approved for access' });
    }

    // Find or create user in our database
    let user = await User.findOne({ employeeID });
    
    if (!user) {
      // Create new user with LDAP data
      user = new User({
        name: ldapData.mail.split('@')[0].replace(/\./g, ' '),
        email: ldapData.mail,
        password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8), // Random password
        employeeID: ldapData.employeeID,
        department: ldapData.department,
        role: 'user',
        active: true // Set to true since they're in the allowed list
      });
      
      await user.save();
    } else {
      // Update existing user with latest LDAP data
      user.email = ldapData.mail;
      user.department = ldapData.department;
      user.active = true; // Set to true since they're in the allowed list
      
      await user.save();
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        employeeID: user.employeeID,
        department: user.department,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify token
const verifyToken = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.active) {
      return res.status(403).json({ message: 'Account is inactive' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  verifyToken
};