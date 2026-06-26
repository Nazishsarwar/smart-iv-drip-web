// backend/controllers/patientController.js
const Patient = require('../models/Patient');
const Session = require('../models/Session');
const Device = require('../models/Device');

// @desc    Get all patients with optional filters
// @route   GET /api/patients
// @access  Private
const getPatients = async (req, res) => {
  try {
    const { ward, status, search } = req.query;
    const filter = {};

    if (ward) filter.ward = ward;
    if (status) filter.status = status;
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const patients = await Patient.find(filter)
      .populate('assignedNurse', 'name phone ward')
      .populate('activeSession')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: patients.length,
      patients,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single patient with session history
// @route   GET /api/patients/:id
// @access  Private
const getPatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('assignedNurse', 'name phone ward')
      .populate('activeSession');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    // Get session history
    const sessions = await Session.find({ patient: req.params.id })
      .populate('device', 'deviceId label')
      .populate('nurse', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      patient,
      sessions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new patient
// @route   POST /api/patients
// @access  Private
const createPatient = async (req, res) => {
  try {
    const {
      name,
      age,
      gender,
      ward,
      bedNumber,
      diagnosis,
      assignedNurse,
    } = req.body;

    const patient = await Patient.create({
      name,
      age,
      gender,
      ward,
      bedNumber,
      diagnosis,
      assignedNurse: assignedNurse || null,
    });

    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      patient,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update patient
// @route   PUT /api/patients/:id
// @access  Private
const updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Patient updated successfully',
      patient,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Start IV session for patient
// @route   POST /api/patients/:id/start-session
// @access  Private
const startSession = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    if (patient.activeSession) {
      return res.status(400).json({
        success: false,
        message: 'Patient already has an active IV session',
      });
    }

    const {
      deviceId,
      nurseId,
      prescribedRateDpm,
      prescribedVolumeMl,
      fluidType,
      notes,
    } = req.body;

    // Check device exists and is not already assigned
    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found',
      });
    }

    if (device.assignedPatient) {
      return res.status(400).json({
        success: false,
        message: 'Device is already assigned to another patient',
      });
    }

    // Create session
    const session = await Session.create({
      patient: patient._id,
      device: deviceId,
      nurse: nurseId || null,
      startedBy: req.user._id,
      prescribedRateDpm,
      prescribedVolumeMl,
      fluidType,
      notes,
      status: 'active',
    });

    // Update patient activeSession
    await Patient.findByIdAndUpdate(patient._id, {
      activeSession: session._id,
    });

    // Update device assignment
    await Device.findByIdAndUpdate(deviceId, {
      assignedPatient: patient._id,
      assignedSession: session._id,
      status: 'online',
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('session:started', { session, patient });
    }

    res.status(201).json({
      success: true,
      message: 'IV session started successfully',
      session,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    End IV session for patient
// @route   POST /api/patients/:id/end-session
// @access  Private
const endSession = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient || !patient.activeSession) {
      return res.status(400).json({
        success: false,
        message: 'No active session found for this patient',
      });
    }

    const { endReason, notes } = req.body;

    // Update session
    const session = await Session.findByIdAndUpdate(
      patient.activeSession,
      {
        status: 'completed',
        endedAt: new Date(),
        endReason: endReason || 'Completed normally',
        notes,
      },
      { new: true }
    );

    // Get device to unassign
    const device = await Device.findOne({ assignedSession: session._id });
    if (device) {
      await Device.findByIdAndUpdate(device._id, {
        assignedPatient: null,
        assignedSession: null,
        status: 'idle',
      });
    }

    // Clear patient active session
    await Patient.findByIdAndUpdate(patient._id, {
      activeSession: null,
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('session:ended', { session, patientId: patient._id });
    }

    res.status(200).json({
      success: true,
      message: 'IV session ended successfully',
      session,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  startSession,
  endSession,
};
