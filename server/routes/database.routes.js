const express = require('express');
const router = express.Router();
const {
  getDatabases,
  getDbCollections,
  getColDocuments,
  getColSchema,
  getColStats,
  getColIndexes,
} = require('../controllers/databaseController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.use(verifyToken, requireAdmin);

router.get('/', getDatabases);
router.get('/:dbName/collections', getDbCollections);
router.get('/:dbName/:collection/documents', getColDocuments);
router.get('/:dbName/:collection/schema', getColSchema);
router.get('/:dbName/:collection/stats', getColStats);
router.get('/:dbName/:collection/indexes', getColIndexes);

module.exports = router;
