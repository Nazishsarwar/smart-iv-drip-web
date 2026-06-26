// backend/routes/nurseRoutes.js
const express = require('express');
const router = express.Router();
const {
  getNurses,
  getNurse,
  createNurse,
  updateNurse,
  deactivateNurse,
  assignPatients,
} = require('../controllers/nurseController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getNurses);
router.post('/', createNurse);
router.get('/:id', getNurse);
router.put('/:id', updateNurse);
router.put('/:id/deactivate', deactivateNurse);
router.put('/:id/assign-patients', assignPatients);

module.exports = router;
