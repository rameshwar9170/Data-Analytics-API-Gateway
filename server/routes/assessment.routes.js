const express = require('express');
const router = express.Router();
const {
  assignToCandidate,
  getAssessments,
  getCandidateAssessment,
  startAssessment,
  submitResponse,
  submitAssessment,
  evaluateAssessmentEndpoint,
  getResults,
} = require('../controllers/assessmentController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Candidate assessment workflows
router.get('/my', verifyToken, getCandidateAssessment);
router.post('/:id/start', verifyToken, startAssessment);
router.post('/:id/responses', verifyToken, submitResponse);
router.post('/:id/submit', verifyToken, submitAssessment);
router.get('/:id/results', verifyToken, getResults);

// Admin assessment management
router.get('/', verifyToken, requireAdmin, getAssessments);
router.post('/assign', verifyToken, requireAdmin, assignToCandidate);
router.post('/:id/evaluate', verifyToken, requireAdmin, evaluateAssessmentEndpoint);

module.exports = router;
