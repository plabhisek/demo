const express = require('express');
const { check } = require('express-validator');
const { login, getCurrentUser, verifyToken } = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

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