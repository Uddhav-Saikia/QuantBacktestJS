const mongoose = require('mongoose');

const ohlcvSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  open: {
    type: Number,
    required: true
  },
  high: {
    type: Number,
    required: true
  },
  low: {
    type: Number,
    required: true
  },
  close: {
    type: Number,
    required: true
  },
  volume: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
ohlcvSchema.index({ symbol: 1, timestamp: 1 }, { unique: true });

module.exports = mongoose.model('OHLCV', ohlcvSchema);
