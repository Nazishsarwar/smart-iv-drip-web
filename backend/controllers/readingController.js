const Reading = require('../models/Reading');
const Device  = require('../models/Device');
const Session = require('../models/Session');
const Patient = require('../models/Patient');
const Alert   = require('../models/Alert');

// @desc    Receive reading from ESP32
// @route   POST /api/readings
// @access  Public (no auth — called by hardware)
const createReading = async (req, res) => {
  try {
    const { deviceId, dropsPerMin, volumeMl, batteryPct } = req.body;

    if (!deviceId) {
      return res.status(400).json({ success: false, message: 'deviceId is required.' });
    }

    // ── Find device by string deviceId ──
    const device = await Device.findOne({ deviceId });
    if (!device) {
      return res.status(404).json({
        success: false,
        message: `Device "${deviceId}" not found. Register it first.`,
      });
    }

    // ── Find active session for this device ──
    const session = await Session.findOne({
      device: device._id,
      status: 'active',
    }).populate('patient', 'name ward bedNumber');

    // ── Save the reading ──
    const reading = await Reading.create({
      device:      device._id,
      session:     session?._id    || null,
      patient:     session?.patient?._id || null,
      deviceId,
      dropsPerMin: Number(dropsPerMin) || 0,
      volumeMl:    Number(volumeMl)    || 0,
      batteryPct:  Number(batteryPct)  || 0,
      recordedAt:  new Date(),
    });

    // ── Update device last seen + battery ──
    await Device.findByIdAndUpdate(device._id, {
      lastSeen:   new Date(),
      batteryPct: Number(batteryPct) || device.batteryPct,
      status:     'online',
    });

    // ── Get io for emitting events ──
    const io = req.app.get('io');

    // ── Emit reading update to all connected browsers ──
    if (io) {
      io.emit('reading:update', {
        deviceId,
        dropsPerMin: reading.dropsPerMin,
        volumeMl:    reading.volumeMl,
        batteryPct:  reading.batteryPct,
        patientId:   session?.patient?._id || null,
        sessionId:   session?._id          || null,
        recordedAt:  reading.recordedAt,
      });
    }

    // ── Alert threshold checks ──────────────────────────────
    if (session && session.patient) {
      const patientName = session.patient.name  || 'Unknown';
      const ward        = session.patient.ward  || 'Unknown';
      const vol         = Number(volumeMl)  || 0;
      const rate        = Number(dropsPerMin) || 0;
      const prescribed  = session.prescribedRate || 0;

      // Helper — check if same alert type already active for this session
      const alertExists = async (type) => {
        const existing = await Alert.findOne({
          type,
          session: session._id,
          status:  { $in: ['active', 'acknowledged'] },
        });
        return !!existing;
      };

      // Helper — create alert + emit socket event
      const createAndEmit = async (type, severity, message) => {
        const alert = await Alert.create({
          type,
          severity,
          status:      'active',
          message,
          patientName,
          ward,
          deviceId,
          patient: session.patient._id,
          device:  device._id,
          session: session._id,
        });

        if (io) io.emit('alert:new', alert);
        console.log(`🚨 Alert created: ${type} for ${patientName}`);
        return alert;
      };

      // 1 — Critical low fluid (< 10ml)
      if (vol < 10 && vol >= 0) {
        const exists = await alertExists('low_fluid');
        if (!exists) {
          await createAndEmit(
            'low_fluid',
            'critical',
            `Critical: Only ${vol}ml remaining for ${patientName}. Replace IV bag immediately.`
          );
          // Update patient status to critical
          await Patient.findByIdAndUpdate(session.patient._id, { status: 'critical' });
        }
      }

      // 2 — Warning low fluid (< 50ml but >= 10ml)
      else if (vol < 50 && vol >= 10) {
        const exists = await alertExists('low_fluid');
        if (!exists) {
          await createAndEmit(
            'low_fluid',
            'warning',
            `Warning: ${vol}ml remaining for ${patientName}. Prepare replacement bag.`
          );
          await Patient.findByIdAndUpdate(session.patient._id, { status: 'warning' });
        }
      }

      // 3 — High drip rate (> prescribed + 20%)
      else if (prescribed > 0 && rate > prescribed * 1.2) {
        const exists = await alertExists('high_rate');
        if (!exists) {
          await createAndEmit(
            'high_rate',
            'warning',
            `Drip rate ${rate} drops/min exceeds prescribed ${prescribed} drops/min for ${patientName}.`
          );
        }
      }

      // 4 — Low drip rate (< prescribed - 20%)
      else if (prescribed > 0 && rate < prescribed * 0.8 && rate > 0) {
        const exists = await alertExists('low_rate');
        if (!exists) {
          await createAndEmit(
            'low_rate',
            'warning',
            `Drip rate ${rate} drops/min is below prescribed ${prescribed} drops/min for ${patientName}.`
          );
        }
      }

      // 5 — Drip stopped (rate = 0 but session active)
      else if (rate === 0) {
        const exists = await alertExists('drip_stopped');
        if (!exists) {
          await createAndEmit(
            'drip_stopped',
            'critical',
            `IV drip has stopped for ${patientName}. Immediate attention required.`
          );
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Reading received',
      reading,
    });
  } catch (error) {
    console.error('Reading error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get readings for a device
// @route   GET /api/readings
// @access  Private
const getReadings = async (req, res) => {
  try {
    const { deviceId, sessionId, limit } = req.query;
    const filter = {};

    if (deviceId)  filter.deviceId = deviceId;
    if (sessionId) filter.session  = sessionId;

    const readings = await Reading.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit) || 50)
      .lean();

    res.status(200).json({ success: true, count: readings.length, readings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createReading, getReadings };
