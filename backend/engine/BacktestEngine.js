const { std, mean } = require('mathjs');

class BacktestEngine {
  constructor(ohlcvData, initialCapital = 10000) {
    this.ohlcvData = ohlcvData;
    this.initialCapital = initialCapital;
    this.capital = initialCapital;
    this.position = null;
    this.trades = [];
    this.equityCurve = [];
  }

  /**
   * Execute a trading strategy on historical data
   * @param {Function} strategyFunction - Strategy function that returns signals
   * @param {Object} parameters - Strategy parameters
   */
  async execute(strategyFunction, parameters = {}) {
    const startTime = Date.now();
    
    // Initialize equity curve
    this.equityCurve = [];
    this.trades = [];
    this.position = null;
    this.capital = this.initialCapital;

    // Run through each bar
    for (let i = 0; i < this.ohlcvData.length; i++) {
      const currentBar = this.ohlcvData[i];
      const historicalData = this.ohlcvData.slice(0, i + 1);
      
      // Get signal from strategy
      const signal = strategyFunction(historicalData, parameters);
      
      // Execute trades based on signal
      if (signal === 'BUY' && !this.position) {
        this.openPosition('long', currentBar);
      } else if (signal === 'SELL' && this.position) {
        this.closePosition(currentBar);
      } else if (signal === 'SHORT' && !this.position) {
        this.openPosition('short', currentBar);
      } else if (signal === 'COVER' && this.position && this.position.side === 'short') {
        this.closePosition(currentBar);
      }
      
      // Calculate current equity
      let currentEquity = this.capital;
      if (this.position) {
        const unrealizedPnL = this.calculateUnrealizedPnL(currentBar.close);
        currentEquity += unrealizedPnL;
      }
      
      // Record equity
      this.equityCurve.push({
        date: currentBar.timestamp,
        equity: currentEquity,
        drawdown: 0 // Will be calculated later
      });
    }
    
    // Close any open position at the end
    if (this.position) {
      this.closePosition(this.ohlcvData[this.ohlcvData.length - 1]);
    }

    // Calculate drawdowns
    this.calculateDrawdowns();
    
    // Calculate performance metrics
    const metrics = this.calculateMetrics();
    
    const executionTime = Date.now() - startTime;
    
    return {
      ...metrics,
      equityCurve: this.equityCurve,
      trades: this.trades,
      executionTime
    };
  }

  openPosition(side, bar) {
    const quantity = Math.floor(this.capital / bar.close);
    
    if (quantity <= 0) return;
    
    this.position = {
      side,
      entryPrice: bar.close,
      entryDate: bar.timestamp,
      quantity
    };
  }

  closePosition(bar) {
    if (!this.position) return;
    
    const exitPrice = bar.close;
    let pnl = 0;
    
    if (this.position.side === 'long') {
      pnl = (exitPrice - this.position.entryPrice) * this.position.quantity;
    } else if (this.position.side === 'short') {
      pnl = (this.position.entryPrice - exitPrice) * this.position.quantity;
    }
    
    const pnlPercent = (pnl / (this.position.entryPrice * this.position.quantity)) * 100;
    
    this.capital += pnl;
    
    this.trades.push({
      entryDate: this.position.entryDate,
      exitDate: bar.timestamp,
      entryPrice: this.position.entryPrice,
      exitPrice,
      quantity: this.position.quantity,
      side: this.position.side,
      pnl,
      pnlPercent
    });
    
    this.position = null;
  }

  calculateUnrealizedPnL(currentPrice) {
    if (!this.position) return 0;
    
    if (this.position.side === 'long') {
      return (currentPrice - this.position.entryPrice) * this.position.quantity;
    } else if (this.position.side === 'short') {
      return (this.position.entryPrice - currentPrice) * this.position.quantity;
    }
    
    return 0;
  }

  calculateDrawdowns() {
    let peak = this.initialCapital;
    
    for (let point of this.equityCurve) {
      if (point.equity > peak) {
        peak = point.equity;
      }
      point.drawdown = ((peak - point.equity) / peak) * 100;
    }
  }

  calculateMetrics() {
    const finalCapital = this.capital;
    const totalReturn = finalCapital - this.initialCapital;
    const totalReturnPercent = (totalReturn / this.initialCapital) * 100;
    
    // Trade statistics
    const totalTrades = this.trades.length;
    const winningTrades = this.trades.filter(t => t.pnl > 0);
    const losingTrades = this.trades.filter(t => t.pnl < 0);
    
    const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
    
    const totalWinAmount = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const totalLossAmount = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
    
    const averageWin = winningTrades.length > 0 ? totalWinAmount / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? totalLossAmount / losingTrades.length : 0;
    
    const profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : 0;
    
    const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnl)) : 0;
    const largestLoss = losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.pnl)) : 0;
    
    // Sharpe Ratio calculation
    const returns = [];
    for (let i = 1; i < this.equityCurve.length; i++) {
      const dailyReturn = (this.equityCurve[i].equity - this.equityCurve[i - 1].equity) / this.equityCurve[i - 1].equity;
      returns.push(dailyReturn);
    }
    
    const meanReturn = returns.length > 0 ? mean(returns) : 0;
    const stdReturn = returns.length > 1 ? std(returns) : 0;
    const sharpeRatio = stdReturn > 0 ? (meanReturn / stdReturn) * Math.sqrt(252) : 0; // Annualized
    
    // Maximum Drawdown
    const maxDrawdown = this.equityCurve.length > 0 ? Math.max(...this.equityCurve.map(p => p.drawdown)) : 0;
    const maxDrawdownAmount = (maxDrawdown / 100) * this.equityCurve.reduce((max, p) => Math.max(max, p.equity), 0);
    
    return {
      initialCapital: this.initialCapital,
      finalCapital,
      totalReturn,
      totalReturnPercent,
      sharpeRatio,
      maxDrawdown,
      maxDrawdownPercent: maxDrawdown,
      winRate,
      profitFactor,
      totalTrades,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      averageWin,
      averageLoss,
      largestWin,
      largestLoss
    };
  }
}

module.exports = BacktestEngine;
