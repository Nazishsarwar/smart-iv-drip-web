// backend/routes/deviceRoutes.js
const express = require('express');
const router = express.Router();
const {
  getDevices,
  getDevice,
  registerDevice,
  updateDevice,
  unassignDevice,
  forceReconnect,
} = require('../controllers/deviceController');
const { protect } = require('../middleware/authMiddleware');

// All routes protected
router.use(protect);

router.get('/', getDevices);
router.post('/', registerDevice);
router.get('/:id', getDevice);
router.put('/:id', updateDevice);
router.post('/:id/unassign', unassignDevice);
router.post('/:id/reconnect', forceReconnect);

module.exports = router;
