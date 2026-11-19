const express = require('express');
const router = express.Router();
const {
  getCandidates,
  getCandidateDetails,
  createCandidate,
  getCandidateActivity,
  getCandidateQueryHistory,
} = require('../controllers/candidateController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.use(verifyToken, requireAdmin);

router.get('/', getCandidates);
router.post('/', createCandidate);
router.get('/:id', getCandidateDetails);
router.get('/:id/activity', getCandidateActivity);
router.get('/:id/queries', getCandidateQueryHistory);

module.exports = router;
