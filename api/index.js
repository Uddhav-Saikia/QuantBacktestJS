const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '../backend/.env' });

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB Connection with caching for serverless
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    console.log('Using cached database connection');
    return cachedDb;
  }

  console.log('Creating new database connection');
  
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    cachedDb = await mongoose.connect(mongoUri, {
      maxPoolSize: 5,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4
    });
    
    console.log('MongoDB connected successfully');
    return cachedDb;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Import models
require('../backend/models/OHLCV');
require('../backend/models/Strategy');
require('../backend/models/BacktestResult');

// Import routes
const ohlcvRoutes = require('../backend/routes/ohlcv');
const strategyRoutes = require('../backend/routes/strategy');
const backtestRoutes = require('../backend/routes/backtest');

app.use('/api/ohlcv', ohlcvRoutes);
app.use('/api/strategies', strategyRoutes);
app.use('/api/backtest', backtestRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const mongoStatus = mongoose.connection.readyState;
    const statusMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    res.json({ 
      status: mongoStatus === 1 ? 'OK' : 'WARNING',
      message: 'Server is running',
      mongodb: statusMap[mongoStatus] || 'unknown',
      timestamp: new Date().toISOString(),
      env: {
        hasMongoUri: !!process.env.MONGODB_URI,
        nodeEnv: process.env.NODE_ENV || 'not set'
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'ERROR',
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Root endpoint
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Algorithmic Trading Platform API',
    version: '1.0.0'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Export serverless function
module.exports = async (req, res) => {
  try {
    // Ensure database is connected
    await connectToDatabase();
    
    // Handle the request
    return app(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).json({
      error: 'Database connection failed',
      message: error.message,
      details: 'Check Vercel environment variables'
    });
  }
};
