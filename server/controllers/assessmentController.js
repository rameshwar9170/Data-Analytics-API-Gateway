/**
 * Assessment Controller
 * Manages candidate assessment lifecycle, question submissions, and evaluations.
 */

const { v4: uuidv4 } = require('uuid');
const Assessment = require('../models/Assessment');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const { logActivity } = require('../services/monitoringService');
const { evaluateAssessment: runEvaluation } = require('../services/evaluationService');

// POST /api/assessments/assign
const assignToCandidate = async (req, res, next) => {
  try {
    const { candidateId, assignmentId, expiryDays = 7 } = req.body;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    const candidate = await User.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    const accessToken = uuidv4().replace(/-/g, '');
    const accessExpiry = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

    const assessment = await Assessment.create({
      candidateId,
      assignmentId,
      datasetId: assignment.datasetId,
      status: 'assigned',
      accessToken,
      accessExpiry,
      createdBy: req.user?._id,
    });

    await logActivity(candidateId, assessment._id, 'login', {
      action: 'Assessment assigned to candidate',
      assignmentTitle: assignment.title,
    });

    res.status(201).json({
      success: true,
      message: 'Assessment assigned successfully',
      assessment,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/assessments
const getAssessments = async (req, res, next) => {
  try {
    const { status, candidateId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (candidateId) filter.candidateId = candidateId;

    const assessments = await Assessment.find(filter)
      .populate('candidateId', 'name email status')
      .populate('assignmentId', 'title difficulty totalQuestions totalMarks timeLimit')
      .populate('datasetId', 'name industry databaseName')
      .sort('-createdAt');

    res.json({ success: true, assessments });
  } catch (error) {
    next(error);
  }
};

// GET /api/assessments/my
const getCandidateAssessment = async (req, res, next) => {
  try {
    const assessment = await Assessment.findOne({
      candidateId: req.user.id,
      status: { $in: ['assigned', 'in_progress', 'submitted', 'evaluated'] },
    })
      .populate('assignmentId')
      .populate('datasetId', 'name industry databaseName collections totalRecords')
      .sort('-createdAt');

    if (!assessment) {
      return res.status(404).json({ success: false, message: 'No active assessment found' });
    }

    // Mask hidden fields from questions
    const assessmentObj = assessment.toObject();
    if (assessmentObj.assignmentId && assessmentObj.assignmentId.questions) {
      assessmentObj.assignmentId.questions = assessmentObj.assignmentId.questions.map((q) => {
        const { hiddenExpectedResult, validationLogic, ...safeQ } = q;
        return safeQ;
      });
    }

    res.json({ success: true, assessment: assessmentObj });
  } catch (error) {
    next(error);
  }
};

// POST /api/assessments/:id/start
const startAssessment = async (req, res, next) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    if (assessment.status === 'assigned') {
      assessment.status = 'in_progress';
      assessment.startTime = new Date();
      await assessment.save();

      await logActivity(assessment.candidateId, assessment._id, 'navigation', {
        action: 'Candidate started assessment',
      });
    }

    res.json({ success: true, assessment });
  } catch (error) {
    next(error);
  }
};

// POST /api/assessments/:id/responses
const submitResponse = async (req, res, next) => {
  try {
    const { questionIndex, query, result } = req.body;
    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    if (assessment.status === 'submitted' || assessment.status === 'evaluated') {
      return res.status(400).json({ success: false, message: 'Assessment already submitted' });
    }

    // Upsert response for this question
    const existingIndex = assessment.responses.findIndex((r) => r.questionIndex === questionIndex);
    const responsePayload = {
      questionIndex,
      query,
      result: Array.isArray(result) ? result.slice(0, 20) : result, // Store sample of result
      submittedAt: new Date(),
    };

    if (existingIndex >= 0) {
      assessment.responses[existingIndex] = responsePayload;
    } else {
      assessment.responses.push(responsePayload);
    }

    await assessment.save();

    await logActivity(assessment.candidateId, assessment._id, 'submission', {
      questionIndex,
      action: 'Saved task query draft',
    });

    res.json({ success: true, message: 'Response recorded', responsesCount: assessment.responses.length });
  } catch (error) {
    next(error);
  }
};

// POST /api/assessments/:id/submit
const submitAssessment = async (req, res, next) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    assessment.status = 'submitted';
    assessment.endTime = new Date();
    assessment.submittedAt = new Date();
    await assessment.save();

    await logActivity(assessment.candidateId, assessment._id, 'submission', {
      action: 'Candidate finalized and submitted entire assessment',
      totalAnswered: assessment.responses.length,
    });

    // Automatically trigger evaluation in the background
    setImmediate(() => {
      runEvaluation(assessment._id).catch(() => {});
    });

    res.json({
      success: true,
      message: 'Assessment submitted successfully. Automated evaluation in progress.',
      assessment,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/assessments/:id/evaluate
const evaluateAssessmentEndpoint = async (req, res, next) => {
  try {
    const evaluated = await runEvaluation(req.params.id);
    res.json({ success: true, message: 'Evaluation completed', assessment: evaluated });
  } catch (error) {
    next(error);
  }
};

// GET /api/assessments/:id/results
const getResults = async (req, res, next) => {
  try {
    const assessment = await Assessment.findById(req.params.id)
      .populate('candidateId', 'name email')
      .populate('assignmentId')
      .populate('datasetId', 'name industry');

    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    res.json({ success: true, assessment });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  assignToCandidate,
  getAssessments,
  getCandidateAssessment,
  startAssessment,
  submitResponse,
  submitAssessment,
  evaluateAssessmentEndpoint,
  getResults,
};
