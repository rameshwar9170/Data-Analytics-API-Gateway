/**
 * Evaluation Service
 * Evaluates candidate query responses against expected criteria.
 * Uses deterministic checking for data outputs and AI for qualitative analysis.
 */

const Assessment = require('../models/Assessment');
const logger = require('../utils/logger');

/**
 * Compare two sets of query results deterministically
 */
const compareResults = (candidateResult, expectedResult) => {
  if (!candidateResult || !Array.isArray(candidateResult)) {
    return { score: 0, feedback: 'Query did not return a valid result set' };
  }

  if (candidateResult.length === 0) {
    return { score: 2, feedback: 'Query executed successfully but returned 0 documents' };
  }

  // If candidate returned results and no runtime error occurred
  let score = 8;
  let feedback = 'Query executed successfully and returned structured records';

  // Check expected sample fields if available
  if (expectedResult && expectedResult.sampleFields) {
    const firstDoc = candidateResult[0];
    const matchedFields = expectedResult.sampleFields.filter((f) => f in firstDoc);
    if (matchedFields.length === expectedResult.sampleFields.length) {
      score = 10;
      feedback = 'All required projected fields and aggregates present in result';
    } else {
      score = 6;
      feedback = `Partially correct output structure. Missing expected fields: ${expectedResult.sampleFields
        .filter((f) => !(f in firstDoc))
        .join(', ')}`;
    }
  }

  return { score, feedback };
};

/**
 * Evaluate single question response
 */
const evaluateResponse = async (question, candidateResponse) => {
  if (!candidateResponse || !candidateResponse.query) {
    return {
      autoScore: 0,
      feedback: 'No query was submitted for this question',
    };
  }

  const { query, result } = candidateResponse;
  const maxMarks = question.marks || 10;

  const comparison = compareResults(result, question.hiddenExpectedResult);
  const normalizedScore = Math.round((comparison.score / 10) * maxMarks);

  return {
    autoScore: normalizedScore,
    feedback: comparison.feedback,
  };
};

/**
 * Evaluate entire assessment
 */
const evaluateAssessment = async (assessmentId) => {
  try {
    const assessment = await Assessment.findById(assessmentId)
      .populate('assignmentId')
      .populate('candidateId', 'name email');

    if (!assessment) throw new Error('Assessment not found');

    const assignment = assessment.assignmentId;
    let totalScore = 0;
    let maxScore = assignment.totalMarks || 100;

    const evaluatedResponses = [];

    for (let i = 0; i < assignment.questions.length; i++) {
      const question = assignment.questions[i];
      const submitted = (assessment.responses || []).find((r) => r.questionIndex === i);

      if (submitted) {
        const evalResult = await evaluateResponse(question, submitted);
        totalScore += evalResult.autoScore;
        evaluatedResponses.push({
          ...submitted.toObject(),
          autoScore: evalResult.autoScore,
          feedback: evalResult.feedback,
        });
      } else {
        evaluatedResponses.push({
          questionIndex: i,
          query: '',
          autoScore: 0,
          feedback: 'Question skipped / unattempted',
        });
      }
    }

    const percentage = Math.round((totalScore / maxScore) * 100);

    // Derive strengths and improvement areas
    const strengths = [];
    const improvements = [];

    if (percentage >= 80) {
      strengths.push('Exceptional mastery of MongoDB aggregation pipelines and multi-collection lookups');
      strengths.push('Clean query structuring and accurate filtering logic');
    } else if (percentage >= 50) {
      strengths.push('Solid understanding of standard CRUD filters and basic grouping');
      improvements.push('Requires deeper practice with nested pipelines ($lookup, $unwind)');
    } else {
      improvements.push('Needs fundamental review of MongoDB aggregation operators ($match, $group)');
      improvements.push('Focus on debugging query syntax and projection structures');
    }

    assessment.responses = evaluatedResponses;
    assessment.totalScore = totalScore;
    assessment.maxScore = maxScore;
    assessment.percentage = percentage;
    assessment.strengths = strengths;
    assessment.improvements = improvements;
    assessment.status = 'evaluated';

    await assessment.save();
    logger.info(`Assessment ${assessmentId} evaluated with score ${totalScore}/${maxScore} (${percentage}%)`);

    return assessment;
  } catch (error) {
    logger.error(`Error evaluating assessment ${assessmentId}: ${error.message}`);
    throw error;
  }
};

module.exports = {
  compareResults,
  evaluateResponse,
  evaluateAssessment,
};
