const Patient  = require('../models/Patient');
const Device   = require('../models/Device');
const Session  = require('../models/Session');
const Alert    = require('../models/Alert');
const Reading  = require('../models/Reading');
const Nurse    = require('../models/Nurse');

// ─── Helper: build date filter ───
const dateFilter = (from, to) => {
  const filter = {};
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to)   filter.createdAt.$lte = new Date(to);
  }
  return filter;
};

// @desc    Dashboard quick stats
// @route   GET /api/reports/dashboard-stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const [totalPatients, activeDevices, unresolvedAlerts, activeSessions] = await Promise.all([
      Patient.countDocuments(),
      Device.countDocuments({ status: { $in: ['online', 'idle'] } }),
      Alert.countDocuments({ status: 'active' }),
      Session.countDocuments({ status: 'active' }),
    ]);

    res.status(200).json({
      success: true,
      totalPatients,
      activeDevices,
      unresolvedAlerts,
      activeSessions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Full reports data (all 4 tabs)
// @route   GET /api/reports
// @access  Private
const getReports = async (req, res) => {
  try {
    const { from, to } = req.query;
    const dFilter = dateFilter(from, to);

    // ── Overview ──────────────────────────────────────────────
    const [
      totalSessions,
      totalAlerts,
      resolvedAlerts,
      allAlerts,
      allSessions,
    ] = await Promise.all([
      Session.countDocuments(dFilter),
      Alert.countDocuments(dFilter),
      Alert.countDocuments({ ...dFilter, status: 'resolved' }),
      Alert.find(dFilter).select('type createdAt resolvedAt acknowledgedAt').lean(),
      Session.find(dFilter).select('createdAt').lean(),
    ]);

    // Daily alerts for bar chart (last 7 days)
    const dailyAlertsMap = {};
    allAlerts.forEach((a) => {
      const day = new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyAlertsMap[day] = (dailyAlertsMap[day] || 0) + 1;
    });
    const dailyAlerts = Object.entries(dailyAlertsMap)
      .map(([date, count]) => ({ date, count }))
      .slice(-7);

    // Alert types for pie chart
    const alertTypesMap = {};
    allAlerts.forEach((a) => {
      const t = a.type || 'unknown';
      alertTypesMap[t] = (alertTypesMap[t] || 0) + 1;
    });
    const alertTypes = Object.entries(alertTypesMap)
      .map(([type, count]) => ({ type: type.replace(/_/g, ' '), count }));

    // Daily sessions for line chart
    const dailySessionsMap = {};
    allSessions.forEach((s) => {
      const day = new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailySessionsMap[day] = (dailySessionsMap[day] || 0) + 1;
    });
    const dailySessions = Object.entries(dailySessionsMap)
      .map(([date, count]) => ({ date, count }))
      .slice(-7);

    // Avg response time (minutes between createdAt and acknowledgedAt)
    const responded = allAlerts.filter((a) => a.acknowledgedAt);
    const avgResponseTime = responded.length
      ? Math.round(
          responded.reduce((sum, a) => {
            return sum + (new Date(a.acknowledgedAt) - new Date(a.createdAt)) / 60000;
          }, 0) / responded.length
        )
      : 0;

    const resolutionRate = totalAlerts
      ? Math.round((resolvedAlerts / totalAlerts) * 100)
      : 0;

    // ── Device Performance ────────────────────────────────────
    const devices = await Device.find().select('deviceId status').lean();

    const deviceReadingsCounts = await Reading.aggregate([
      ...(from || to ? [{ $match: dFilter }] : []),
      { $group: { _id: '$deviceId', count: { $sum: 1 } } },
    ]);

    const deviceReadings = deviceReadingsCounts.map((d) => ({
      deviceId: d._id,
      count: d.count,
    }));

    const deviceUptime = devices.map((d) => ({
      deviceId: d.deviceId,
      uptime: d.status === 'online' ? 98 : d.status === 'idle' ? 75 : 10,
    }));

    // ── Nurse Performance ─────────────────────────────────────
    const nurses = await Nurse.find().select('name').lean();

    const nurseAlertData = await Alert.aggregate([
      { $match: { ...dFilter, status: 'resolved', resolvedBy: { $ne: null } } },
      { $group: { _id: '$resolvedBy', resolved: { $sum: 1 } } },
    ]);

    const nurseAlerts = await Promise.all(
      nurseAlertData.map(async (n) => {
        const nurse = await Nurse.findById(n._id).select('name').lean();
        return { name: nurse?.name || 'Unknown', resolved: n.resolved };
      })
    );

    // Avg response time per nurse
    const nurseResponseData = await Alert.aggregate([
      {
        $match: {
          ...dFilter,
          acknowledgedAt: { $ne: null },
          acknowledgedBy: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$acknowledgedBy',
          avgTime: {
            $avg: {
              $divide: [
                { $subtract: ['$acknowledgedAt', '$createdAt'] },
                60000,
              ],
            },
          },
        },
      },
    ]);

    const nurseResponseTimes = await Promise.all(
      nurseResponseData.map(async (n) => {
        const nurse = await Nurse.findById(n._id).select('name').lean();
        return { name: nurse?.name || 'Unknown', avgTime: Math.round(n.avgTime) };
      })
    );

    // ── Patient Therapy ───────────────────────────────────────
    const sessionsByPatient = await Session.aggregate([
      ...(from || to ? [{ $match: dFilter }] : []),
      { $group: { _id: '$patient', sessions: { $sum: 1 } } },
      { $sort: { sessions: -1 } },
      { $limit: 10 },
    ]);

    const patientSessions = await Promise.all(
      sessionsByPatient.map(async (s) => {
        const patient = await Patient.findById(s._id).select('name').lean();
        return { name: patient?.name || 'Unknown', sessions: s.sessions };
      })
    );

    const fluidTypesData = await Session.aggregate([
      ...(from || to ? [{ $match: dFilter }] : []),
      { $group: { _id: '$fluidType', count: { $sum: 1 } } },
    ]);

    const fluidTypes = fluidTypesData.map((f) => ({
      type:  f._id || 'Unspecified',
      count: f.count,
    }));

    // ── Final Response ────────────────────────────────────────
    res.status(200).json({
      success: true,

      // Overview
      totalSessions,
      totalAlerts,
      avgResponseTime,
      resolutionRate,
      dailyAlerts,
      alertTypes,
      dailySessions,

      // Device Performance
      deviceUptime,
      deviceReadings,

      // Nurse Performance
      nurseAlerts,
      nurseResponseTimes,

      // Patient Therapy
      patientSessions,
      fluidTypes,
    });
  } catch (error) {
    console.error('Reports error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getReports,
};
