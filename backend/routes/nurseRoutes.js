const express = require('express');
const router  = express.Router();
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

router.get('/',                       getNurses);
router.post('/',                      createNurse);
router.get('/:id',                    getNurse);
router.put('/:id',                    updateNurse);
router.patch('/:id/deactivate',       deactivateNurse);
router.post('/:id/assign-patients',   assignPatients);

module.exports = router;
