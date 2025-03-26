const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AllowedEmployee = require('../models/allowedemployee');
const ldapService = require('../services/ldapService');

// Login user via LDAP
const login = async (req, res) => {
  try {
    const { employeeID, password } = req.body;

    // Authenticate via LDAP
    try {
      const ldapResult = await ldapService.authenticate(employeeID, password);
      if (!ldapResult.isAllowed) {
        return res.status(403).json({ message: 'Your account is not authorized to access this system' });
      }
      
      // Find user by employeeID
      let user = await User.findOne({ employeeID });
      
      // If user doesn't exist but LDAP auth succeeded and employee is allowed, create user
      if (!user && ldapResult.isAllowed) {
        // Create user with LDAP data
        user = new User({
          name: ldapResult.cn || employeeID,
          email: ldapResult.mail || `${employeeID}@vedanta.co.in`, // Use mail from LDAP response
          employeeID,
          department: ldapResult.department || '',
          mobile: ldapResult.mobile || '',
          active: true
        });
        
        await user.save();
      } else if (user) {
        // Update user info from LDAP if needed
        let needsUpdate = false;
        
        if (ldapResult.mail && user.email !== ldapResult.mail) {
          user.email = ldapResult.mail;
          needsUpdate = true;
        }
        
        if (ldapResult.department && user.department !== ldapResult.department) {
          user.department = ldapResult.department;
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          await user.save();
        }
        
        if (!user.active) {
          return res.status(403).json({ message: 'Your account has been deactivated' });
        }
      }
      
      // Create and return JWT token
      const payload = {
        userId: user.id
      };
      
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1hr' });
      
      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          employeeID: user.employeeID,
          department: user.department,
          mobile: user.mobile,
          role: user.role,
          active: user.active
        }
      });
    } catch (error) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
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
    // Since we've passed the auth middleware, the token is valid
    // Get user data to return with verification
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ valid: false, message: 'User not found' });
    }
    
    // Return user info with verification
    res.json({ 
      valid: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        employeeID: user.employeeID,
        department: user.department,
        mobile: user.mobile,
        role: user.role,
        active: user.active
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ valid: false, message: 'Server error' });
  }
};

module.exports = {
  login,
  getCurrentUser,
  verifyToken
};