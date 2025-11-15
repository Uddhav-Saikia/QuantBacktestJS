/**
 * Collection of trading strategy functions
 * Each strategy receives historical data and parameters
 * Returns: 'BUY', 'SELL', 'SHORT', 'COVER', or null
 */

/**
 * Simple Moving Average Crossover Strategy
 * Buys when short MA crosses above long MA, sells when it crosses below
 */
function movingAverageCrossover(data, params = {}) {
  const { shortPeriod = 10, longPeriod = 50 } = params;
  
  if (data.length < longPeriod) return null;
  
  const shortMA = calculateSMA(data, shortPeriod);
  const longMA = calculateSMA(data, longPeriod);
  
  const prevShortMA = calculateSMA(data.slice(0, -1), shortPeriod);
  const prevLongMA = calculateSMA(data.slice(0, -1), longPeriod);
  
  // Golden cross - buy signal
  if (prevShortMA <= prevLongMA && shortMA > longMA) {
    return 'BUY';
  }
  
  // Death cross - sell signal
  if (prevShortMA >= prevLongMA && shortMA < longMA) {
    return 'SELL';
  }
  
  return null;
}

/**
 * RSI Strategy
 * Buys when RSI is oversold, sells when overbought
 */
function rsiStrategy(data, params = {}) {
  const { period = 14, oversold = 30, overbought = 70 } = params;
  
  if (data.length < period + 1) return null;
  
  const rsi = calculateRSI(data, period);
  const prevRSI = calculateRSI(data.slice(0, -1), period);
  
  // Buy when RSI crosses above oversold threshold
  if (prevRSI <= oversold && rsi > oversold) {
    return 'BUY';
  }
  
  // Sell when RSI crosses above overbought threshold
  if (prevRSI < overbought && rsi >= overbought) {
    return 'SELL';
  }
  
  return null;
}

/**
 * Bollinger Bands Strategy
 * Buys when price touches lower band, sells when it touches upper band
 */
function bollingerBandsStrategy(data, params = {}) {
  const { period = 20, stdDev = 2 } = params;
  
  if (data.length < period) return null;
  
  const { upper, lower, middle } = calculateBollingerBands(data, period, stdDev);
  const currentPrice = data[data.length - 1].close;
  const prevPrice = data.length > 1 ? data[data.length - 2].close : currentPrice;
  
  // Buy when price touches or goes below lower band
  if (currentPrice <= lower && prevPrice > lower) {
    return 'BUY';
  }
  
  // Sell when price touches or goes above upper band
  if (currentPrice >= upper && prevPrice < upper) {
    return 'SELL';
  }
  
  return null;
}

/**
 * MACD Strategy
 * Buys when MACD line crosses above signal line, sells when it crosses below
 */
function macdStrategy(data, params = {}) {
  const { fastPeriod = 12, slowPeriod = 26, signalPeriod = 9 } = params;
  
  if (data.length < slowPeriod + signalPeriod) return null;
  
  const macd = calculateMACD(data, fastPeriod, slowPeriod, signalPeriod);
  const prevMACD = calculateMACD(data.slice(0, -1), fastPeriod, slowPeriod, signalPeriod);
  
  if (!macd || !prevMACD) return null;
  
  // Buy when MACD crosses above signal line
  if (prevMACD.histogram <= 0 && macd.histogram > 0) {
    return 'BUY';
  }
  
  // Sell when MACD crosses below signal line
  if (prevMACD.histogram >= 0 && macd.histogram < 0) {
    return 'SELL';
  }
  
  return null;
}

// ============ Helper Functions ============

function calculateSMA(data, period) {
  const slice = data.slice(-period);
  const sum = slice.reduce((acc, bar) => acc + bar.close, 0);
  return sum / period;
}

function calculateRSI(data, period) {
  if (data.length < period + 1) return 50;
  
  const changes = [];
  for (let i = data.length - period; i < data.length; i++) {
    changes.push(data[i].close - data[i - 1].close);
  }
  
  const gains = changes.map(c => c > 0 ? c : 0);
  const losses = changes.map(c => c < 0 ? Math.abs(c) : 0);
  
  const avgGain = gains.reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.reduce((a, b) => a + b, 0) / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  return rsi;
}

function calculateBollingerBands(data, period, stdDevMultiplier) {
  const sma = calculateSMA(data, period);
  const slice = data.slice(-period);
  
  const squaredDiffs = slice.map(bar => Math.pow(bar.close - sma, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
  const stdDev = Math.sqrt(variance);
  
  return {
    upper: sma + (stdDev * stdDevMultiplier),
    middle: sma,
    lower: sma - (stdDev * stdDevMultiplier)
  };
}

function calculateEMA(data, period) {
  const k = 2 / (period + 1);
  let ema = data[0].close;
  
  for (let i = 1; i < data.length; i++) {
    ema = (data[i].close * k) + (ema * (1 - k));
  }
  
  return ema;
}

function calculateMACD(data, fastPeriod, slowPeriod, signalPeriod) {
  if (data.length < slowPeriod) return null;
  
  const fastEMA = calculateEMA(data.slice(-fastPeriod), fastPeriod);
  const slowEMA = calculateEMA(data.slice(-slowPeriod), slowPeriod);
  
  const macdLine = fastEMA - slowEMA;
  
  // For simplicity, using SMA for signal line instead of EMA
  const recentMACDs = [];
  for (let i = Math.max(slowPeriod, data.length - signalPeriod); i < data.length; i++) {
    const fEMA = calculateEMA(data.slice(0, i + 1).slice(-fastPeriod), fastPeriod);
    const sEMA = calculateEMA(data.slice(0, i + 1).slice(-slowPeriod), slowPeriod);
    recentMACDs.push(fEMA - sEMA);
  }
  
  const signalLine = recentMACDs.reduce((a, b) => a + b, 0) / recentMACDs.length;
  const histogram = macdLine - signalLine;
  
  return { macdLine, signalLine, histogram };
}

// Export strategies
const strategies = {
  movingAverageCrossover,
  rsiStrategy,
  bollingerBandsStrategy,
  macdStrategy
};

module.exports = strategies;
