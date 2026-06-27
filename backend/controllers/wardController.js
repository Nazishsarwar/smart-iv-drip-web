const Ward    = require('../models/Ward');
const Patient = require('../models/Patient');

// @desc    Get all wards with their active patients
// @route   GET /api/wards
// @access  Private
const getWards = async (req, res) => {
  try {
    const wards = await Ward.find({ isActive: true }).sort({ name: 1 });

    // Attach active patients to each ward
    const wardsWithPatients = await Promise.all(
      wards.map(async (ward) => {
        const patients = await Patient.find({ ward: ward.name })
          .select('name status bedNumber')
          .lean();

        const criticalCount = patients.filter((p) => p.status === 'critical').length;

        return {
          ...ward.toObject(),
          patients,
          criticalCount,
        };
      })
    );

    res.status(200).json(wardsWithPatients);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single ward
// @route   GET /api/wards/:id
// @access  Private
const getWard = async (req, res) => {
  try {
    const ward = await Ward.findById(req.params.id);
    if (!ward) {
      return res.status(404).json({ success: false, message: 'Ward not found' });
    }
    res.status(200).json({ success: true, ward });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a ward
// @route   POST /api/wards
// @access  Private
const createWard = async (req, res) => {
  try {
    const { name, floor, capacity } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Ward name is required.' });
    }

    const existing = await Ward.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: `Ward "${name}" already exists.` });
    }

    const ward = await Ward.create({ name: name.trim(), floor, capacity });
    res.status(201).json({ success: true, ward });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a ward
// @route   PUT /api/wards/:id
// @access  Private
const updateWard = async (req, res) => {
  try {
    const ward = await Ward.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!ward) {
      return res.status(404).json({ success: false, message: 'Ward not found' });
    }
    res.status(200).json({ success: true, ward });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete (deactivate) a ward
// @route   DELETE /api/wards/:id
// @access  Private
const deleteWard = async (req, res) => {
  try {
    const ward = await Ward.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!ward) {
      return res.status(404).json({ success: false, message: 'Ward not found' });
    }
    res.status(200).json({ success: true, message: 'Ward deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getWards,
  getWard,
  createWard,
  updateWard,
  deleteWard,
};
