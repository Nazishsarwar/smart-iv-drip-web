const express = require('express');
const router  = express.Router();
const { createReading, getReadings } = require('../controllers/readingController');
const { protect } = require('../middleware/authMiddleware');

// POST — no auth (called by ESP32 hardware)
router.post('/', createReading);

// GET — protected (called by frontend)
router.get('/', protect, getReadings);

module.exports = router;
