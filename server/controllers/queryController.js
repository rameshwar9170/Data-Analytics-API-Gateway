/**
 * Query Controller
 * Handles secure candidate query execution, query history, and saved queries.
 */

const Assessment = require('../models/Assessment');
const QueryHistory = require('../models/QueryHistory');
const { executeQuery } = require('../services/queryExecutionService');

// In-memory or database-backed saved queries
const savedQueriesStore = new Map();

// POST /api/queries/execute
const runCandidateQuery = async (req, res, next) => {
  try {
    const { collection, queryType, query, options } = req.body;
    const candidateId = req.user.id;

    // Verify candidate has an active assessment with access to the dataset
    const activeAssessment = await Assessment.findOne({
      candidateId,
      status: { $in: ['assigned', 'in_progress'] },
    }).populate('datasetId', 'databaseName');

    if (!activeAssessment || !activeAssessment.datasetId) {
      return res.status(403).json({
        success: false,
        message: 'No active assessment session or assigned dataset found for your account',
      });
    }

    // Check expiry
    if (activeAssessment.accessExpiry && new Date() > activeAssessment.accessExpiry) {
      return res.status(403).json({
        success: false,
        message: 'Your dataset access credentials have expired',
      });
    }

    const targetDbName = activeAssessment.datasetId.databaseName;

    // Execute query safely
    const result = await executeQuery(
      targetDbName,
      collection,
      queryType || 'find',
      query,
      options || {},
      {
        candidateId,
        assessmentId: activeAssessment._id,
      }
    );

    res.json({
      success: true,
      database: targetDbName,
      collection,
      ...result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      executionTime: 0,
      status: 'error',
    });
  }
};

// GET /api/queries/history
const getQueryHistory = async (req, res, next) => {
  try {
    const history = await QueryHistory.find({ candidateId: req.user.id })
      .sort('-timestamp')
      .limit(50);

    res.json({ success: true, history });
  } catch (error) {
    next(error);
  }
};

// POST /api/queries/save
const saveQuery = async (req, res, next) => {
  try {
    const { title, collection, queryType, query } = req.body;
    const key = req.user.id.toString();

    if (!savedQueriesStore.has(key)) {
      savedQueriesStore.set(key, []);
    }

    const saved = {
      id: Date.now().toString(),
      title: title || 'Untitled Query',
      collection,
      queryType,
      query,
      createdAt: new Date(),
    };

    savedQueriesStore.get(key).push(saved);
    res.json({ success: true, message: 'Query saved', savedQuery: saved });
  } catch (error) {
    next(error);
  }
};

// GET /api/queries/saved
const getSavedQueries = async (req, res, next) => {
  try {
    const key = req.user.id.toString();
    const list = savedQueriesStore.get(key) || [];
    res.json({ success: true, savedQueries: list });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  runCandidateQuery,
  getQueryHistory,
  saveQuery,
  getSavedQueries,
};
