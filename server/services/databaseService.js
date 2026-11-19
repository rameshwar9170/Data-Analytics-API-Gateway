/**
 * Database Service
 * Manages database operations on MongoDB Atlas: creation, bulk inserts,
 * collection management, statistics, and queries.
 */

const mongoose = require('mongoose');
const { getDatabase } = require('../config/database');
const config = require('../config/app');
const logger = require('../utils/logger');

// Protected system databases that cannot be dropped
const PROTECTED_DBS = ['admin', 'local', 'config', 'icoded_main'];

/**
 * Namespace guard: strictly enforces that only 'icoded_' databases can be accessed.
 * Prevents accessing any other databases (e.g. sample_mflix, admin, local, personal DBs).
 */
const isAllowedDatabase = (dbName) => {
  return typeof dbName === 'string' && dbName.startsWith('icoded_');
};

const assertAllowedDatabase = (dbName) => {
  if (!isAllowedDatabase(dbName)) {
    throw new Error(`Access restricted: Database '${dbName}' is outside the authorized 'icoded_' project namespace.`);
  }
};

/**
 * Get native MongoClient db reference
 */
const getNativeDb = (dbName) => {
  assertAllowedDatabase(dbName);
  return mongoose.connection.client.db(dbName);
};

/**
 * List only authorized 'icoded_' databases on the MongoDB Atlas cluster
 */
const getDatabaseList = async () => {
  try {
    const adminDb = mongoose.connection.client.db().admin();
    const result = await adminDb.listDatabases();
    
    // Strict namespace filter: only expose icoded_* databases to the application
    const databases = (result.databases || [])
      .filter((db) => db.name.startsWith('icoded_'))
      .map((db) => ({
        name: db.name,
        sizeOnDisk: db.sizeOnDisk,
        empty: db.empty,
        isSystem: db.name === 'icoded_main',
        isDatasetDb: db.name !== 'icoded_main',
      }));

    return databases;
  } catch (error) {
    logger.error(`Error listing databases: ${error.message}`);
    throw error;
  }
};

/**
 * Create or ensure database exists and return connection
 */
const createDatabase = async (dbName) => {
  if (!dbName) throw new Error('Database name is required');
  assertAllowedDatabase(dbName);
  const db = getDatabase(dbName);
  return db;
};

/**
 * Create collection with optional schema validation
 */
const createCollection = async (dbName, collectionName, validationSchema = null) => {
  try {
    const nativeDb = getNativeDb(dbName);
    const collections = await nativeDb.listCollections({ name: collectionName }).toArray();

    if (collections.length === 0) {
      const options = {};
      if (validationSchema) {
        options.validator = { $jsonSchema: validationSchema };
        options.validationAction = 'warn'; // warn rather than block synthetic data with intentional anomalies
      }
      await nativeDb.createCollection(collectionName, options);
      logger.info(`Created collection: ${dbName}.${collectionName}`);
    }

    return true;
  } catch (error) {
    logger.error(`Error creating collection ${collectionName} in ${dbName}: ${error.message}`);
    throw error;
  }
};

/**
 * Create indexes for a collection
 */
const createIndexes = async (dbName, collectionName, indexSpecs = []) => {
  if (!indexSpecs || indexSpecs.length === 0) return [];
  try {
    const nativeDb = getNativeDb(dbName);
    const col = nativeDb.collection(collectionName);

    const formattedSpecs = indexSpecs.map((spec) => {
      if (spec.fields) {
        return {
          key: spec.fields,
          unique: spec.unique || false,
          name: spec.name || undefined,
        };
      }
      return { key: spec };
    });

    const result = await col.createIndexes(formattedSpecs);
    logger.info(`Created indexes on ${dbName}.${collectionName}: ${JSON.stringify(result)}`);
    return result;
  } catch (error) {
    logger.warn(`Index creation warning for ${dbName}.${collectionName}: ${error.message}`);
    return [];
  }
};

/**
 * Bulk insert records in batches using unordered insert for max throughput
 */
const bulkInsert = async (dbName, collectionName, records = [], batchSize = 1000, onProgress = null) => {
  if (!records || records.length === 0) return { insertedCount: 0, failedCount: 0 };

  const nativeDb = getNativeDb(dbName);
  const col = nativeDb.collection(collectionName);
  const total = records.length;
  let insertedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < total; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    try {
      const result = await col.insertMany(batch, { ordered: false });
      insertedCount += result.insertedCount || batch.length;
    } catch (err) {
      if (err.insertedDocs || err.result?.insertedCount) {
        const count = err.result?.insertedCount || (err.insertedDocs ? err.insertedDocs.length : 0);
        insertedCount += count;
        failedCount += batch.length - count;
      } else {
        failedCount += batch.length;
      }
      logger.warn(`Batch insert warning in ${collectionName} at offset ${i}: ${err.message}`);
    }

    if (onProgress) {
      onProgress({
        collection: collectionName,
        inserted: insertedCount,
        failed: failedCount,
        total,
        percentage: Math.round(((i + batch.length) / total) * 100),
      });
    }
  }

  return { insertedCount, failedCount };
};

/**
 * List collections in a database
 */
const getCollections = async (dbName) => {
  try {
    const nativeDb = getNativeDb(dbName);
    const list = await nativeDb.listCollections().toArray();
    
    // Enhance with counts
    const collectionsWithStats = await Promise.all(
      list.map(async (col) => {
        try {
          const count = await nativeDb.collection(col.name).estimatedDocumentCount();
          return {
            name: col.name,
            type: col.type,
            count,
          };
        } catch {
          return { name: col.name, type: col.type, count: 0 };
        }
      })
    );

    return collectionsWithStats;
  } catch (error) {
    logger.error(`Error listing collections in ${dbName}: ${error.message}`);
    throw error;
  }
};

/**
 * Query documents from a collection with pagination
 */
const getDocuments = async (dbName, collectionName, filter = {}, options = {}) => {
  try {
    const nativeDb = getNativeDb(dbName);
    const col = nativeDb.collection(collectionName);

    const limit = Math.min(options.limit || 50, config.queryResultLimit);
    const skip = options.skip || 0;
    const sort = options.sort || { _id: -1 };

    const [docs, total] = await Promise.all([
      col.find(filter).sort(sort).skip(skip).limit(limit).maxTimeMS(config.queryTimeoutMs).toArray(),
      col.countDocuments(filter).catch(() => col.estimatedDocumentCount()),
    ]);

    return {
      documents: docs,
      total,
      limit,
      skip,
      hasMore: skip + docs.length < total,
    };
  } catch (error) {
    logger.error(`Error querying documents from ${dbName}.${collectionName}: ${error.message}`);
    throw error;
  }
};

/**
 * Get stats for a collection
 */
const getCollectionStats = async (dbName, collectionName) => {
  try {
    const nativeDb = getNativeDb(dbName);
    const col = nativeDb.collection(collectionName);
    const count = await col.countDocuments().catch(() => col.estimatedDocumentCount());
    const indexes = await col.indexes();

    // Sample a few documents to infer schema
    const sample = await col.find({}).limit(10).toArray();
    const fields = new Set();
    const fieldTypes = {};

    sample.forEach((doc) => {
      Object.keys(doc).forEach((k) => {
        fields.add(k);
        if (!fieldTypes[k]) {
          const val = doc[k];
          if (val === null || val === undefined) fieldTypes[k] = 'null';
          else if (Array.isArray(val)) fieldTypes[k] = 'array';
          else if (val instanceof Date) fieldTypes[k] = 'date';
          else if (typeof val === 'object' && val._bsontype === 'ObjectID') fieldTypes[k] = 'ObjectId';
          else fieldTypes[k] = typeof val;
        }
      });
    });

    return {
      database: dbName,
      collection: collectionName,
      count,
      indexCount: indexes.length,
      indexes,
      fields: Array.from(fields),
      fieldTypes,
      sample: sample.slice(0, 3),
    };
  } catch (error) {
    logger.error(`Error getting stats for ${dbName}.${collectionName}: ${error.message}`);
    throw error;
  }
};

/**
 * Get collection indexes
 */
const getIndexes = async (dbName, collectionName) => {
  try {
    const nativeDb = getNativeDb(dbName);
    return await nativeDb.collection(collectionName).indexes();
  } catch (error) {
    logger.error(`Error getting indexes for ${dbName}.${collectionName}: ${error.message}`);
    throw error;
  }
};

/**
 * Safely drop a database
 */
const dropDatabase = async (dbName) => {
  if (PROTECTED_DBS.includes(dbName)) {
    throw new Error(`Cannot drop protected database: ${dbName}`);
  }
  if (!dbName.startsWith('icoded_')) {
    throw new Error(`Can only drop datasets in the 'icoded_' namespace`);
  }

  try {
    const nativeDb = getNativeDb(dbName);
    await nativeDb.dropDatabase();
    logger.info(`Successfully dropped database: ${dbName}`);
    return true;
  } catch (error) {
    logger.error(`Error dropping database ${dbName}: ${error.message}`);
    throw error;
  }
};

module.exports = {
  getDatabaseList,
  createDatabase,
  createCollection,
  createIndexes,
  bulkInsert,
  getCollections,
  getDocuments,
  getCollectionStats,
  getIndexes,
  dropDatabase,
  PROTECTED_DBS,
};
