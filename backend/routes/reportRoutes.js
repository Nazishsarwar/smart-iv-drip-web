// backend/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const {
  getOverview,
  getDeviceReport,
  getNurseReport,
  getPatientReport,
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/overview', getOverview);
router.get('/devices', getDeviceReport);
router.get('/nurses', getNurseReport);
router.get('/patients', getPatientReport);

module.exports = router;
