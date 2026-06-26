// backend/routes/readingRoutes.js
const express = require('express');
const router = express.Router();
const { receiveReading, getReadings } = require('../controllers/readingController');
const { protect } = require('../middleware/authMiddleware');

// Public route — called by ESP32 hardware
router.post('/', receiveReading);

// Protected route — for frontend to fetch readings
router.get('/', protect, getReadings);

module.exports = router;
