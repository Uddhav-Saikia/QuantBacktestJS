const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  entryDate: Date,
  exitDate: Date,
  entryPrice: Number,
  exitPrice: Number,
  quantity: Number,
  side: String, // 'long' or 'short'
  pnl: Number,
  pnlPercent: Number
}, { _id: false });

const backtestResultSchema = new mongoose.Schema({
  strategyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Strategy',
    required: false  // Make optional since default strategies don't have an ID
  },
  strategyName: String,
  symbol: String,
  startDate: Date,
  endDate: Date,
  initialCapital: {
    type: Number,
    default: 10000
  },
  finalCapital: Number,
  
  // Performance Metrics
  totalReturn: Number,
  totalReturnPercent: Number,
  sharpeRatio: Number,
  maxDrawdown: Number,
  maxDrawdownPercent: Number,
  winRate: Number,
  profitFactor: Number,
  
  // Trade Statistics
  totalTrades: Number,
  winningTrades: Number,
  losingTrades: Number,
  averageWin: Number,
  averageLoss: Number,
  largestWin: Number,
  largestLoss: Number,
  
  // Equity Curve Data
  equityCurve: [{
    date: Date,
    equity: Number,
    drawdown: Number
  }],
  
  // Trade History
  trades: [tradeSchema],
  
  // Execution Details
  executedAt: {
    type: Date,
    default: Date.now
  },
  executionTime: Number, // milliseconds
  
  // Strategy Parameters Used
  parameters: mongoose.Schema.Types.Mixed
});

module.exports = mongoose.model('BacktestResult', backtestResultSchema);
