const express = require('express');
const router  = express.Router();
const { getDashboardStats, getReports } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// GET /api/reports/dashboard-stats  ← used by DashboardPage
router.get('/dashboard-stats', getDashboardStats);

// GET /api/reports                  ← used by ReportsPage (all 4 tabs)
router.get('/', getReports);

module.exports = router;
