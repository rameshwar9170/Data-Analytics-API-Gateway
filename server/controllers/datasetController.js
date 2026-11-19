/**
 * Dataset Controller
 * Manages dataset generation, configuration, previewing, and database lifecycle.
 */

const Dataset = require('../models/Dataset');
const { getIndustrySchema, INITIAL_DATASETS } = require('../seeds/industrySchemas');
const { processDatasetGeneration, cancelGenerationJob } = require('../jobs/datasetGenerationJob');
const { dropDatabase, getDocuments, getCollectionStats } = require('../services/databaseService');
const { generateDatasetSchema } = require('../services/aiService');
const { normalizeIndustry } = require('../utils/constants');
const logger = require('../utils/logger');

// POST /api/datasets
const createDataset = async (req, res, next) => {
  try {
    const {
      name,
      industry,
      description,
      difficulty,
      databaseName,
      collections,
      dateRange,
      currency,
      country,
      dataComplexity,
      qualityIssuePercentage,
      relationshipComplexity,
    } = req.body;

    const normIndustry = normalizeIndustry(industry);
    const dbName = databaseName || `icoded_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_demo`;

    // Fetch industry template schema
    const schemaDef = getIndustrySchema(normIndustry);
    let standardCollections = [];
    if (schemaDef && schemaDef.collections) {
      if (Array.isArray(schemaDef.collections)) {
        standardCollections = schemaDef.collections.map((c) => ({
          name: c.name,
          targetCount: c.targetCount || 1000,
          recordCount: 0,
          status: 'pending',
        }));
      } else {
        standardCollections = Object.keys(schemaDef.collections).map((key) => ({
          name: key,
          targetCount: schemaDef.collections[key].defaultCount || 1000,
          recordCount: 0,
          status: 'pending',
        }));
      }
    }

    // Map collections with target counts
    const configuredCollections = (collections && collections.length > 0)
      ? collections
      : standardCollections;

    const targetTotal = configuredCollections.reduce((sum, c) => sum + (c.targetCount || 1000), 0);

    const dataset = await Dataset.create({
      name,
      industry: normIndustry,
      description: description || `Realistic synthetic dataset for ${industry}`,
      difficulty: (difficulty || 'intermediate').toLowerCase(),
      databaseName: dbName,
      collections: configuredCollections,
      targetTotalRecords: targetTotal,
      totalRecords: 0,
      dateRange: dateRange || {
        start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        end: new Date(),
      },
      currency: currency || 'INR',
      country: country || 'India',
      dataComplexity: (dataComplexity || 'medium').toLowerCase(),
      qualityIssuePercentage: qualityIssuePercentage || 5,
      relationshipComplexity: (relationshipComplexity === 'medium' ? 'moderate' : (relationshipComplexity || 'moderate')).toLowerCase(),
      generationStatus: 'pending',
      generationProgress: 0,
      schemaDefinition: schemaDef || {},
      relationships: schemaDef?.relationships || [],
      qualitySummary: {
        missingValuesPercentage: qualityIssuePercentage || 5,
        duplicateRecordsCount: Math.round(targetTotal * 0.01),
        outliersCount: Math.round(targetTotal * 0.02),
        inconsistentRecordsCount: Math.round(targetTotal * 0.01),
      },
      createdBy: req.user?._id,
    });

    // Start background generation job with Socket.IO instance
    const io = req.app.get('io');
    setImmediate(() => {
      processDatasetGeneration(dataset._id, io).catch((err) => {
        logger.error(`Background generation failed: ${err.message}`);
      });
    });

    res.status(201).json({
      success: true,
      message: 'Dataset creation initiated successfully',
      dataset,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/datasets
const getDatasets = async (req, res, next) => {
  try {
    const { industry, status, difficulty, search, page = 1, limit = 20, sort = '-createdAt' } = req.query;

    const filter = {};
    if (industry) filter.industry = industry;
    if (status) filter.generationStatus = status;
    if (difficulty) filter.difficulty = difficulty;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { databaseName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [datasets, total] = await Promise.all([
      Dataset.find(filter).sort(sort).skip(skip).limit(parseInt(limit, 10)).populate('createdBy', 'name email'),
      Dataset.countDocuments(filter),
    ]);

    res.json({
      success: true,
      datasets,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/datasets/:id
const getDataset = async (req, res, next) => {
  try {
    const dataset = await Dataset.findById(req.params.id).populate('createdBy', 'name email');
    if (!dataset) {
      return res.status(404).json({ success: false, message: 'Dataset not found' });
    }
    res.json({ success: true, dataset });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/datasets/:id
const deleteDataset = async (req, res, next) => {
  try {
    const dataset = await Dataset.findById(req.params.id);
    if (!dataset) {
      return res.status(404).json({ success: false, message: 'Dataset not found' });
    }

    // Drop database from Atlas if it exists
    try {
      await dropDatabase(dataset.databaseName);
    } catch (err) {
      logger.warn(`Could not drop database ${dataset.databaseName}: ${err.message}`);
    }

    await Dataset.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: `Dataset and database '${dataset.databaseName}' deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/datasets/:id/regenerate
const regenerateDataset = async (req, res, next) => {
  try {
    const dataset = await Dataset.findById(req.params.id);
    if (!dataset) {
      return res.status(404).json({ success: false, message: 'Dataset not found' });
    }

    dataset.generationStatus = 'pending';
    dataset.generationProgress = 0;
    dataset.generationLog = [`[${new Date().toISOString()}] Regeneration initiated`];
    await dataset.save();

    const io = req.app.get('io');
    setImmediate(() => {
      processDatasetGeneration(dataset._id, io).catch((err) => {
        logger.error(`Regeneration failed: ${err.message}`);
      });
    });

    res.json({
      success: true,
      message: 'Dataset regeneration started',
      dataset,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/datasets/:id/cancel
const cancelDataset = async (req, res, next) => {
  try {
    const cancelled = cancelGenerationJob(req.params.id);
    res.json({
      success: true,
      message: cancelled ? 'Cancellation requested' : 'No active generation job found for this dataset',
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/datasets/:id/preview
const previewDataset = async (req, res, next) => {
  try {
    const dataset = await Dataset.findById(req.params.id);
    if (!dataset) {
      return res.status(404).json({ success: false, message: 'Dataset not found' });
    }

    const preview = {};
    for (const col of dataset.collections) {
      try {
        const result = await getDocuments(dataset.databaseName, col.name, {}, { limit: 10 });
        preview[col.name] = {
          count: col.recordCount,
          sample: result.documents,
        };
      } catch {
        preview[col.name] = { count: 0, sample: [] };
      }
    }

    res.json({
      success: true,
      database: dataset.databaseName,
      preview,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/datasets/:id/schema
const getDatasetSchemaInfo = async (req, res, next) => {
  try {
    const dataset = await Dataset.findById(req.params.id);
    if (!dataset) {
      return res.status(404).json({ success: false, message: 'Dataset not found' });
    }
    res.json({
      success: true,
      schema: dataset.schemaDefinition || {},
      relationships: dataset.relationships,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/datasets/:id/quality
const getQualityReport = async (req, res, next) => {
  try {
    const dataset = await Dataset.findById(req.params.id);
    if (!dataset) {
      return res.status(404).json({ success: false, message: 'Dataset not found' });
    }
    res.json({
      success: true,
      qualitySummary: dataset.qualitySummary,
      qualityIssuePercentage: dataset.qualityIssuePercentage,
      anomaliesConfigured: [
        'Missing / null values in optional demographic and address fields',
        'Duplicate records representing repeated form/checkout attempts',
        'Extreme outlier amounts for transaction and balance audits',
        'Order and payment status inconsistencies for edge-case queries',
      ],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDataset,
  getDatasets,
  getDataset,
  deleteDataset,
  regenerateDataset,
  cancelDataset,
  previewDataset,
  getDatasetSchemaInfo,
  getQualityReport,
};
