// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { login, getMe, registerFcmToken } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);
router.post('/fcm-token', protect, registerFcmToken);

module.exports = router;
