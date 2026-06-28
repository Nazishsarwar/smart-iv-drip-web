const Patient = require('../models/Patient');
const Device  = require('../models/Device');
const Session = require('../models/Session');
const Reading = require('../models/Reading');
const Nurse   = require('../models/Nurse');

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

    if (hasActiveSession === 'true') {
      filter.activeSession = { $ne: null };
    }

    let patients = await Patient.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    patients = await Promise.all(
      patients.map(async (p) => {
        let latestReading = null;
        let activeDevice  = null;
        let sessionData   = null;

        if (p.activeSession) {
          sessionData = await Session.findById(p.activeSession)
            .populate('device', 'deviceId location')
            .populate('nurse',  'name')
            .lean();

          if (sessionData?.device?.deviceId) {
            activeDevice  = sessionData.device.deviceId;
            latestReading = await Reading.findOne({ deviceId: activeDevice })
              .sort({ createdAt: -1 })
              .lean();
          }
        }

        let liveStatus = p.status || 'active';
        if (sessionData && latestReading) {
          if      (latestReading.volumeMl < 10)  liveStatus = 'critical';
          else if (latestReading.volumeMl < 50)  liveStatus = 'warning';
          else                                    liveStatus = 'normal';
        }

        return {
          ...p,
          status:        liveStatus,
          activeSession: sessionData || null,
          activeDevice,
          latestReading,
          chartData: [],
        };
      })
    );

    res.status(200).json({ success: true, count: patients.length, patients });
  } catch (error) {
    console.error('getPatients error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).lean();
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    let activeSession = null;
    let latestReading = null;
    let chartData     = [];
    let activeDevice  = null;

    if (patient.activeSession) {
      activeSession = await Session.findById(patient.activeSession)
        .populate('device', 'deviceId location')
        .populate('nurse',  'name phone')
        .lean();

      if (activeSession?.device?.deviceId) {
        activeDevice = activeSession.device.deviceId;

        latestReading = await Reading.findOne({ deviceId: activeDevice })
          .sort({ createdAt: -1 })
          .lean();

        const readings = await Reading.find({ deviceId: activeDevice })
          .sort({ createdAt: -1 })
          .limit(30)
          .lean();

        chartData = readings.reverse().map((r) => ({
          time:        new Date(r.createdAt).toLocaleTimeString([], {
            hour: '2-digit', minute: '2-digit',
          }),
          dropsPerMin: r.dropsPerMin,
        }));
      }
    }

    const sessions = await Session.find({ patient: patient._id })
      .sort({ createdAt: -1 })
      .populate('device', 'deviceId')
      .populate('nurse',  'name')
      .lean();

    let status = patient.status || 'active';
    if (activeSession && latestReading) {
      if      (latestReading.volumeMl < 10)  status = 'critical';
      else if (latestReading.volumeMl < 50)  status = 'warning';
      else                                    status = 'normal';
    }

    res.status(200).json({
      success: true,
      ...patient,
      status,
      activeSession,
      activeDevice,
      latestReading,
      chartData,
      sessions,
    });
  } catch (error) {
    console.error('getPatient error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

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

const updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    );
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    res.status(200).json({ success: true, patient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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

    if (patient.activeSession) {
      return res.status(400).json({
        success: false,
        message: 'Patient already has an active IV session.',
      });
    }

    let deviceDoc = null;
    if (deviceId) {
      deviceDoc = await Device.findById(deviceId);
      if (!deviceDoc) {
        return res.status(404).json({
          success: false,
          message: 'Device not found. Use the real MongoDB _id from GET /api/devices.',
        });
      }
    }

    const session = await Session.create({
      patient:        patient._id,
      device:         deviceDoc?._id || null,
      nurse:          nurseId        || null,
      prescribedRate: Number(prescribedRate),
      totalVolume:    Number(totalVolume),
      fluidType:      fluidType || 'Normal Saline',
      status:         'active',
      startTime:      new Date(),
    });

    if (deviceDoc) {
      await Device.findByIdAndUpdate(deviceDoc._id, {
        status:          'online',
        assignedPatient: patient._id,
        assignedSession: session._id,
        lastSeen:        new Date(),
      });
    }

    await Patient.findByIdAndUpdate(patient._id, {
      activeSession: session._id,
      status:        'normal',
      ...(nurseId ? { assignedNurse: nurseId } : {}),
    });

    if (nurseId) {
      await Nurse.findByIdAndUpdate(nurseId, {
        $addToSet: { assignedPatients: patient._id },
      });
    }

    const io = req.app.get('io');
    if (io) io.emit('session:started', { sessionId: session._id, patientId: patient._id });

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

    session.status    = 'completed';
    session.endTime   = new Date();
    session.endReason = reason || 'completed';
    session.endNote   = note   || '';
    await session.save();

    if (session.device) {
      await Device.findByIdAndUpdate(session.device, {
        status:          'idle',
        assignedPatient: null,
        assignedSession: null,
      });
    }

    await Patient.findByIdAndUpdate(id, {
      activeSession: null,
      status:        'inactive',
    });

    const io = req.app.get('io');
    if (io) io.emit('session:ended', { sessionId, patientId: id });

    res.status(200).json({
      success: true,
      message: 'Session ended successfully',
      session,
    });
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
