const express = require('express');
const router  = express.Router();
const {
  getAlerts,
  getAlert,
  createAlert,
  acknowledgeAlert,
  resolveAlert,
  resolveAllAlerts,
} = require('../controllers/alertController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/',            getAlerts);
router.post('/',           createAlert);
router.post('/resolve-all', resolveAllAlerts);
router.get('/:id',         getAlert);
router.put('/:id/acknowledge',   acknowledgeAlert);
router.put('/:id/resolve',       resolveAlert);
router.patch('/:id/acknowledge', acknowledgeAlert);
router.patch('/:id/resolve',     resolveAlert);

module.exports = router;
