/**
 * Assessment Model
 * Tracks a candidate's assessment session and responses
 */

const mongoose = require('mongoose');
const { generateToken } = require('../utils/helpers');

const responseSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true },
    query: { type: String, default: '' },
    result: { type: mongoose.Schema.Types.Mixed, default: null },
    submittedAt: { type: Date, default: null },
    autoScore: { type: Number, default: null },
    manualScore: { type: Number, default: null },
    feedback: { type: String, default: '' },
  },
  { _id: false }
);

const assessmentSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Candidate reference is required'],
    },
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: [true, 'Assignment reference is required'],
    },
    datasetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dataset',
      required: [true, 'Dataset reference is required'],
    },
    status: {
      type: String,
      enum: ['assigned', 'in_progress', 'submitted', 'evaluated'],
      default: 'assigned',
    },
    startTime: { type: Date, default: null },
    endTime: { type: Date, default: null },
    submittedAt: { type: Date, default: null },

    // Candidate responses
    responses: [responseSchema],

    // Scoring
    totalScore: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    strengths: [{ type: String }],
    improvements: [{ type: String }],

    // Database access for the candidate
    accessToken: {
      type: String,
      unique: true,
      default: () => generateToken(32),
    },
    accessExpiry: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
assessmentSchema.index({ candidateId: 1 });
assessmentSchema.index({ assignmentId: 1 });
assessmentSchema.index({ status: 1 });
assessmentSchema.index({ createdBy: 1 });
assessmentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Assessment', assessmentSchema);
