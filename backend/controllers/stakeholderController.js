const { validationResult } = require('express-validator');
const Stakeholder = require('../models/Stakeholder');
const Meeting = require('../models/Meeting');

// Get all stakeholders
const getAllStakeholders = async (req, res) => {
  try {
    const stakeholders = await Stakeholder.find({ active: true })
      .populate('createdBy', 'name email');
    
    res.json(stakeholders);
  } catch (error) {
    console.error('Get all stakeholders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get stakeholder by ID
const getStakeholderById = async (req, res) => {
  try {
    const stakeholder = await Stakeholder.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!stakeholder) {
      return res.status(404).json({ message: 'Stakeholder not found' });
    }
    
    res.json(stakeholder);
  } catch (error) {
    console.error('Get stakeholder by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create stakeholder
const createStakeholder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, company, position, phone } = req.body;
    
    // Check if stakeholder already exists
    const existingStakeholder = await Stakeholder.findOne({ name });
    if (existingStakeholder) {
      return res.status(400).json({ message: 'Stakeholder already exists' });
    }
    
    // Create new stakeholder
    const stakeholder = new Stakeholder({
      name,
      email,
      company,
      position,
      phone,
      createdBy: req.userId
    });
    
    await stakeholder.save();
    
    res.status(201).json(stakeholder);
  } catch (error) {
    console.error('Create stakeholder error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update stakeholder
const updateStakeholder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, company, position, phone, active } = req.body;
    
    // Find stakeholder
    const stakeholder = await Stakeholder.findById(req.params.id);
    
    if (!stakeholder) {
      return res.status(404).json({ message: 'Stakeholder not found' });
    }
    
    // Update fields
    stakeholder.name = name || stakeholder.name;
    stakeholder.email = email || stakeholder.email;
    stakeholder.company = company || stakeholder.company;
    stakeholder.position = position || stakeholder.position;
    stakeholder.phone = phone || stakeholder.phone;
    
    // Only admins can deactivate stakeholders
    if (req.user.role === 'admin' && active !== undefined) {
      stakeholder.active = active;
    }
    
    await stakeholder.save();
    
    res.json(stakeholder);
  } catch (error) {
    console.error('Update stakeholder error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
// Bulk create stakeholders
const bulkCreateStakeholders = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const stakeholdersData = req.body;
    const createdBy = req.userId;

    // Validate and prepare stakeholders
    const validStakeholders = [];
    const failedStakeholders = [];

    for (const stakeholderData of stakeholdersData) {
      // Basic validation
      if (!stakeholderData.name || !stakeholderData.email) {
        failedStakeholders.push({
          data: stakeholderData,
          reason: 'Missing required fields (name or email)'
        });
        continue;
      }

      // Check if stakeholder already exists
      const existingStakeholder = await Stakeholder.findOne({ email: stakeholderData.email });
      if (existingStakeholder) {
        failedStakeholders.push({
          data: stakeholderData,
          reason: 'Stakeholder with this email already exists'
        });
        continue;
      }

      // Prepare stakeholder object
      const stakeholder = new Stakeholder({
        name: stakeholderData.name,
        email: stakeholderData.email,
        company: stakeholderData.company || '',
        position: stakeholderData.position || '',
        phone: stakeholderData.phone || '',
        createdBy: createdBy
      });

      validStakeholders.push(stakeholder);
    }

    // Bulk insert valid stakeholders
    const insertedStakeholders = await Stakeholder.insertMany(validStakeholders);

    res.status(201).json({
      message: 'Bulk stakeholder creation completed',
      successful: insertedStakeholders.length,
      failed: failedStakeholders.length,
      failedStakeholders: failedStakeholders
    });
  } catch (error) {
    console.error('Bulk create stakeholders error:', error);
    res.status(500).json({ message: 'Server error during bulk creation' });
  }
};

// Delete stakeholder (deactivate)
const deleteStakeholder = async (req, res) => {
  try {
    const stakeholder = await Stakeholder.findById(req.params.id);
    
    if (!stakeholder) {
      return res.status(404).json({ message: 'Stakeholder not found' });
    }
    
    // Instead of deleting, set stakeholder as inactive
    stakeholder.active = false;
    await stakeholder.save();
    
    // Also deactivate all associated meetings
    await Meeting.updateMany(
      { stakeholder: stakeholder._id },
      { active: false }
    );
    
    res.json({ message: 'Stakeholder deactivated successfully' });
  } catch (error) {
    console.error('Delete stakeholder error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllStakeholders,
  getStakeholderById,
  createStakeholder,
  updateStakeholder,
  deleteStakeholder,
  bulkCreateStakeholders
};