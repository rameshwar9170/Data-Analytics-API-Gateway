/**
 * Activity Log Model
 * Tracks candidate activity during assessments
 */

const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ['login', 'logout', 'query', 'error', 'submission', 'navigation'],
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
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
  }
);

// Compound index for efficient queries
activityLogSchema.index({ candidateId: 1, assessmentId: 1, timestamp: -1 });
activityLogSchema.index({ assessmentId: 1, type: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
