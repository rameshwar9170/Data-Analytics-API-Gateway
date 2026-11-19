const express = require('express');
const router = express.Router();
const {
  getActiveCandidates,
  getCandidateActivityTimeline,
  getLiveStats,
} = require('../controllers/monitorController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.use(verifyToken, requireAdmin);

router.get('/active', getActiveCandidates);
router.get('/candidates/:id/timeline', getCandidateActivityTimeline);
router.get('/stats', getLiveStats);

module.exports = router;
