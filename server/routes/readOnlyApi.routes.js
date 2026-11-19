const express = require('express');
const router = express.Router();
const {
  listPublicDatabases,
  listPublicCollections,
  readCollectionData,
} = require('../controllers/readOnlyApiController');

// Pure Read-Only GET Endpoints (No tokens or login required)
router.get('/databases', listPublicDatabases);
router.get('/:database/collections', listPublicCollections);
router.get('/:database/:collection', readCollectionData);

module.exports = router;
