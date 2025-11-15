const express = require('express');
const router = express.Router();
const BacktestResult = require('../models/BacktestResult');
const OHLCV = require('../models/OHLCV');
const Strategy = require('../models/Strategy');
const BacktestEngine = require('../engine/BacktestEngine');
const defaultStrategies = require('../strategies/defaultStrategies');

// Run a backtest
router.post('/run', async (req, res) => {
  try {
    const {
      strategyId,
      strategyType,
      symbol,
      startDate,
      endDate,
      initialCapital = 10000,
      parameters = {}
    } = req.body;
    
    // Validate inputs
    if (!symbol || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Symbol, startDate, and endDate are required'
      });
    }
    
    // Get OHLCV data
    const ohlcvData = await OHLCV.find({
      symbol: symbol.toUpperCase(),
      timestamp: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).sort({ timestamp: 1 });
    
    if (ohlcvData.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No historical data found for the specified symbol and date range'
      });
    }
    
    // Get strategy
    let strategyFunction;
    let strategyName;
    let actualStrategyId = strategyId;
    
    if (strategyType && defaultStrategies[strategyType]) {
      // Use a default strategy
      strategyFunction = defaultStrategies[strategyType];
      // Convert camelCase to readable name
      strategyName = strategyType
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
      actualStrategyId = null; // Default strategies don't have an ID
    } else if (strategyId) {
      // Use a custom strategy from database
      const strategy = await Strategy.findById(strategyId);
      if (!strategy) {
        return res.status(404).json({
          success: false,
          error: 'Strategy not found'
        });
      }
      
      strategyName = strategy.name;
      // Evaluate the strategy code (in production, use a sandbox)
      try {
        strategyFunction = eval(`(${strategy.code})`);
      } catch (evalError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid strategy code: ' + evalError.message
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: 'Either strategyType or strategyId is required'
      });
    }
    
    // Run backtest
    const engine = new BacktestEngine(ohlcvData, initialCapital);
    const results = await engine.execute(strategyFunction, parameters);
    
    // Save results to database
    const backtestResult = new BacktestResult({
      strategyId: actualStrategyId,
      strategyName,
      symbol: symbol.toUpperCase(),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      initialCapital,
      finalCapital: results.finalCapital,
      totalReturn: results.totalReturn,
      totalReturnPercent: results.totalReturnPercent,
      sharpeRatio: results.sharpeRatio,
      maxDrawdown: results.maxDrawdown,
      maxDrawdownPercent: results.maxDrawdownPercent,
      winRate: results.winRate,
      profitFactor: results.profitFactor,
      totalTrades: results.totalTrades,
      winningTrades: results.winningTrades,
      losingTrades: results.losingTrades,
      averageWin: results.averageWin,
      averageLoss: results.averageLoss,
      largestWin: results.largestWin,
      largestLoss: results.largestLoss,
      equityCurve: results.equityCurve,
      trades: results.trades,
      executionTime: results.executionTime,
      parameters
    });
    
    await backtestResult.save();
    
    res.json({
      success: true,
      data: backtestResult
    });
  } catch (error) {
    console.error('Backtest error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all backtest results
router.get('/results', async (req, res) => {
  try {
    const { limit = 20, sortBy = 'executedAt', order = 'desc' } = req.query;
    
    const results = await BacktestResult.find()
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .limit(parseInt(limit))
      .select('-equityCurve -trades'); // Exclude large arrays for list view
    
    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get a specific backtest result
router.get('/results/:id', async (req, res) => {
  try {
    const result = await BacktestResult.findById(req.params.id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Backtest result not found'
      });
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete a backtest result
router.delete('/results/:id', async (req, res) => {
  try {
    const result = await BacktestResult.findByIdAndDelete(req.params.id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Backtest result not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Backtest result deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get available default strategies
router.get('/strategies/default', (req, res) => {
  const strategies = Object.keys(defaultStrategies).map(key => ({
    type: key,
    name: key.replace(/([A-Z])/g, ' $1').trim(),
    description: getStrategyDescription(key)
  }));
  
  res.json({
    success: true,
    data: strategies
  });
});

function getStrategyDescription(strategyType) {
  const descriptions = {
    movingAverageCrossover: 'Buys when short MA crosses above long MA, sells when it crosses below',
    rsiStrategy: 'Buys when RSI is oversold, sells when overbought',
    bollingerBandsStrategy: 'Buys when price touches lower band, sells when it touches upper band',
    macdStrategy: 'Buys when MACD line crosses above signal line, sells when it crosses below'
  };
  
  return descriptions[strategyType] || 'No description available';
}

module.exports = router;
