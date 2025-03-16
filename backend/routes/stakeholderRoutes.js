const express = require('express');
const { check } = require('express-validator');
const { getAllStakeholders, getStakeholderById, createStakeholder, updateStakeholder, deleteStakeholder } = require('../controllers/stakeholderController');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/roles');

const router = express.Router();

// All routes require authentication
router.use(auth);

// @route   GET /api/stakeholders
// @desc    Get all stakeholders
// @access  Private
router.get('/', getAllStakeholders);

// @route   GET /api/stakeholders/:id
// @desc    Get stakeholder by ID
// @access  Private
router.get('/:id', getStakeholderById);

// @route   POST /api/stakeholders
// @desc    Create stakeholder
// @access  Private
router.post(
  '/',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail()
  ],
  createStakeholder
);

// @route   PUT /api/stakeholders/:id
// @desc    Update stakeholder
// @access  Private
router.put(
  '/:id',
  [
    check('name', 'Name is required').optional(),
    check('email', 'Please include a valid email').optional().isEmail()
  ],
  updateStakeholder
);

// @route   DELETE /api/stakeholders/:id
// @desc    Delete stakeholder
// @access  Admin
router.delete('/:id', isAdmin, deleteStakeholder);

module.exports = router;