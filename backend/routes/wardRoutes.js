const express = require('express');
const router  = express.Router();
const {
  getWards,
  getWard,
  createWard,
  updateWard,
  deleteWard,
} = require('../controllers/wardController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/',    getWards);
router.post('/',   createWard);
router.get('/:id', getWard);
router.put('/:id', updateWard);
router.delete('/:id', deleteWard);

module.exports = router;
