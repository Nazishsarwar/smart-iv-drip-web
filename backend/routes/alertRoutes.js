// backend/routes/alertRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAlerts,
  getAlert,
  acknowledgeAlert,
  resolveAlert,
} = require('../controllers/alertController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getAlerts);
router.get('/:id', getAlert);
router.put('/:id/acknowledge', acknowledgeAlert);
router.put('/:id/resolve', resolveAlert);

module.exports = router;
