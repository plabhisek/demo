const express = require('express');
const { check } = require('express-validator');
const { getAllUsers, getUserById, updateUser, changePassword, deleteUser } = require('../controllers/userController');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/roles');

const router = express.Router();

// All routes require authentication
router.use(auth);

// @route   GET /api/users
// @desc    Get all users
// @access  Admin
router.get('/', isAdmin, getAllUsers);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Admin or Self
router.get('/:id', getUserById);

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Admin or Self
router.put(
  '/:id',
  [
    check('name', 'Name is required').optional(),
    check('email', 'Please include a valid email').optional().isEmail()
  ],
  updateUser
);

// @route   PUT /api/users/password
// @desc    Change password
// @access  Private
router.put(
  '/password',
  [
    check('currentPassword', 'Current password is required').not().isEmpty(),
    check('newPassword', 'New password must be at least 6 characters').isLength({ min: 6 })
  ],
  changePassword
);

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Admin
router.delete('/:id', isAdmin, deleteUser);

module.exports = router;