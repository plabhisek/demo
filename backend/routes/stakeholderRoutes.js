const express = require('express');
const { check } = require('express-validator');
const { getAllStakeholders, getStakeholderById, createStakeholder, updateStakeholder, deleteStakeholder,bulkCreateStakeholders } = require('../controllers/stakeholderController');
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
    check('name', 'Name is required').not().isEmpty()
  ],
  createStakeholder
);

// @route   PUT /api/stakeholders/:id
// @desc    Update stakeholder
// @access  Private
router.put(
  '/:id',
  [
    check('name', 'Name is required').optional()
  ],
  updateStakeholder
);
// @route   POST /api/stakeholders/bulk
// @desc    Bulk create stakeholders
// @access  Private
router.post(
  '/bulk',
  [
    check('*.name', 'Name is required for each stakeholder').not().isEmpty()
  ],
  bulkCreateStakeholders
);
// @route   DELETE /api/stakeholders/:id
// @desc    Delete stakeholder
// @access  Admin
router.delete('/:id', isAdmin, deleteStakeholder);

module.exports = router;