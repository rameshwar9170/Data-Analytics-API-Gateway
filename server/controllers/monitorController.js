/**
 * Monitor Controller
 * Real-time monitoring telemetry and candidate activity metrics for Admin.
 */

const {
  getActiveAssessments,
  getActivityTimeline,
  getCandidateStats,
} = require('../services/monitoringService');
const Assessment = require('../models/Assessment');
const QueryHistory = require('../models/QueryHistory');
const Dataset = require('../models/Dataset');
const User = require('../models/User');

// GET /api/monitor/active
const getActiveCandidates = async (req, res, next) => {
  try {
    const list = await getActiveAssessments();
    res.json({ success: true, activeAssessments: list });
  } catch (error) {
    next(error);
  }
};

// GET /api/monitor/candidates/:id/timeline
const getCandidateActivityTimeline = async (req, res, next) => {
  try {
    const timeline = await getActivityTimeline(req.params.id);
    const stats = await getCandidateStats(req.params.id);
    res.json({ success: true, timeline, stats });
  } catch (error) {
    next(error);
  }
};

// GET /api/monitor/stats
const getLiveStats = async (req, res, next) => {
  try {
    const [
      totalDatasets,
      totalCandidates,
      activeAssessmentsCount,
      completedAssessmentsCount,
      totalQueriesExecuted,
      failedQueriesCount,
    ] = await Promise.all([
      Dataset.countDocuments(),
      User.countDocuments({ role: 'candidate' }),
      Assessment.countDocuments({ status: { $in: ['assigned', 'in_progress'] } }),
      Assessment.countDocuments({ status: { $in: ['submitted', 'evaluated'] } }),
      QueryHistory.countDocuments(),
      QueryHistory.countDocuments({ status: { $in: ['error', 'timeout'] } }),
    ]);

    // Calculate total records across datasets
    const datasets = await Dataset.find().select('totalRecords');
    const totalRecordsGenerated = datasets.reduce((sum, d) => sum + (d.totalRecords || 0), 0);

    res.json({
      success: true,
      stats: {
        totalDatasets,
        totalRecordsGenerated,
        totalCandidates,
        activeAssessments: activeAssessmentsCount,
        completedAssessments: completedAssessmentsCount,
        totalQueriesExecuted,
        failedQueriesCount,
        successRate:
          totalQueriesExecuted > 0
            ? Math.round(((totalQueriesExecuted - failedQueriesCount) / totalQueriesExecuted) * 100)
            : 100,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActiveCandidates,
  getCandidateActivityTimeline,
  getLiveStats,
};
