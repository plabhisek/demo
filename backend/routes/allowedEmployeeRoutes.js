const express = require('express');
const { check } = require('express-validator');
const { getAllowedEmployees, addAllowedEmployee, removeAllowedEmployee } = require('../controllers/allowedEmployeeController');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/roles');

const router = express.Router();

// All routes require authentication and admin privileges
router.use(auth);
router.use(isAdmin);

// @route   GET /api/allowed-employees
// @desc    Get all allowed employees
// @access  Admin
router.get('/', getAllowedEmployees);

// @route   POST /api/allowed-employees
// @desc    Add an employee to allowed list
// @access  Admin
router.post(
  '/',
  [
    check('employeeID', 'Employee ID is required').not().isEmpty()
  ],
  addAllowedEmployee
);

// @route   DELETE /api/allowed-employees/:employeeID
// @desc    Remove an employee from allowed list
// @access  Admin
router.delete('/:employeeID', removeAllowedEmployee);

module.exports = router;