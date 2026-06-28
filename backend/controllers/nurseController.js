const Nurse   = require('../models/Nurse');
const Patient = require('../models/Patient');
const Alert   = require('../models/Alert');
const bcrypt  = require('bcryptjs');

// @desc    Get all nurses
// @route   GET /api/nurses
// @access  Private
const getNurses = async (req, res) => {
  try {
    const { search, ward, shift } = req.query;
    const filter = {};

    if (ward)  filter.ward  = ward;
    if (shift) filter.shift = shift;
    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { ward:  { $regex: search, $options: 'i' } },
      ];
    }

    const nurses = await Nurse.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    // Attach assigned patients to each nurse
    // Check BOTH: Patient.assignedNurse field AND Nurse.assignedPatients array
    const nursesWithData = await Promise.all(
      nurses.map(async (n) => {
        const assignedPatients = await Patient.find({
          $or: [
            { assignedNurse: n._id },
            { _id: { $in: n.assignedPatients || [] } },
          ],
        })
          .select('name ward bedNumber status')
          .lean();

        return { ...n, assignedPatients };
      })
    );

    res.status(200).json({
      success: true,
      count:   nursesWithData.length,
      nurses:  nursesWithData,
    });
  } catch (error) {
    console.error('getNurses error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single nurse with full details
// @route   GET /api/nurses/:id
// @access  Private
const getNurse = async (req, res) => {
  try {
    const nurse = await Nurse.findById(req.params.id)
      .select('-password')
      .lean();

    if (!nurse) {
      return res.status(404).json({ success: false, message: 'Nurse not found' });
    }

    // Get assigned patients — check BOTH fields
    const assignedPatients = await Patient.find({
      $or: [
        { assignedNurse: nurse._id },
        { _id: { $in: nurse.assignedPatients || [] } },
      ],
    })
      .select('name ward bedNumber status diagnosis activeSession')
      .lean();

    // Get alert history resolved by this nurse
    const alertHistory = await Alert.find({
      resolvedBy: nurse._id,
      status:     'resolved',
    })
      .sort({ resolvedAt: -1 })
      .limit(20)
      .lean();

    // Get alerts acknowledged by this nurse
    const acknowledgedAlerts = await Alert.find({
      acknowledgedBy: nurse._id,
    })
      .sort({ acknowledgedAt: -1 })
      .limit(10)
      .lean();

    // Return nurse data with all populated fields
    res.status(200).json({
      success: true,
      nurse: {
        ...nurse,
        assignedPatients,
        alertHistory,
        acknowledgedAlerts,
        totalResolved:     alertHistory.length,
        totalAcknowledged: acknowledgedAlerts.length,
      },
    });
  } catch (error) {
    console.error('getNurse error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create nurse
// @route   POST /api/nurses
// @access  Private
const createNurse = async (req, res) => {
  try {
    const { name, phone, ward, shift, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone, and password are required.',
      });
    }

    const existing = await Nurse.findOne({ phone });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A nurse with phone "${phone}" already exists.`,
      });
    }

    const salt           = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const nurse = await Nurse.create({
      name,
      phone,
      ward:     ward  || '',
      shift:    shift || 'Morning',
      password: hashedPassword,
    });

    const nurseObj = nurse.toObject();
    delete nurseObj.password;

    res.status(201).json({ success: true, nurse: nurseObj });
  } catch (error) {
    console.error('createNurse error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update nurse
// @route   PUT /api/nurses/:id
// @access  Private
const updateNurse = async (req, res) => {
  try {
    delete req.body.password;

    const nurse = await Nurse.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    if (!nurse) {
      return res.status(404).json({ success: false, message: 'Nurse not found' });
    }

    res.status(200).json({ success: true, nurse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Deactivate nurse
// @route   PATCH /api/nurses/:id/deactivate
// @access  Private
const deactivateNurse = async (req, res) => {
  try {
    const nurse = await Nurse.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!nurse) {
      return res.status(404).json({ success: false, message: 'Nurse not found' });
    }

    res.status(200).json({ success: true, message: 'Nurse deactivated', nurse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Assign patients to nurse
// @route   POST /api/nurses/:id/assign-patients
// @access  Private
const assignPatients = async (req, res) => {
  try {
    const { patientIds } = req.body;

    if (!Array.isArray(patientIds)) {
      return res.status(400).json({
        success: false,
        message: 'patientIds must be an array.',
      });
    }

    const nurse = await Nurse.findById(req.params.id);
    if (!nurse) {
      return res.status(404).json({ success: false, message: 'Nurse not found' });
    }

    // Update Patient documents — set assignedNurse field
    await Patient.updateMany(
      { _id: { $in: patientIds } },
      { assignedNurse: nurse._id }
    );

    // Also update Nurse.assignedPatients array
    await Nurse.findByIdAndUpdate(nurse._id, {
      $addToSet: { assignedPatients: { $each: patientIds } },
    });

    res.status(200).json({
      success: true,
      message: `${patientIds.length} patient(s) assigned to ${nurse.name}`,
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
