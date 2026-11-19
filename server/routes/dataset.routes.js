const express = require('express');
const router = express.Router();
const {
  createDataset,
  getDatasets,
  getDataset,
  deleteDataset,
  regenerateDataset,
  cancelDataset,
  previewDataset,
  getDatasetSchemaInfo,
  getQualityReport,
} = require('../controllers/datasetController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.use(verifyToken, requireAdmin);

router.post('/', createDataset);
router.get('/', getDatasets);
router.get('/:id', getDataset);
router.delete('/:id', deleteDataset);
router.post('/:id/regenerate', regenerateDataset);
router.post('/:id/cancel', cancelDataset);
router.get('/:id/preview', previewDataset);
router.get('/:id/schema', getDatasetSchemaInfo);
router.get('/:id/quality', getQualityReport);

module.exports = router;
