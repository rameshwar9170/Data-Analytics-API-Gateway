/**
 * Dataset Model
 * Represents a generated dataset with industry-specific data
 */

const mongoose = require('mongoose');

const collectionInfoSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    recordCount: { type: Number, default: 0 },
    targetCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'generating', 'completed', 'failed'],
      default: 'pending',
    },
  },
  { _id: false }
);

const generationLogSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    level: { type: String, enum: ['info', 'warn', 'error'], default: 'info' },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const relationshipSchema = new mongoose.Schema(
  {
    from: { type: String, required: true },
    to: { type: String, required: true },
    field: { type: String, required: true },
    type: { type: String, enum: ['one-to-many', 'many-to-many', 'one-to-one'], default: 'one-to-many' },
    description: { type: String },
  },
  { _id: false }
);

const datasetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Dataset name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    industry: {
      type: String,
      required: [true, 'Industry is required'],
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: '',
    },
    difficulty: {
      type: String,
      default: 'intermediate',
      lowercase: true,
    },
    databaseName: {
      type: String,
      required: true,
      unique: true,
    },

    // Collections metadata
    collections: [collectionInfoSchema],
    totalRecords: { type: Number, default: 0 },
    targetTotalRecords: { type: Number, default: 0 },

    // Data configuration
    dateRange: {
      start: { type: Date, default: () => new Date('2022-01-01') },
      end: { type: Date, default: () => new Date() },
    },
    currency: { type: String, default: 'INR' },
    country: { type: String, default: 'India' },
    dataComplexity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    qualityIssuePercentage: {
      type: Number,
      default: 5,
      min: 0,
      max: 30,
    },
    relationshipComplexity: {
      type: String,
      default: 'moderate',
      lowercase: true,
    },

    // Generation tracking
    generationStatus: {
      type: String,
      enum: ['pending', 'generating', 'completed', 'failed', 'cancelled'],
      default: 'pending',
    },
    generationProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    generationLog: [
      {
        message: { type: String, default: '' },
        level: { type: String, default: 'info' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    generationStartedAt: { type: Date },
    generationCompletedAt: { type: Date },

    // Schema and relationships
    schemaDefinition: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    relationships: [relationshipSchema],
    qualitySummary: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    seed: {
      type: Number,
      default: () => Math.floor(Math.random() * 1000000),
    },

    // Ownership
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
datasetSchema.index({ industry: 1 });
datasetSchema.index({ generationStatus: 1 });
datasetSchema.index({ createdBy: 1 });
datasetSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Dataset', datasetSchema);
