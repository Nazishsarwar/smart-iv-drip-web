const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, async (req, res) => {
  try {
    const Ward = require('../models/Ward');
    const wards = await Ward.find();
    res.json({ success: true, data: wards });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;