const Alert = require('../models/Alert');

// @desc    Get all alerts with filters
// @route   GET /api/alerts
// @access  Private
const getAlerts = async (req, res) => {
  try {
    const { status, type, severity, ward, startDate, endDate, limit } = req.query;
    const filter = {};

    if (status)   filter.status   = status;
    if (type)     filter.type     = type;
    if (severity) filter.severity = severity;
    if (ward)     filter.ward     = ward;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate)   filter.createdAt.$lte = new Date(endDate);
    }

    const alerts = await Alert.find(filter)
      .populate('patient',        'name ward bedNumber')
      .populate('device',         'deviceId label')
      .populate('acknowledgedBy', 'name')
      .populate('resolvedBy',     'name')
      .sort({ createdAt: -1 })
      .limit(Number(limit) || 100);

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
      .populate('patient',        'name ward bedNumber')
      .populate('device',         'deviceId label')
      .populate('acknowledgedBy', 'name')
      .populate('resolvedBy',     'name');

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    res.status(200).json({ success: true, alert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Manually create an alert (admin / testing)
// @route   POST /api/alerts
// @access  Private
const createAlert = async (req, res) => {
  try {
    const {
      type, severity, patientName,
      ward, deviceId, message,
      patient, device,
    } = req.body;

    if (!type || !severity) {
      return res.status(400).json({
        success: false,
        message: 'type and severity are required.',
      });
    }

    const alertData = {
      type,
      severity,
      status:      'active',
      message:     message     || `Manual alert: ${type}`,
      ward:        ward        || 'Unspecified',
      patientName: patientName || 'Manual Test',
      deviceId:    deviceId    || 'TEST',
    };

    if (patient) alertData.patient = patient;
    if (device)  alertData.device  = device;

    const alert = await Alert.create(alertData);

    const io = req.app.get('io');
    if (io) io.emit('alert:new', alert);

    res.status(201).json({ success: true, alert });
  } catch (error) {
    console.error('Create alert error:', error);
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
        status:         'acknowledged',
        acknowledgedBy: req.user._id,
        acknowledgedAt: new Date(),
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    const io = req.app.get('io');
    if (io) io.emit('alert:acknowledged', { alert });

    res.status(200).json({ success: true, message: 'Alert acknowledged', alert });
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
        status:         'resolved',
        resolvedBy:     req.user._id,
        resolvedAt:     new Date(),
        resolutionNote: resolutionNote || 'Resolved by admin',
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    const io = req.app.get('io');
    if (io) io.emit('alert:resolved', { alert });

    res.status(200).json({ success: true, message: 'Alert resolved successfully', alert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Resolve all active/acknowledged alerts
// @route   POST /api/alerts/resolve-all
// @access  Private
const resolveAllAlerts = async (req, res) => {
  try {
    await Alert.updateMany(
      { status: { $ne: 'resolved' } },
      {
        status:         'resolved',
        resolvedBy:     req.user._id,
        resolvedAt:     new Date(),
        resolutionNote: 'Bulk resolved by admin',
      }
    );

    const io = req.app.get('io');
    if (io) io.emit('alert:resolved', { bulk: true });

    res.status(200).json({ success: true, message: 'All alerts resolved' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAlerts,
  getAlert,
  createAlert,
  acknowledgeAlert,
  resolveAlert,
  resolveAllAlerts,
};
