/**
 * Settings Controller
 * System settings and configuration management for Admin.
 */

const mongoose = require('mongoose');
const config = require('../config/app');

let customSettings = {
  maxRecordsPerCollection: config.maxRecordsPerCollection,
  batchSize: config.batchSize,
  queryTimeoutMs: config.queryTimeoutMs,
  queryResultLimit: config.queryResultLimit,
  openaiModel: config.openaiModel,
  allowCandidateCustomQueries: true,
};

// GET /api/settings
const getSettings = async (req, res, next) => {
  try {
    const mongoState = mongoose.connection.readyState;
    const mongoStates = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

    res.json({
      success: true,
      settings: customSettings,
      systemStatus: {
        databaseStatus: mongoStates[mongoState] || 'unknown',
        databaseHost: mongoose.connection.host || 'Atlas Cluster',
        nodeEnv: config.nodeEnv,
        openaiConfigured: !!config.openaiApiKey,
        branding: config.branding,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/settings
const updateSettings = async (req, res, next) => {
  try {
    const updates = req.body;
    customSettings = { ...customSettings, ...updates };

    res.json({
      success: true,
      message: 'System settings updated successfully',
      settings: customSettings,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
