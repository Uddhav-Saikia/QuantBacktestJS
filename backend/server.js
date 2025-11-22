const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

const app = express();

// Security: Helmet - sets various HTTP headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Rate limiting - prevents brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use('/api/', limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login/register attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Body parsing middleware
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
let isConnecting = false;

const connectDB = async () => {
  try {
    // Reuse existing connection in serverless environment
    if (dbConnection && dbConnection.connection.readyState === 1) {
      console.log('Reusing existing MongoDB connection');
      return dbConnection;
    }

    // Prevent multiple simultaneous connection attempts
    if (isConnecting) {
      console.log('Connection attempt already in progress, waiting...');
      // Wait for the existing connection attempt
      while (isConnecting) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return dbConnection;
    }

    isConnecting = true;

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    console.log('Connecting to MongoDB...');
    dbConnection = await mongoose.connect(mongoUri, {
      maxPoolSize: 5,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4 // Use IPv4, skip trying IPv6
    });
    console.log('MongoDB connected successfully');
    isConnecting = false;
    return dbConnection;
  } catch (err) {
    isConnecting = false;
    console.error('MongoDB connection error:', err.message);
    // Don't exit process in serverless environment
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
    throw err; // Re-throw to handle in routes
  }
};

// Store connectDB in app.locals for access in serverless function
app.locals.connectDB = connectDB;

// Connect for local development
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  connectDB();
}

// Routes
const authRoutes = require('./routes/auth');
const ohlcvRoutes = require('./routes/ohlcv');
const strategyRoutes = require('./routes/strategy');
const backtestRoutes = require('./routes/backtest');

// Public routes (with stricter rate limiting for auth)
app.use('/api/auth', authLimiter, authRoutes);

// Protected routes (require authentication)
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
        nodeEnv: process.env.NODE_ENV
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
