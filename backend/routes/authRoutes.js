const express = require('express');
const router  = express.Router();
const {
  login,
  verifyToken,
  changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/login', login);

// Protected routes
router.get('/verify',          protect, verifyToken);
router.post('/change-password', protect, changePassword);

module.exports = router;
