const Patient = require('../models/Patient');
const Device  = require('../models/Device');
const Session = require('../models/Session');
const Reading = require('../models/Reading');

// @desc    Get all patients with filters
// @route   GET /api/patients
// @access  Private
const getPatients = async (req, res) => {
  try {
    const { search, status, ward, hasActiveSession } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (ward)   filter.ward   = ward;
    if (search) {
      filter.$or = [
        { name:      { $regex: search, $options: 'i' } },
        { diagnosis: { $regex: search, $options: 'i' } },
        { ward:      { $regex: search, $options: 'i' } },
      ];
    }

    let patients = await Patient.find(filter).sort({ createdAt: -1 }).lean();

    // Attach active session info
    patients = await Promise.all(
      patients.map(async (p) => {
        const activeSession = await Session.findOne({
          patient: p._id,
          status: 'active',
        })
          .populate('device', 'deviceId')
          .populate('nurse',  'name')
          .lean();

        const latestReading = await Reading.findOne({ deviceId: activeSession?.device?.deviceId })
          .sort({ createdAt: -1 })
          .lean();

        return {
          ...p,
          activeSession,
          activeDevice: activeSession?.device?.deviceId || null,
          latestReading: latestReading || null,
        };
      })
    );

    // Filter by hasActiveSession if requested
    if (hasActiveSession === 'true') {
      patients = patients.filter((p) => p.activeSession !== null);
    }

    res.status(200).json({ success: true, count: patients.length, patients });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single patient with full details
// @route   GET /api/patients/:id
// @access  Private
const getPatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).lean();
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // Active session
    const activeSession = await Session.findOne({
      patient: patient._id,
      status: 'active',
    })
      .populate('device', 'deviceId location')
      .populate('nurse',  'name phone')
      .lean();

    // Latest reading
    let latestReading = null;
    let chartData     = [];
    if (activeSession?.device?.deviceId) {
      latestReading = await Reading.findOne({ deviceId: activeSession.device.deviceId })
        .sort({ createdAt: -1 })
        .lean();

      const readings = await Reading.find({ deviceId: activeSession.device.deviceId })
        .sort({ createdAt: -1 })
        .limit(30)
        .lean();

      chartData = readings.reverse().map((r) => ({
        time:        new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dropsPerMin: r.dropsPerMin,
      }));
    }

    // Session history
    const sessions = await Session.find({ patient: patient._id })
      .sort({ createdAt: -1 })
      .populate('device', 'deviceId')
      .populate('nurse',  'name')
      .lean();

    // Determine status
    let status = 'inactive';
    if (activeSession && latestReading) {
      if (latestReading.volumeMl < 10)  status = 'critical';
      else if (latestReading.volumeMl < 50) status = 'warning';
      else status = 'normal';
    } else if (activeSession) {
      status = 'normal';
    }

    res.status(200).json({
      success: true,
      ...patient,
      status,
      activeSession,
      latestReading,
      chartData,
      sessions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create patient
// @route   POST /api/patients
// @access  Private
const createPatient = async (req, res) => {
  try {
    const { name, age, gender, ward, bedNumber, diagnosis, phone } = req.body;

    if (!name || !ward || !bedNumber) {
      return res.status(400).json({
        success: false,
        message: 'Name, ward, and bed number are required.',
      });
    }

    const patient = await Patient.create({
      name, age, gender, ward, bedNumber, diagnosis, phone,
    });

    res.status(201).json({ success: true, patient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update patient
// @route   PUT /api/patients/:id
// @access  Private
const updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    res.status(200).json({ success: true, patient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete patient
// @route   DELETE /api/patients/:id
// @access  Private
const deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    res.status(200).json({ success: true, message: 'Patient deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Start IV session for a patient
// @route   POST /api/patients/:id/sessions/start
// @access  Private
const startSession = async (req, res) => {
  try {
    const { deviceId, nurseId, prescribedRate, totalVolume, fluidType } = req.body;

    if (!prescribedRate || !totalVolume) {
      return res.status(400).json({
        success: false,
        message: 'prescribedRate and totalVolume are required.',
      });
    }

    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // Check no active session already exists
    const existing = await Session.findOne({ patient: patient._id, status: 'active' });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Patient already has an active IV session.',
      });
    }

    // Mark device as online/assigned if deviceId provided
    let deviceDoc = null;
    if (deviceId) {
      deviceDoc = await Device.findByIdAndUpdate(
        deviceId,
        { status: 'online', assignedPatient: patient._id },
        { new: true }
      );
    }

    const session = await Session.create({
      patient:        patient._id,
      device:         deviceDoc?._id || null,
      nurse:          nurseId || null,
      prescribedRate: Number(prescribedRate),
      totalVolume:    Number(totalVolume),
      fluidType:      fluidType || 'Normal Saline',
      status:         'active',
      startTime:      new Date(),
    });

    // Update patient status
    await Patient.findByIdAndUpdate(patient._id, { status: 'normal' });

    // Emit socket event
    const io = req.app.get('io');
    if (io) io.emit('session:started', { session, patientId: patient._id });

    const populated = await Session.findById(session._id)
      .populate('device', 'deviceId location')
      .populate('nurse',  'name')
      .lean();

    res.status(201).json({ success: true, session: populated });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    End IV session for a patient
// @route   POST /api/patients/:id/sessions/:sessionId/end
// @access  Private
const endSession = async (req, res) => {
  try {
    const { reason, note } = req.body;
    const { id, sessionId } = req.params;

    const session = await Session.findOne({
      _id:     sessionId,
      patient: id,
      status:  'active',
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Active session not found for this patient.',
      });
    }

    // Update session
    session.status    = 'completed';
    session.endTime   = new Date();
    session.endReason = reason || 'completed';
    session.endNote   = note   || '';
    await session.save();

    // Free up the device
    if (session.device) {
      await Device.findByIdAndUpdate(session.device, {
        status:          'idle',
        assignedPatient: null,
      });
    }

    // Update patient status
    await Patient.findByIdAndUpdate(id, { status: 'inactive' });

    // Emit socket event
    const io = req.app.get('io');
    if (io) io.emit('session:ended', { sessionId, patientId: id });

    res.status(200).json({ success: true, message: 'Session ended successfully', session });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
  startSession,
  endSession,
};
