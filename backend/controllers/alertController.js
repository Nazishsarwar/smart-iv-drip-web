// backend/controllers/alertController.js
const Alert = require('../models/Alert');

// @desc    Get all alerts with filters
// @route   GET /api/alerts
// @access  Private
const getAlerts = async (req, res) => {
  try {
    const { status, type, severity, ward, startDate, endDate } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (severity) filter.severity = severity;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const alerts = await Alert.find(filter)
      .populate('patient', 'name ward bedNumber')
      .populate('device', 'deviceId label')
      .populate('acknowledgedBy', 'name')
      .populate('resolvedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: alerts.length,
      alerts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single alert
// @route   GET /api/alerts/:id
// @access  Private
const getAlert = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate('patient', 'name ward bedNumber')
      .populate('device', 'deviceId label')
      .populate('acknowledgedBy', 'name')
      .populate('resolvedBy', 'name');

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    res.status(200).json({ success: true, alert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Acknowledge alert
// @route   PUT /api/alerts/:id/acknowledge
// @access  Private
const acknowledgeAlert = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        status: 'acknowledged',
        acknowledgedBy: req.user._id,
        acknowledgedAt: new Date(),
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('alert:acknowledged', { alert });
    }

    res.status(200).json({
      success: true,
      message: 'Alert acknowledged',
      alert,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Resolve alert with note
// @route   PUT /api/alerts/:id/resolve
// @access  Private
const resolveAlert = async (req, res) => {
  try {
    const { resolutionNote } = req.body;

    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        status: 'resolved',
        resolvedBy: req.user._id,
        resolvedAt: new Date(),
        resolutionNote: resolutionNote || 'Resolved by admin',
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('alert:resolved', { alert });
    }

    res.status(200).json({
      success: true,
      message: 'Alert resolved successfully',
      alert,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAlerts,
  getAlert,
  acknowledgeAlert,
  resolveAlert,
};
