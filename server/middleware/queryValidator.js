/**
 * Query Validator Middleware
 * Validates and sanitizes MongoDB queries from candidates
 * Blocks all write operations and dangerous commands
 */

const { BLOCKED_OPERATIONS, ALLOWED_QUERY_TYPES } = require('../utils/constants');
const config = require('../config/app');

/**
 * Validate that the query type is allowed
 */
const validateQueryType = (req, res, next) => {
  const { queryType } = req.body;

  if (!queryType) {
    return res.status(400).json({
      success: false,
      message: 'Query type is required.',
    });
  }

  if (!ALLOWED_QUERY_TYPES.includes(queryType)) {
    return res.status(403).json({
      success: false,
      message: `Query type "${queryType}" is not allowed. Allowed types: ${ALLOWED_QUERY_TYPES.join(', ')}`,
    });
  }

  next();
};

/**
 * Validate query content - block dangerous operations
 */
const validateQueryContent = (req, res, next) => {
  const { query, collection, database } = req.body;

  if (!collection) {
    return res.status(400).json({
      success: false,
      message: 'Collection name is required.',
    });
  }

  if (!database) {
    return res.status(400).json({
      success: false,
      message: 'Database name is required.',
    });
  }

  // Convert query to string for pattern checking
  const queryString = JSON.stringify(query || {}).toLowerCase();

  // Check for blocked operations in query content
  for (const blocked of BLOCKED_OPERATIONS) {
    const pattern = new RegExp(`\\$${blocked}|"${blocked}"`, 'i');
    if (pattern.test(queryString)) {
      return res.status(403).json({
        success: false,
        message: `Operation "${blocked}" is not permitted. Only read operations are allowed.`,
      });
    }
  }

  // Block $where operator (JavaScript execution)
  if (queryString.includes('$where')) {
    return res.status(403).json({
      success: false,
      message: '$where operator is not permitted for security reasons.',
    });
  }

  // Block mapReduce
  if (queryString.includes('mapreduce') || queryString.includes('map_reduce')) {
    return res.status(403).json({
      success: false,
      message: 'mapReduce is not permitted.',
    });
  }

  // Block eval
  if (queryString.includes('"eval"') || queryString.includes('$eval')) {
    return res.status(403).json({
      success: false,
      message: 'eval is not permitted.',
    });
  }

  // Block $out and $merge (write to collection via aggregation)
  if (queryString.includes('$out') || queryString.includes('$merge')) {
    return res.status(403).json({
      success: false,
      message: '$out and $merge stages are not permitted in aggregation pipelines.',
    });
  }

  // Validate database name starts with icoded_ prefix (safety check)
  if (!database.startsWith('icoded_')) {
    return res.status(403).json({
      success: false,
      message: 'Access to this database is not permitted.',
    });
  }

  next();
};

/**
 * Enforce query limits
 */
const enforceQueryLimits = (req, _res, next) => {
  // Ensure options are set with limits
  if (!req.body.options) {
    req.body.options = {};
  }

  // Enforce result limit
  if (!req.body.options.limit || req.body.options.limit > config.queryResultLimit) {
    req.body.options.limit = config.queryResultLimit;
  }

  // Enforce timeout
  if (!req.body.options.maxTimeMS || req.body.options.maxTimeMS > config.queryTimeoutMs) {
    req.body.options.maxTimeMS = config.queryTimeoutMs;
  }

  next();
};

module.exports = {
  validateQueryType,
  validateQueryContent,
  enforceQueryLimits,
};
