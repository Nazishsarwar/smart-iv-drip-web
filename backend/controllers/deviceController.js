// backend/controllers/deviceController.js
const Device = require('../models/Device');
const Reading = require('../models/Reading');

// @desc    Get all devices with live status
// @route   GET /api/devices
// @access  Private
const getDevices = async (req, res) => {
  try {
    const { status, ward } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (ward) filter.ward = ward;

    const devices = await Device.find(filter)
      .populate('assignedPatient', 'name ward bedNumber')
      .populate('assignedSession')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: devices.length,
      devices,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single device with history
// @route   GET /api/devices/:id
// @access  Private
const getDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id)
      .populate('assignedPatient', 'name ward bedNumber')
      .populate('assignedSession');

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found',
      });
    }

    // Get last 20 readings for this device
    const readings = await Reading.find({ device: req.params.id })
      .sort({ recordedAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      device,
      readings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register a new device
// @route   POST /api/devices
// @access  Private
const registerDevice = async (req, res) => {
  try {
    const { deviceId, macAddress, label, ward, firmwareVersion } = req.body;

    // Check if device already exists
    const existing = await Device.findOne({ deviceId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Device with this ID already exists',
      });
    }

    const device = await Device.create({
      deviceId,
      macAddress,
      label,
      ward,
      firmwareVersion,
      status: 'idle',
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('device:registered', { device });
    }

    res.status(201).json({
      success: true,
      message: 'Device registered successfully',
      device,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update device details
// @route   PUT /api/devices/:id
// @access  Private
const updateDevice = async (req, res) => {
  try {
    const device = await Device.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Device updated successfully',
      device,
    });
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
      return res.status(404).json({
        success: false,
        message: 'Device not found',
      });
    }

    await Device.findByIdAndUpdate(req.params.id, {
      assignedPatient: null,
      assignedSession: null,
      status: 'idle',
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('device:unassigned', { deviceId: req.params.id });
    }

    res.status(200).json({
      success: true,
      message: 'Device unassigned successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Force reconnect device (placeholder)
// @route   POST /api/devices/:id/reconnect
// @access  Private
const forceReconnect = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found',
      });
    }

    // Emit reconnect command via socket
    const io = req.app.get('io');
    if (io) {
      io.emit('device:reconnect', { deviceId: device.deviceId });
    }

    res.status(200).json({
      success: true,
      message: 'Reconnect signal sent to device',
    });
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
  forceReconnect,
};
