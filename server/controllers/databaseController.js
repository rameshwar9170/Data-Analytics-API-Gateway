/**
 * Database Controller
 * Handles MongoDB-style explorer functionality for Admins.
 */

const {
  getDatabaseList,
  getCollections,
  getDocuments,
  getCollectionStats,
  getIndexes,
} = require('../services/databaseService');

// GET /api/databases
const getDatabases = async (req, res, next) => {
  try {
    const databases = await getDatabaseList();
    res.json({ success: true, databases });
  } catch (error) {
    next(error);
  }
};

// GET /api/databases/:dbName/collections
const getDbCollections = async (req, res, next) => {
  try {
    const collections = await getCollections(req.params.dbName);
    res.json({ success: true, database: req.params.dbName, collections });
  } catch (error) {
    next(error);
  }
};

// GET /api/databases/:dbName/:collection/documents
const getColDocuments = async (req, res, next) => {
  try {
    const { dbName, collection } = req.params;
    const { page = 1, limit = 50, filter, sort } = req.query;

    let parsedFilter = {};
    if (filter) {
      try {
        parsedFilter = JSON.parse(filter);
      } catch {
        parsedFilter = {};
      }
    }

    let parsedSort = { _id: -1 };
    if (sort) {
      try {
        parsedSort = JSON.parse(sort);
      } catch {
        parsedSort = { _id: -1 };
      }
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const result = await getDocuments(dbName, collection, parsedFilter, {
      skip,
      limit: parseInt(limit, 10),
      sort: parsedSort,
    });

    res.json({
      success: true,
      database: dbName,
      collection,
      ...result,
      page: parseInt(page, 10),
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/databases/:dbName/:collection/schema
const getColSchema = async (req, res, next) => {
  try {
    const { dbName, collection } = req.params;
    const stats = await getCollectionStats(dbName, collection);
    res.json({ success: true, stats });
  } catch (error) {
    next(error);
  }
};

// GET /api/databases/:dbName/:collection/stats
const getColStats = async (req, res, next) => {
  try {
    const { dbName, collection } = req.params;
    const stats = await getCollectionStats(dbName, collection);
    res.json({ success: true, stats });
  } catch (error) {
    next(error);
  }
};

// GET /api/databases/:dbName/:collection/indexes
const getColIndexes = async (req, res, next) => {
  try {
    const { dbName, collection } = req.params;
    const indexes = await getIndexes(dbName, collection);
    res.json({ success: true, database: dbName, collection, indexes });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDatabases,
  getDbCollections,
  getColDocuments,
  getColSchema,
  getColStats,
  getColIndexes,
};
