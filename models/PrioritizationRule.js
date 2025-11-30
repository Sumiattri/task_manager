const mongoose = require('mongoose');

const prioritizationRuleSchema = new mongoose.Schema({
  deadlineWeight: {
    type: Number,
    default: 0.5,
    min: 0,
    max: 1
  },
  importanceWeight: {
    type: Number,
    default: 0.5,
    min: 0,
    max: 1
  },
  importanceLevels: {
    low: { type: Number, default: 1 },
    medium: { type: Number, default: 2 },
    high: { type: Number, default: 3 },
    critical: { type: Number, default: 4 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  optimisticConcurrency: true  // Enable optimistic locking
});

module.exports = mongoose.model('PrioritizationRule', prioritizationRuleSchema);

