/**
 * Dataset Generation Job Processor
 * Orchestrates synthetic data generation, MongoDB Atlas creation,
 * batch insertion, indexing, and real-time Socket.IO telemetry.
 */

const Dataset = require('../models/Dataset');
const { generateIndustryData } = require('../services/dataGeneratorService');
const {
  createDatabase,
  createCollection,
  createIndexes,
  bulkInsert,
} = require('../services/databaseService');
const { getIndustrySchema } = require('../seeds/industrySchemas');
const logger = require('../utils/logger');

// Track active generation jobs to allow cancellation
const activeJobs = new Map();

/**
 * Cancel a running generation job
 */
const cancelGenerationJob = (datasetId) => {
  if (activeJobs.has(datasetId.toString())) {
    activeJobs.set(datasetId.toString(), 'cancelled');
    logger.info(`Requested cancellation for dataset job: ${datasetId}`);
    return true;
  }
  return false;
};

/**
 * Main worker function to generate and insert a dataset
 */
const processDatasetGeneration = async (datasetId, io = null) => {
  const datasetIdStr = datasetId.toString();
  activeJobs.set(datasetIdStr, 'running');

  let dataset = await Dataset.findById(datasetId);
  if (!dataset) {
    logger.error(`Dataset not found: ${datasetId}`);
    return;
  }

  const emitProgress = (payload) => {
    if (io) {
      io.emit('dataset:progress', { datasetId: datasetIdStr, ...payload });
    }
  };

  try {
    dataset.generationStatus = 'generating';
    dataset.generationProgress = 5;
    dataset.generationLog.push({ message: `Generation started for ${dataset.name}`, level: 'info' });
    await dataset.save();

    emitProgress({
      status: 'generating',
      percentage: 5,
      message: 'Initializing schema and synthetic generation engine...',
    });

    // 1. Build configuration for generator
    const collectionCounts = {};
    if (dataset.collections && dataset.collections.length > 0) {
      dataset.collections.forEach((col) => {
        collectionCounts[col.name] = col.targetCount || col.recordCount || 1000;
      });
    }

    const genConfig = {
      counts: collectionCounts,
      qualityIssuePercentage: dataset.qualityIssuePercentage || 5,
      dateRange: dataset.dateRange || {},
      seed: Math.floor(Math.random() * 1000000),
    };

    // 2. Generate in-memory synthetic interconnected records
    emitProgress({
      status: 'generating',
      percentage: 15,
      message: `Generating synthetic records for industry: ${dataset.industry}...`,
    });

    const generatedData = generateIndustryData(dataset.industry, genConfig);
    const collectionsToInsert = Object.keys(generatedData);
    const totalCollections = collectionsToInsert.length;

    // Check cancellation
    if (activeJobs.get(datasetIdStr) === 'cancelled') {
      throw new Error('Generation was cancelled by administrator');
    }

    // 3. Connect to target database
    const dbName = dataset.databaseName;
    await createDatabase(dbName);
    const schemaDef = getIndustrySchema(dataset.industry);

    let totalSavedRecords = 0;
    let completedCols = 0;

    // 4. Insert each collection into Atlas
    for (const colName of collectionsToInsert) {
      if (activeJobs.get(datasetIdStr) === 'cancelled') {
        throw new Error('Generation was cancelled by administrator');
      }

      const records = generatedData[colName] || [];
      const targetCount = records.length;

      emitProgress({
        status: 'inserting',
        currentCollection: colName,
        targetCount,
        generatedCount: targetCount,
        savedCount: 0,
        failedCount: 0,
        percentage: Math.round(15 + (completedCols / totalCollections) * 75),
        message: `Creating and populating collection: ${colName} (${targetCount} records)...`,
      });

      // Create collection
      await createCollection(dbName, colName);

      // Create indexes if defined in schema
      let colIndexes = [];
      if (schemaDef?.collections) {
        if (Array.isArray(schemaDef.collections)) {
          const found = schemaDef.collections.find((c) => c.name === colName);
          colIndexes = found?.indexes || [];
        } else if (schemaDef.collections[colName]) {
          colIndexes = schemaDef.collections[colName].indexes || [];
        }
      }

      if (colIndexes && colIndexes.length > 0) {
        await createIndexes(dbName, colName, colIndexes);
      }

      // Batch insert into Atlas
      const insertResult = await bulkInsert(dbName, colName, records, 1000, (p) => {
        emitProgress({
          status: 'inserting',
          currentCollection: colName,
          targetCount,
          generatedCount: targetCount,
          savedCount: p.inserted,
          failedCount: p.failed,
          percentage: Math.round(15 + ((completedCols + p.inserted / Math.max(targetCount, 1)) / totalCollections) * 75),
          message: `Inserting ${colName}: ${p.inserted}/${targetCount}`,
        });
      });

      totalSavedRecords += insertResult.insertedCount;
      completedCols += 1;

      // Update collection state in dataset record
      const colIndex = dataset.collections.findIndex((c) => c.name === colName);
      if (colIndex >= 0) {
        dataset.collections[colIndex].recordCount = insertResult.insertedCount;
        dataset.collections[colIndex].status = 'completed';
      } else {
        dataset.collections.push({
          name: colName,
          recordCount: insertResult.insertedCount,
          targetCount,
          status: 'completed',
        });
      }

      dataset.generationLog.push({
        message: `Collection ${colName}: saved ${insertResult.insertedCount} records`,
        level: 'info',
      });
      await dataset.save();
    }

    // 5. Finalize dataset status
    dataset.totalRecords = totalSavedRecords;
    dataset.generationStatus = 'completed';
    dataset.generationProgress = 100;
    dataset.generationLog.push({
      message: `Generation successfully completed. Total records saved: ${totalSavedRecords}`,
      level: 'info',
    });
    await dataset.save();

    emitProgress({
      status: 'completed',
      percentage: 100,
      totalRecords: totalSavedRecords,
      message: `Dataset generation completed successfully with ${totalSavedRecords} records!`,
    });

    logger.info(`Dataset ${dataset.name} generation completed: ${totalSavedRecords} records written to ${dbName}`);
  } catch (err) {
    console.error('[DEBUG STACK]:', err.stack);
    logger.error(`Dataset generation failed for ${datasetId}: ${err.message}`);
    const isCancelled = activeJobs.get(datasetIdStr) === 'cancelled';

    dataset.generationStatus = isCancelled ? 'cancelled' : 'failed';
    dataset.generationLog.push({ message: `Error: ${err.message}`, level: 'error' });
    await dataset.save();

    emitProgress({
      status: dataset.generationStatus,
      percentage: 0,
      error: err.message,
      message: isCancelled ? 'Generation was cancelled' : `Generation failed: ${err.message}`,
    });
  } finally {
    activeJobs.delete(datasetIdStr);
  }
};

module.exports = {
  processDatasetGeneration,
  cancelGenerationJob,
  activeJobs,
};
