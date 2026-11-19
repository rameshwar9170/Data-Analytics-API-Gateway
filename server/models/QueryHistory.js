/**
 * Query History Model
 * Tracks all queries executed by candidates
 */

const mongoose = require('mongoose');

const queryHistorySchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment',
      required: true,
      index: true,
    },
    query: {
      type: String,
      required: true,
    },
    queryType: {
      type: String,
      enum: ['find', 'aggregate', 'count', 'countDocuments', 'distinct'],
      required: true,
    },
    database: {
      type: String,
      required: true,
    },
    collection: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['success', 'error', 'timeout'],
      default: 'success',
    },
    executionTime: {
      type: Number, // milliseconds
      default: 0,
    },
    resultCount: {
      type: Number,
      default: 0,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    isSaved: {
      type: Boolean,
      default: false,
    },
    savedLabel: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
    suppressReservedKeysWarning: true,
  }
);

// Compound indexes
queryHistorySchema.index({ candidateId: 1, assessmentId: 1, timestamp: -1 });
queryHistorySchema.index({ candidateId: 1, isSaved: 1 });
queryHistorySchema.index({ assessmentId: 1, status: 1 });

module.exports = mongoose.model('QueryHistory', queryHistorySchema);
