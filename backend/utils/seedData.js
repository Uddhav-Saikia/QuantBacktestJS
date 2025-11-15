const mongoose = require('mongoose');
const dotenv = require('dotenv');
const OHLCV = require('../models/OHLCV');
const Strategy = require('../models/Strategy');

dotenv.config();

/**
 * Generate synthetic OHLCV data for testing
 * This creates realistic-looking price data with trend and volatility
 */
function generateOHLCVData(symbol, startDate, days, startPrice = 100) {
  const data = [];
  let currentPrice = startPrice;
  const date = new Date(startDate);
  
  for (let i = 0; i < days; i++) {
    // Random walk with drift
    const drift = 0.0001; // Slight upward bias
    const volatility = 0.02; // 2% daily volatility
    const randomChange = (Math.random() - 0.5 + drift) * volatility;
    
    currentPrice = currentPrice * (1 + randomChange);
    
    // Generate OHLC from close price
    const open = currentPrice * (1 + (Math.random() - 0.5) * 0.01);
    const close = currentPrice;
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    const volume = Math.floor(Math.random() * 10000000) + 1000000;
    
    data.push({
      symbol,
      timestamp: new Date(date),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume
    });
    
    // Move to next day
    date.setDate(date.getDate() + 1);
  }
  
  return data;
}

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
    
    // Clear existing data
    console.log('Clearing existing OHLCV data...');
    await OHLCV.deleteMany({});
    console.log('Clearing existing strategies...');
    await Strategy.deleteMany({});
    
    // Generate data for multiple symbols
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'];
    const startDate = new Date('2022-01-01');
    const days = 730; // 2 years of data
    
    for (const symbol of symbols) {
      console.log(`Generating data for ${symbol}...`);
      const startPrice = 100 + Math.random() * 400; // Random start price between 100-500
      const data = generateOHLCVData(symbol, startDate, days, startPrice);
      
      console.log(`Inserting ${data.length} records for ${symbol}...`);
      await OHLCV.insertMany(data);
      console.log(`✓ Completed ${symbol}`);
    }
    
    // Create default strategies
    console.log('\nCreating default strategies...');
    const defaultStrategies = [
      {
        name: 'Moving Average Crossover',
        description: 'Buy when short MA crosses above long MA (golden cross), sell when it crosses below (death cross)',
        code: `function movingAverageCrossover(data, params = {}) {
  const { shortPeriod = 10, longPeriod = 50 } = params;
  
  if (data.length < longPeriod) return null;
  
  const calculateSMA = (data, period) => {
    const slice = data.slice(-period);
    return slice.reduce((acc, bar) => acc + bar.close, 0) / period;
  };
  
  const shortMA = calculateSMA(data, shortPeriod);
  const longMA = calculateSMA(data, longPeriod);
  const prevShortMA = calculateSMA(data.slice(0, -1), shortPeriod);
  const prevLongMA = calculateSMA(data.slice(0, -1), longPeriod);
  
  if (prevShortMA <= prevLongMA && shortMA > longMA) return 'BUY';
  if (prevShortMA >= prevLongMA && shortMA < longMA) return 'SELL';
  
  return null;
}`,
        defaultParams: { shortPeriod: 10, longPeriod: 50 }
      },
      {
        name: 'RSI Strategy',
        description: 'Buy when RSI crosses above oversold level, sell when it crosses above overbought level',
        code: `function rsiStrategy(data, params = {}) {
  const { period = 14, oversold = 30, overbought = 70 } = params;
  
  if (data.length < period + 1) return null;
  
  const calculateRSI = (data, period) => {
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
    return 100 - (100 / (1 + rs));
  };
  
  const rsi = calculateRSI(data, period);
  const prevRSI = calculateRSI(data.slice(0, -1), period);
  
  if (prevRSI <= oversold && rsi > oversold) return 'BUY';
  if (prevRSI < overbought && rsi >= overbought) return 'SELL';
  
  return null;
}`,
        defaultParams: { period: 14, oversold: 30, overbought: 70 }
      },
      {
        name: 'Bollinger Bands',
        description: 'Mean reversion strategy - buy at lower band, sell at upper band',
        code: `function bollingerBandsStrategy(data, params = {}) {
  const { period = 20, stdDev = 2 } = params;
  
  if (data.length < period) return null;
  
  const calculateSMA = (data, period) => {
    const slice = data.slice(-period);
    return slice.reduce((acc, bar) => acc + bar.close, 0) / period;
  };
  
  const sma = calculateSMA(data, period);
  const slice = data.slice(-period);
  const variance = slice.reduce((acc, bar) => acc + Math.pow(bar.close - sma, 2), 0) / period;
  const stdDeviation = Math.sqrt(variance);
  
  const upper = sma + (stdDeviation * stdDev);
  const lower = sma - (stdDeviation * stdDev);
  
  const currentPrice = data[data.length - 1].close;
  const prevPrice = data.length > 1 ? data[data.length - 2].close : currentPrice;
  
  if (currentPrice <= lower && prevPrice > lower) return 'BUY';
  if (currentPrice >= upper && prevPrice < upper) return 'SELL';
  
  return null;
}`,
        defaultParams: { period: 20, stdDev: 2 }
      },
      {
        name: 'MACD',
        description: 'Momentum strategy based on MACD line crossing signal line',
        code: `function macdStrategy(data, params = {}) {
  const { fastPeriod = 12, slowPeriod = 26, signalPeriod = 9 } = params;
  
  if (data.length < slowPeriod + signalPeriod) return null;
  
  const calculateEMA = (data, period) => {
    const k = 2 / (period + 1);
    let ema = data[0].close;
    for (let i = 1; i < data.length; i++) {
      ema = (data[i].close * k) + (ema * (1 - k));
    }
    return ema;
  };
  
  const fastEMA = calculateEMA(data.slice(-fastPeriod), fastPeriod);
  const slowEMA = calculateEMA(data.slice(-slowPeriod), slowPeriod);
  const macdLine = fastEMA - slowEMA;
  
  const recentMACDs = [];
  for (let i = Math.max(slowPeriod, data.length - signalPeriod); i < data.length; i++) {
    const fEMA = calculateEMA(data.slice(0, i + 1).slice(-fastPeriod), fastPeriod);
    const sEMA = calculateEMA(data.slice(0, i + 1).slice(-slowPeriod), slowPeriod);
    recentMACDs.push(fEMA - sEMA);
  }
  
  const signalLine = recentMACDs.reduce((a, b) => a + b, 0) / recentMACDs.length;
  const histogram = macdLine - signalLine;
  
  const prevFastEMA = calculateEMA(data.slice(0, -1).slice(-fastPeriod), fastPeriod);
  const prevSlowEMA = calculateEMA(data.slice(0, -1).slice(-slowPeriod), slowPeriod);
  const prevHistogram = (prevFastEMA - prevSlowEMA) - signalLine;
  
  if (prevHistogram <= 0 && histogram > 0) return 'BUY';
  if (prevHistogram >= 0 && histogram < 0) return 'SELL';
  
  return null;
}`,
        defaultParams: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 }
      }
    ];
    
    await Strategy.insertMany(defaultStrategies);
    console.log(`✓ Created ${defaultStrategies.length} default strategies`);
    
    console.log('\n✓ Database seeding completed successfully!');
    console.log(`Total symbols: ${symbols.length}`);
    console.log(`Days per symbol: ${days}`);
    console.log(`Total records: ${symbols.length * days}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeder
seedDatabase();
