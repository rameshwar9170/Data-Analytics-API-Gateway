/**
 * Query Execution Service
 * Safely executes candidate queries against assigned MongoDB datasets.
 * Enforces read-only operations, timeouts, and result limits.
 */

const mongoose = require('mongoose');
const config = require('../config/app');
const logger = require('../utils/logger');
const { logActivity } = require('./monitoringService');
const QueryHistory = require('../models/QueryHistory');

// Blocked operators / keywords for safety
const FORBIDDEN_KEYS = [
  '$where',
  '$accumulator',
  '$function',
  'mapReduce',
  'drop',
  'insert',
  'update',
  'delete',
  'eval',
];

/**
 * Check if an object contains forbidden keys recursively
 */
const containsForbiddenKeys = (obj) => {
  if (!obj || typeof obj !== 'object') return false;

  for (const key of Object.keys(obj)) {
    if (FORBIDDEN_KEYS.includes(key)) return true;
    if (typeof obj[key] === 'object' && containsForbiddenKeys(obj[key])) return true;
  }
  return false;
};

/**
 * Execute a read-only MongoDB query
 * @param {string} dbName - Target dataset database
 * @param {string} collectionName - Target collection
 * @param {string} queryType - 'find' | 'aggregate' | 'countDocuments' | 'distinct'
 * @param {Object|Array} queryPayload - The query filter or aggregation pipeline
 * @param {Object} options - { limit, skip, sort, project, distinctField }
 * @param {Object} candidateContext - { candidateId, assessmentId }
 */
const executeQuery = async (dbName, collectionName, queryType, queryPayload, options = {}, candidateContext = null) => {
  const startTime = Date.now();
  let status = 'success';
  let errorMessage = null;
  let resultCount = 0;
  let results = [];

  // 1. Database security check - strictly permit only candidate dataset databases
  if (!dbName || !dbName.startsWith('icoded_') || dbName === 'icoded_main') {
    throw new Error('Access denied: Candidate queries can only access dataset databases (icoded_*). System and non-project databases cannot be accessed.');
  }

  // 2. Validate query payload against injection / code execution
  if (containsForbiddenKeys(queryPayload) || containsForbiddenKeys(options)) {
    throw new Error('Query contains forbidden operators or commands ($where, $accumulator, $function, etc.)');
  }

  const nativeDb = mongoose.connection.client.db(dbName);
  const col = nativeDb.collection(collectionName);
  const timeoutMs = config.queryTimeoutMs || 30000;
  const maxLimit = config.queryResultLimit || 1000;

  try {
    switch (queryType) {
      case 'find': {
        const filter = queryPayload || {};
        const limit = Math.min(parseInt(options.limit, 10) || 100, maxLimit);
        const skip = Math.max(0, parseInt(options.skip, 10) || 0);
        const sort = options.sort || {};
        const projection = options.projection || options.project || {};

        let cursor = col.find(filter).maxTimeMS(timeoutMs).skip(skip).limit(limit);
        if (Object.keys(sort).length > 0) cursor = cursor.sort(sort);
        if (Object.keys(projection).length > 0) cursor = cursor.project(projection);

        results = await cursor.toArray();
        resultCount = results.length;
        break;
      }

      case 'aggregate': {
        if (!Array.isArray(queryPayload)) {
          throw new Error('Aggregation pipeline must be an array of stages');
        }

        // Validate pipeline stages
        const forbiddenStages = ['$out', '$merge'];
        for (const stage of queryPayload) {
          const stageKey = Object.keys(stage)[0];
          if (forbiddenStages.includes(stageKey)) {
            throw new Error(`Aggregation stage ${stageKey} is not allowed in read-only mode`);
          }
        }

        // Enforce limit if not in pipeline or exceeds max
        const pipeline = [...queryPayload];
        const hasLimit = pipeline.some((stage) => '$limit' in stage);
        if (!hasLimit) {
          pipeline.push({ $limit: maxLimit });
        }

        results = await col.aggregate(pipeline, { maxTimeMS: timeoutMs, allowDiskUse: false }).toArray();
        resultCount = results.length;
        break;
      }

      case 'countDocuments': {
        const filter = queryPayload || {};
        const count = await col.countDocuments(filter, { maxTimeMS: timeoutMs });
        results = [{ count }];
        resultCount = 1;
        break;
      }

      case 'distinct': {
        const field = options.distinctField || options.field;
        if (!field) throw new Error('Field name required for distinct operation');
        const filter = queryPayload || {};
        const distinctValues = await col.distinct(field, filter, { maxTimeMS: timeoutMs });
        results = distinctValues.slice(0, maxLimit);
        resultCount = results.length;
        break;
      }

      default:
        throw new Error(`Unsupported query type: ${queryType}. Allowed: find, aggregate, countDocuments, distinct`);
    }
  } catch (err) {
    status = err.message && err.message.includes('timed out') ? 'timeout' : 'error';
    errorMessage = err.message;
    throw err;
  } finally {
    const executionTime = Date.now() - startTime;

    // Log query in QueryHistory and ActivityLog if candidate context provided
    if (candidateContext && candidateContext.candidateId) {
      try {
        await QueryHistory.create({
          candidateId: candidateContext.candidateId,
          assessmentId: candidateContext.assessmentId,
          query: typeof queryPayload === 'string' ? queryPayload : JSON.stringify(queryPayload),
          queryType,
          database: dbName,
          collection: collectionName,
          status,
          executionTime,
          resultCount,
          errorMessage,
          timestamp: new Date(),
        });

        await logActivity(
          candidateContext.candidateId,
          candidateContext.assessmentId,
          status === 'success' ? 'query' : 'error',
          {
            queryType,
            collectionName,
            executionTime,
            resultCount,
            error: errorMessage,
          }
        );
      } catch (logErr) {
        logger.error(`Failed to log candidate query activity: ${logErr.message}`);
      }
    }
  }

  const executionTime = Date.now() - startTime;
  return {
    results,
    resultCount,
    executionTime,
    status: 'success',
  };
};

module.exports = {
  executeQuery,
  containsForbiddenKeys,
};
