/**
 * Candidate Controller
 * Manages candidate accounts, profiles, activity history, and details.
 */

const User = require('../models/User');
const Assessment = require('../models/Assessment');
const QueryHistory = require('../models/QueryHistory');
const ActivityLog = require('../models/ActivityLog');

// GET /api/candidates
const getCandidates = async (req, res, next) => {
  try {
    const candidates = await User.find({ role: 'candidate' })
      .select('-password')
      .sort('-createdAt');

    // Enrich with assessment summary
    const enriched = await Promise.all(
      candidates.map(async (c) => {
        const assessmentCount = await Assessment.countDocuments({ candidateId: c._id });
        const lastAssessment = await Assessment.findOne({ candidateId: c._id }).sort('-createdAt');
        return {
          ...c.toObject(),
          assessmentCount,
          lastStatus: lastAssessment ? lastAssessment.status : 'unassigned',
        };
      })
    );

    res.json({ success: true, candidates: enriched });
  } catch (error) {
    next(error);
  }
};

// GET /api/candidates/:id
const getCandidateDetails = async (req, res, next) => {
  try {
    const candidate = await User.findById(req.params.id).select('-password');
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    const assessments = await Assessment.find({ candidateId: candidate._id })
      .populate('assignmentId', 'title difficulty totalQuestions totalMarks')
      .populate('datasetId', 'name industry databaseName')
      .sort('-createdAt');

    const totalQueries = await QueryHistory.countDocuments({ candidateId: candidate._id });

    res.json({
      success: true,
      candidate,
      assessments,
      stats: { totalQueries },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/candidates
const createCandidate = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Candidate with this email already exists' });
    }

    const candidate = await User.create({
      name,
      email,
      password: password || 'Candidate@123',
      role: 'candidate',
      status: 'active',
    });

    res.status(201).json({
      success: true,
      message: 'Candidate created successfully',
      candidate: {
        id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        role: candidate.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/candidates/:id/activity
const getCandidateActivity = async (req, res, next) => {
  try {
    const logs = await ActivityLog.find({ candidateId: req.params.id })
      .sort('-timestamp')
      .limit(100);

    res.json({ success: true, logs });
  } catch (error) {
    next(error);
  }
};

// GET /api/candidates/:id/queries
const getCandidateQueryHistory = async (req, res, next) => {
  try {
    const queries = await QueryHistory.find({ candidateId: req.params.id })
      .sort('-timestamp')
      .limit(100);

    res.json({ success: true, queries });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCandidates,
  getCandidateDetails,
  createCandidate,
  getCandidateActivity,
  getCandidateQueryHistory,
};
