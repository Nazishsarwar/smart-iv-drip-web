const express = require('express');
const router  = express.Router();
const {
  getDevices,
  getDevice,
  registerDevice,
  updateDevice,
  unassignDevice,
  deleteDevice,
} = require('../controllers/deviceController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/',              getDevices);
router.post('/',             registerDevice);
router.get('/:id',           getDevice);
router.put('/:id',           updateDevice);
router.post('/:id/unassign', unassignDevice);
router.delete('/:id',        deleteDevice);

module.exports = router;
