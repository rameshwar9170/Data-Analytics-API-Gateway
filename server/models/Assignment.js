/**
 * Assignment Model
 * Represents a set of assessment questions tied to a dataset
 */

const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    scenario: { type: String, default: '' },
    task: { type: String, required: true },
    collections: [{ type: String }],
    expectedOutput: { type: String, default: '' },
    difficulty: {
      type: String,
      default: 'intermediate',
    },
    marks: { type: Number, required: true, min: 1 },
    timeEstimate: { type: mongoose.Schema.Types.Mixed, default: '10 mins' },
    evaluationCriteria: { type: String, default: '' },
    hiddenExpectedResult: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    validationLogic: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { _id: true }
);

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Assignment title is required'],
      trim: true,
      maxlength: [300, 'Title cannot exceed 300 characters'],
    },
    description: {
      type: String,
      default: '',
    },
    datasetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dataset',
      required: [true, 'Dataset reference is required'],
    },
    difficulty: {
      type: String,
      default: 'Intermediate',
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    totalMarks: {
      type: Number,
      default: 0,
    },
    timeLimit: {
      type: Number,
      default: 120, // minutes
    },
    questions: [questionSchema],
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
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

// Auto-compute totals before saving
assignmentSchema.pre('save', function (next) {
  if (this.questions && this.questions.length > 0) {
    this.totalQuestions = this.questions.length;
    this.totalMarks = this.questions.reduce((sum, q) => sum + (q.marks || 0), 0);
  }
  next();
});

// Indexes
assignmentSchema.index({ datasetId: 1 });
assignmentSchema.index({ status: 1 });
assignmentSchema.index({ createdBy: 1 });
assignmentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
