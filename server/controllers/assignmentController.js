/**
 * Assignment Controller
 * Manages Data Analyst assignments generated from datasets.
 */

const Assignment = require('../models/Assignment');
const Dataset = require('../models/Dataset');
const { generateAssignmentQuestions } = require('../services/aiService');

// POST /api/assignments/generate
const generateAssignment = async (req, res, next) => {
  try {
    const { datasetId, title, difficulty, questionCount, timeLimit } = req.body;

    const dataset = await Dataset.findById(datasetId);
    if (!dataset) {
      return res.status(404).json({ success: false, message: 'Dataset not found' });
    }

    const questions = await generateAssignmentQuestions(dataset, {
      questionCount: parseInt(questionCount, 10) || 20,
      difficulty: difficulty || dataset.difficulty || 'Intermediate',
    });

    const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 5), 0);

    const assignment = await Assignment.create({
      title: title || `${dataset.name} - Data Analyst Assessment`,
      description: `Comprehensive MongoDB analytical challenge based on the ${dataset.industry} business dataset.`,
      datasetId: dataset._id,
      difficulty: difficulty || dataset.difficulty || 'Intermediate',
      totalQuestions: questions.length,
      totalMarks,
      timeLimit: parseInt(timeLimit, 10) || 120, // 2 hours
      questions,
      status: 'published',
      createdBy: req.user?._id,
    });

    res.status(201).json({
      success: true,
      message: 'Assignment generated successfully',
      assignment,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/assignments
const getAssignments = async (req, res, next) => {
  try {
    const { datasetId, difficulty, status } = req.query;
    const filter = {};
    if (datasetId) filter.datasetId = datasetId;
    if (difficulty) filter.difficulty = difficulty;
    if (status) filter.status = status;

    const assignments = await Assignment.find(filter)
      .populate('datasetId', 'name industry databaseName')
      .populate('createdBy', 'name email')
      .sort('-createdAt');

    res.json({ success: true, assignments });
  } catch (error) {
    next(error);
  }
};

// GET /api/assignments/:id
const getAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('datasetId')
      .populate('createdBy', 'name email');

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    // Hide hiddenExpectedResult and validationLogic if requester is not admin
    const assignmentObj = assignment.toObject();
    if (req.user?.role !== 'admin') {
      assignmentObj.questions = assignmentObj.questions.map((q) => {
        const { hiddenExpectedResult, validationLogic, ...safeQ } = q;
        return safeQ;
      });
    }

    res.json({ success: true, assignment: assignmentObj });
  } catch (error) {
    next(error);
  }
};

// PUT /api/assignments/:id
const updateAssignment = async (req, res, next) => {
  try {
    const { title, description, timeLimit, questions, status } = req.body;
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    if (title) assignment.title = title;
    if (description) assignment.description = description;
    if (timeLimit) assignment.timeLimit = timeLimit;
    if (status) assignment.status = status;
    if (questions) {
      assignment.questions = questions;
      assignment.totalQuestions = questions.length;
      assignment.totalMarks = questions.reduce((sum, q) => sum + (q.marks || 5), 0);
    }

    await assignment.save();
    res.json({ success: true, assignment });
  } catch (error) {
    next(error);
  }
};

// POST /api/assignments/:id/publish
const publishAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    assignment.status = 'published';
    await assignment.save();
    res.json({ success: true, message: 'Assignment published', assignment });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/assignments/:id
const deleteAssignment = async (req, res, next) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Assignment deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateAssignment,
  getAssignments,
  getAssignment,
  updateAssignment,
  publishAssignment,
  deleteAssignment,
};
