// backend/controllers/nurseController.js
const Nurse = require('../models/Nurse');
const bcrypt = require('bcryptjs');

// @desc    Get all nurses
// @route   GET /api/nurses
// @access  Private
const getNurses = async (req, res) => {
  try {
    const { ward, isActive } = req.query;
    const filter = {};

    if (ward) filter.ward = ward;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const nurses = await Nurse.find(filter)
      .populate('assignedPatients', 'name ward bedNumber status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: nurses.length,
      nurses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single nurse
// @route   GET /api/nurses/:id
// @access  Private
const getNurse = async (req, res) => {
  try {
    const nurse = await Nurse.findById(req.params.id)
      .populate('assignedPatients', 'name ward bedNumber status activeSession');

    if (!nurse) {
      return res.status(404).json({
        success: false,
        message: 'Nurse not found',
      });
    }

    res.status(200).json({ success: true, nurse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create nurse account
// @route   POST /api/nurses
// @access  Private
const createNurse = async (req, res) => {
  try {
    const { name, phone, password, ward, shift } = req.body;

    // Check if nurse already exists
    const existing = await Nurse.findOne({ phone });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Nurse with this phone number already exists',
      });
    }

    // Hash password manually
    const hashedPassword = bcrypt.hashSync(password, 10);

    const nurse = await Nurse.create({
      name,
      phone,
      password: hashedPassword,
      ward,
      shift,
    });

    // Remove password from response
    const nurseResponse = nurse.toObject();
    delete nurseResponse.password;

    res.status(201).json({
      success: true,
      message: 'Nurse account created successfully',
      nurse: nurseResponse,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update nurse
// @route   PUT /api/nurses/:id
// @access  Private
const updateNurse = async (req, res) => {
  try {
    // Prevent password update through this route
    delete req.body.password;

    const nurse = await Nurse.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!nurse) {
      return res.status(404).json({
        success: false,
        message: 'Nurse not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Nurse updated successfully',
      nurse,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Deactivate nurse
// @route   PUT /api/nurses/:id/deactivate
// @access  Private
const deactivateNurse = async (req, res) => {
  try {
    const nurse = await Nurse.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!nurse) {
      return res.status(404).json({
        success: false,
        message: 'Nurse not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Nurse deactivated successfully',
      nurse,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Assign patients to nurse
// @route   PUT /api/nurses/:id/assign-patients
// @access  Private
const assignPatients = async (req, res) => {
  try {
    const { patientIds } = req.body;

    const nurse = await Nurse.findByIdAndUpdate(
      req.params.id,
      { assignedPatients: patientIds },
      { new: true }
    ).populate('assignedPatients', 'name ward bedNumber');

    if (!nurse) {
      return res.status(404).json({
        success: false,
        message: 'Nurse not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Patients assigned successfully',
      nurse,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getNurses,
  getNurse,
  createNurse,
  updateNurse,
  deactivateNurse,
  assignPatients,
};
