const express = require('express');
const { check } = require('express-validator');
const { register, login, getCurrentUser, verifyToken } = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
    check('employeeID', 'Employee ID is required').not().isEmpty()
  ],
  register
);

// @route   POST /api/auth/login
// @desc    Login user via LDAP
// @access  Public
router.post(
  '/login',
  [
    check('employeeID', 'Employee ID is required').not().isEmpty(),
    check('password', 'Password is required').exists()
  ],
  login
);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, getCurrentUser);

// @route   GET /api/auth/verify
// @desc    Verify token
// @access  Private
router.get('/verify', auth, verifyToken);

module.exports = router;