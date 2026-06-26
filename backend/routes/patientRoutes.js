// backend/routes/patientRoutes.js
const express = require('express');
const router = express.Router();
const {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  startSession,
  endSession,
} = require('../controllers/patientController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

router.get('/', getPatients);
router.post('/', createPatient);
router.get('/:id', getPatient);
router.put('/:id', updatePatient);
router.post('/:id/start-session', startSession);
router.post('/:id/end-session', endSession);

module.exports = router;
