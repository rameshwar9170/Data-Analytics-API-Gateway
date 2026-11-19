const express = require('express');
const router = express.Router();
const {
  runCandidateQuery,
  getQueryHistory,
  saveQuery,
  getSavedQueries,
} = require('../controllers/queryController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.post('/execute', runCandidateQuery);
router.get('/history', getQueryHistory);
router.post('/save', saveQuery);
router.get('/saved', getSavedQueries);

module.exports = router;
