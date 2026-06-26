// backend/controllers/readingController.js
const Reading = require('../models/Reading');
const Device = require('../models/Device');
const Session = require('../models/Session');
const Alert = require('../models/Alert');
const Nurse = require('../models/Nurse');

const THRESHOLDS = {
  LOW_FLUID_ML: 50,
  BATTERY_LOW_PCT: 20,
  DRIP_STOPPED_DPM: 0,
};

const receiveReading = async (req, res) => {
  try {
    console.log('🔵 receiveReading hit — body:', req.body);

    const { deviceId, dropsPerMin, volumeMl, batteryPct } = req.body;

    if (!deviceId) {
      return res.status(400).json({ success: false, message: 'deviceId is required' });
    }

    const device = await Device.findOne({ deviceId });
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not registered in system' });
    }

    await Device.findByIdAndUpdate(device._id, {
      status: 'online',
      batteryPct: batteryPct || device.batteryPct,
      lastSeenAt: new Date(),
    });

    const reading = await Reading.create({
      device: device._id,
      session: device.assignedSession || null,
      patient: device.assignedPatient || null,
      dropsPerMin: dropsPerMin || 0,
      volumeMl: volumeMl || 0,
      batteryPct: batteryPct || 0,
      recordedAt: new Date(),
    });

    console.log(`[Reading] Device: ${deviceId} | Volume: ${volumeMl}ml | Drops: ${dropsPerMin}dpm`);

    const io = req.app.get('io');

    if (io) {
      io.emit('reading:update', {
        deviceId,
        patientId: device.assignedPatient,
        sessionId: device.assignedSession,
        dropsPerMin,
        volumeMl,
        batteryPct,
        recordedAt: reading.recordedAt,
      });
      console.log(`[Socket.IO] Emitting reading:update`);
    } else {
      console.warn('[Socket.IO] io not found on app');
    }

    if (volumeMl !== undefined && volumeMl <= THRESHOLDS.LOW_FLUID_ML && volumeMl > 0) {
      await createAlertIfNotExists({
        type: 'low_fluid',
        severity: 'warning',
        device: device._id,
        patient: device.assignedPatient,
        session: device.assignedSession,
        message: `Low fluid warning — only ${volumeMl}ml remaining for device ${deviceId}`,
        io,
      });
    }

    if (dropsPerMin !== undefined && dropsPerMin === THRESHOLDS.DRIP_STOPPED_DPM) {
      await createAlertIfNotExists({
        type: 'drip_stopped',
        severity: 'critical',
        device: device._id,
        patient: device.assignedPatient,
        session: device.assignedSession,
        message: `Drip stopped — no drops detected for device ${deviceId}`,
        io,
      });
    }

    if (batteryPct !== undefined && batteryPct <= THRESHOLDS.BATTERY_LOW_PCT) {
      await createAlertIfNotExists({
        type: 'battery_low',
        severity: 'warning',
        device: device._id,
        patient: device.assignedPatient,
        session: device.assignedSession,
        message: `Battery low — ${batteryPct}% remaining for device ${deviceId}`,
        io,
      });
    }

    res.status(200).json({ success: true, message: 'Reading received', reading });

  } catch (error) {
    console.error('🔴 Reading error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

const createAlertIfNotExists = async ({ type, severity, device, patient, session, message, io }) => {
  try {
    const existing = await Alert.findOne({
      type,
      device,
      status: { $in: ['unacknowledged', 'acknowledged'] },
    });

    if (existing) return;

    const alert = await Alert.create({
      type,
      severity,
      device,
      patient,
      session,
      message,
      status: 'unacknowledged',
    });

    if (io) {
      io.emit('alert:new', { alert });
      console.log(`[Socket.IO] Emitting alert:new`);
    }

    console.log(`🚨 Alert created: ${type} — ${message}`);
  } catch (err) {
    console.error('Alert creation error:', err.message);
  }
};

const getReadings = async (req, res) => {
  try {
    const { deviceId, sessionId, limit = 50 } = req.query;
    const filter = {};
    if (deviceId) filter.device = deviceId;
    if (sessionId) filter.session = sessionId;

    const readings = await Reading.find(filter)
      .sort({ recordedAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({ success: true, count: readings.length, readings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { receiveReading, getReadings };
