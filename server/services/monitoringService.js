/**
 * Monitoring Service
 * Tracks candidate activity, generates timelines, and provides live telemetry.
 */

const ActivityLog = require('../models/ActivityLog');
const QueryHistory = require('../models/QueryHistory');
const Assessment = require('../models/Assessment');
const logger = require('../utils/logger');

/**
 * Log candidate activity event
 */
const logActivity = async (candidateId, assessmentId, type, details = {}) => {
  try {
    const log = await ActivityLog.create({
      candidateId,
      assessmentId,
      type,
      details,
      timestamp: new Date(),
    });
    return log;
  } catch (error) {
    logger.error(`Error logging activity: ${error.message}`);
    return null;
  }
};

/**
 * Get activity timeline for a candidate or assessment
 */
const getActivityTimeline = async (candidateId, assessmentId = null, limit = 100) => {
  try {
    const filter = { candidateId };
    if (assessmentId) filter.assessmentId = assessmentId;

    const logs = await ActivityLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('candidateId', 'name email');

    return logs;
  } catch (error) {
    logger.error(`Error fetching timeline: ${error.message}`);
    throw error;
  }
};

/**
 * Get active candidate assessments with real-time status
 */
const getActiveAssessments = async () => {
  try {
    const active = await Assessment.find({
      status: { $in: ['assigned', 'in_progress'] },
    })
      .populate('candidateId', 'name email lastLogin status')
      .populate('assignmentId', 'title difficulty totalQuestions')
      .populate('datasetId', 'name industry databaseName')
      .sort({ updatedAt: -1 });

    // Enrich with recent query stats
    const enriched = await Promise.all(
      active.map(async (item) => {
        const queryCount = await QueryHistory.countDocuments({ assessmentId: item._id });
        const failedCount = await QueryHistory.countDocuments({
          assessmentId: item._id,
          status: { $in: ['error', 'timeout'] },
        });

        const lastActivity = await ActivityLog.findOne({ assessmentId: item._id }).sort({ timestamp: -1 });

        return {
          ...item.toObject(),
          stats: {
            totalQueries: queryCount,
            failedQueries: failedCount,
            lastActivity: lastActivity ? lastActivity.timestamp : item.updatedAt,
            lastAction: lastActivity ? lastActivity.type : 'none',
          },
        };
      })
    );

    return enriched;
  } catch (error) {
    logger.error(`Error getting active assessments: ${error.message}`);
    throw error;
  }
};

/**
 * Get detailed stats for a candidate
 */
const getCandidateStats = async (candidateId, assessmentId) => {
  try {
    const [totalQueries, successfulQueries, failedQueries, queries] = await Promise.all([
      QueryHistory.countDocuments({ candidateId, assessmentId }),
      QueryHistory.countDocuments({ candidateId, assessmentId, status: 'success' }),
      QueryHistory.countDocuments({ candidateId, assessmentId, status: { $in: ['error', 'timeout'] } }),
      QueryHistory.find({ candidateId, assessmentId }).sort({ timestamp: -1 }).limit(50),
    ]);

    const avgExecutionTime =
      queries.length > 0
        ? Math.round(queries.reduce((acc, q) => acc + (q.executionTime || 0), 0) / queries.length)
        : 0;

    return {
      totalQueries,
      successfulQueries,
      failedQueries,
      avgExecutionTime,
      recentQueries: queries,
    };
  } catch (error) {
    logger.error(`Error getting candidate stats: ${error.message}`);
    throw error;
  }
};

module.exports = {
  logActivity,
  getActivityTimeline,
  getActiveAssessments,
  getCandidateStats,
};
