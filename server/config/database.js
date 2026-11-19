/**
 * Database Configuration
 * Handles MongoDB Atlas connection, multi-database support, and connection events
 */

const mongoose = require('mongoose');
const config = require('./app');
const logger = require('../utils/logger');

// Cache for database connections
const dbConnections = new Map();

/**
 * Connect to the primary MongoDB database
 */
const connectDatabase = async () => {
  try {
    const conn = await mongoose.connect(config.mongodbUri, {
      maxPoolSize: 20,
      minPoolSize: 2,
      maxIdleTimeMS: 30000, // Close idle connections before Atlas firewall drops them
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 20000,
      heartbeatFrequencyMS: 10000, // Keep connection alive and detect dropped nodes
      retryWrites: true,
      retryReads: true,
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Connection events
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    return conn;
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    // Don't kill process; throw error so server can remain alive and retry
    throw error;
  }
};

/**
 * Get or create a connection to a specific database on the same Atlas cluster.
 * Uses the existing mongoose connection and switches databases via useDb().
 * @param {string} dbName - The database name
 * @returns {mongoose.Connection} A mongoose connection to the specified database
 */
const getDatabase = (dbName) => {
  if (!dbName) {
    throw new Error('Database name is required');
  }

  if (dbConnections.has(dbName)) {
    return dbConnections.get(dbName);
  }

  // useDb creates a new connection that shares the underlying connection pool
  const db = mongoose.connection.useDb(dbName, { useCache: true });

  db.on('error', (err) => {
    logger.error(`Database [${dbName}] error: ${err.message}`);
  });

  dbConnections.set(dbName, db);
  logger.info(`Database connection established: ${dbName}`);

  return db;
};

/**
 * Close a specific database connection
 * @param {string} dbName - The database name
 */
const closeDatabase = async (dbName) => {
  if (dbConnections.has(dbName)) {
    dbConnections.delete(dbName);
    logger.info(`Database connection closed: ${dbName}`);
  }
};

/**
 * List all cached database connections
 */
const listConnections = () => {
  return Array.from(dbConnections.keys());
};

/**
 * Graceful shutdown - close all connections
 */
const disconnectAll = async () => {
  dbConnections.clear();
  await mongoose.disconnect();
  logger.info('All database connections closed');
};

module.exports = {
  connectDatabase,
  getDatabase,
  closeDatabase,
  listConnections,
  disconnectAll,
  mongoose,
};
