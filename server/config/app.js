/**
 * Application Configuration Constants
 * Centralizes all configuration from environment variables with sensible defaults
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const config = {
  // Server
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  isProd: process.env.NODE_ENV === 'production',

  // Database
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/icoded_main',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'default_dev_secret_change_me',
  jwtExpire: process.env.JWT_EXPIRE || '7d',

  // OpenAI
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4',

  // Data Generation
  maxRecordsPerCollection: parseInt(process.env.MAX_RECORDS_PER_COLLECTION, 10) || 100000,
  batchSize: parseInt(process.env.BATCH_SIZE, 10) || 1000,

  // Rate Limiting
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 15, // minutes
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,

  // Query Execution
  queryTimeoutMs: parseInt(process.env.QUERY_TIMEOUT_MS, 10) || 30000,
  queryResultLimit: parseInt(process.env.QUERY_RESULT_LIMIT, 10) || 1000,

  // CORS
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:5173'],

  // Branding
  branding: {
    charcoal: '#1B1D21',
    orange: '#E96A1C',
    lightOrange: '#F4A261',
    cream: '#FAF9F7',
  },
};

module.exports = config;
