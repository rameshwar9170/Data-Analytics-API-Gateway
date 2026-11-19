const express = require('express');
const router = express.Router();
const { queryData, exportData } = require('../controllers/analyticsController');
const { verifyToken } = require('../middleware/auth');

// Allow query and export (protected by JWT token)
router.use(verifyToken);

router.post('/query', queryData);
router.post('/export', exportData);
router.get('/export', exportData);

module.exports = router;
