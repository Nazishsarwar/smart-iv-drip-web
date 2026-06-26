// backend/controllers/reportController.js
const Reading = require('../models/Reading');
const Alert = require('../models/Alert');
const Session = require('../models/Session');
const Device = require('../models/Device');
const Nurse = require('../models/Nurse');
const Patient = require('../models/Patient');

// @desc    Overview report
// @route   GET /api/reports/overview
// @access  Private
const getOverview = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const filter = Object.keys(dateFilter).length
      ? { createdAt: dateFilter }
      : {};

    const [
      totalPatients,
      totalSessions,
      totalAlerts,
      resolvedAlerts,
      criticalAlerts,
      totalDevices,
      onlineDevices,
    ] = await Promise.all([
      Patient.countDocuments(),
      Session.countDocuments(filter),
      Alert.countDocuments(filter),
      Alert.countDocuments({ ...filter, status: 'resolved' }),
      Alert.countDocuments({ ...filter, severity: 'critical' }),
      Device.countDocuments(),
      Device.countDocuments({ status: 'online' }),
    ]);

    res.status(200).json({
      success: true,
      overview: {
        totalPatients,
        totalSessions,
        totalAlerts,
        resolvedAlerts,
        criticalAlerts,
        totalDevices,
        onlineDevices,
        alertResolutionRate: totalAlerts
          ? Math.round((resolvedAlerts / totalAlerts) * 100)
          : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Device performance report
// @route   GET /api/reports/devices
// @access  Private
const getDeviceReport = async (req, res) => {
  try {
    const devices = await Device.find();
    const deviceStats = await Promise.all(
      devices.map(async (device) => {
        const totalReadings = await Reading.countDocuments({
          device: device._id,
        });
        const totalAlerts = await Alert.countDocuments({
          device: device._id,
        });
        return {
          deviceId: device.deviceId,
          label: device.label,
          ward: device.ward,
          status: device.status,
          batteryPct: device.batteryPct,
          lastSeenAt: device.lastSeenAt,
          totalReadings,
          totalAlerts,
        };
      })
    );

    res.status(200).json({
      success: true,
      devices: deviceStats,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Nurse performance report
// @route   GET /api/reports/nurses
// @access  Private
const getNurseReport = async (req, res) => {
  try {
    const nurses = await Nurse.find({ isActive: true }).populate(
      'assignedPatients',
      'name status'
    );

    const nurseStats = await Promise.all(
      nurses.map(async (nurse) => {
        const resolvedAlerts = await Alert.countDocuments({
          resolvedBy: nurse._id,
        });
        const acknowledgedAlerts = await Alert.countDocuments({
          acknowledgedBy: nurse._id,
        });
        return {
          name: nurse.name,
          ward: nurse.ward,
          shift: nurse.shift,
          assignedPatients: nurse.assignedPatients.length,
          resolvedAlerts,
          acknowledgedAlerts,
        };
      })
    );

    res.status(200).json({
      success: true,
      nurses: nurseStats,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Patient therapy summary report
// @route   GET /api/reports/patients
// @access  Private
const getPatientReport = async (req, res) => {
  try {
    const sessions = await Session.find()
      .populate('patient', 'name ward bedNumber diagnosis')
      .populate('device', 'deviceId label')
      .populate('nurse', 'name')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getOverview,
  getDeviceReport,
  getNurseReport,
  getPatientReport,
};
