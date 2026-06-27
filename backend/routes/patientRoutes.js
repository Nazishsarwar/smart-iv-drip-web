const express = require('express');
const router  = express.Router();
const {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
  startSession,
  endSession,
} = require('../controllers/patientController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Patient CRUD
router.get('/',    getPatients);
router.post('/',   createPatient);
router.get('/:id', getPatient);
router.put('/:id', updatePatient);
router.delete('/:id', deletePatient);

// Session management
router.post('/:id/sessions/start',              startSession);
router.post('/:id/sessions/:sessionId/end',     endSession);

module.exports = router;
