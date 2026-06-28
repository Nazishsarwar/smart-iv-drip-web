const Device  = require('../models/Device');
const Patient = require('../models/Patient');
const Session = require('../models/Session');
const Reading = require('../models/Reading');

// @desc    Get all devices
// @route   GET /api/devices
// @access  Private
const getDevices = async (req, res) => {
  try {
    const { search, status } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { deviceId:   { $regex: search, $options: 'i' } },
        { macAddress: { $regex: search, $options: 'i' } },
        { location:   { $regex: search, $options: 'i' } },
      ];
    }

    const devices = await Device.find(filter)
      .populate('assignedPatient', 'name ward bedNumber status')
      .sort({ createdAt: -1 })
      .lean();

    // Attach latest reading to each device
    const devicesWithReadings = await Promise.all(
      devices.map(async (d) => {
        const latestReading = await Reading.findOne({ deviceId: d.deviceId })
          .sort({ createdAt: -1 })
          .lean();

        return {
          ...d,
          batteryPct: latestReading?.batteryPct ?? d.batteryPct,
          lastSeen:   latestReading?.createdAt  ?? d.lastSeen,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: devicesWithReadings.length,
      devices: devicesWithReadings,
    });
  } catch (error) {
    console.error('getDevices error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single device with full details
// @route   GET /api/devices/:id
// @access  Private
const getDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id)
      .populate('assignedPatient', 'name ward bedNumber status activeSession')
      .lean();

    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    // Get recent readings using string deviceId
    const recentReadings = await Reading.find({ deviceId: device.deviceId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // Get active session for this device
    const activeSession = await Session.findOne({
      device: device._id,
      status: 'active',
    })
      .populate('patient', 'name ward bedNumber')
      .populate('nurse',   'name')
      .lean();

    // Use latest reading for live battery + lastSeen
    const latestReading = recentReadings[0] || null;

    res.status(200).json({
      success: true,
      ...device,
      batteryPct:      latestReading?.batteryPct ?? device.batteryPct,
      lastSeen:        latestReading?.createdAt  ?? device.lastSeen,
      status:          latestReading ? 'online' : device.status,
      recentReadings,
      activeSession,
      // assignedPatient comes from populate above
    });
  } catch (error) {
    console.error('getDevice error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register a new device
// @route   POST /api/devices
// @access  Private
const registerDevice = async (req, res) => {
  try {
    const { deviceId, macAddress, location } = req.body;

    if (!deviceId) {
      return res.status(400).json({ success: false, message: 'deviceId is required.' });
    }

    const existing = await Device.findOne({ deviceId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Device "${deviceId}" already registered.`,
      });
    }

    const device = await Device.create({ deviceId, macAddress, location });
    res.status(201).json({ success: true, device });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update device
// @route   PUT /api/devices/:id
// @access  Private
const updateDevice = async (req, res) => {
  try {
    const device = await Device.findByIdAndUpdate(
      req.params.id, req.body, { new: true }
    );
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }
    res.status(200).json({ success: true, device });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Unassign device from patient
// @route   POST /api/devices/:id/unassign
// @access  Private
const unassignDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    await Device.findByIdAndUpdate(device._id, {
      status:          'idle',
      assignedPatient: null,
      assignedSession: null,
    });

    res.status(200).json({ success: true, message: 'Device unassigned successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete device
// @route   DELETE /api/devices/:id
// @access  Private
const deleteDevice = async (req, res) => {
  try {
    const device = await Device.findByIdAndDelete(req.params.id);
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }
    res.status(200).json({ success: true, message: 'Device deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDevices,
  getDevice,
  registerDevice,
  updateDevice,
  unassignDevice,
  deleteDevice,
};
