const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add timeout handling for serverless (50 seconds for Vercel Pro)
app.use((req, res, next) => {
  req.setTimeout(50000);
  res.setTimeout(50000);
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// MongoDB Connection with connection pooling for serverless
let dbConnection = null;

const connectDB = async () => {
  try {
    // Reuse existing connection in serverless environment
    if (dbConnection && dbConnection.connection.readyState === 1) {
      console.log('Reusing existing MongoDB connection');
      return dbConnection;
    }

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    dbConnection = await mongoose.connect(mongoUri, {
      maxPoolSize: 5,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4 // Use IPv4, skip trying IPv6
    });
    console.log('MongoDB connected successfully');
    return dbConnection;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    // Don't exit process in serverless environment
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

connectDB();

// Routes
const ohlcvRoutes = require('./routes/ohlcv');
const strategyRoutes = require('./routes/strategy');
const backtestRoutes = require('./routes/backtest');

app.use('/api/ohlcv', ohlcvRoutes);
app.use('/api/strategies', strategyRoutes);
app.use('/api/backtest', backtestRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Algorithmic Trading Platform API',
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!', 
    message: err.message 
  });
});

// Only start server if not in serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
