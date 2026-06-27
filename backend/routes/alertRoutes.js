const express = require('express');
const router = express.Router();
const {
  getAlerts,
  getAlert,
  createAlert,
  acknowledgeAlert,
  resolveAlert,
  resolveAllAlerts,
} = require('../controllers/alertController');
const { protect } = require('../middleware/authMiddleware');

// All routes protected
router.use(protect);

// GET  /api/alerts         — get all alerts with filters
router.get('/', getAlerts);

// POST /api/alerts         — manually create alert (admin/testing)
router.post('/', createAlert);

// POST /api/alerts/resolve-all — bulk resolve (used by NotificationsPage)
router.post('/resolve-all', resolveAllAlerts);

// GET  /api/alerts/:id     — get single alert
router.get('/:id', getAlert);

// PUT  /api/alerts/:id/acknowledge
router.put('/:id/acknowledge', acknowledgeAlert);

// PUT  /api/alerts/:id/resolve
router.put('/:id/resolve', resolveAlert);

// PATCH routes (frontend uses PATCH — support both)
router.patch('/:id/acknowledge', acknowledgeAlert);
router.patch('/:id/resolve',     resolveAlert);

module.exports = router;
