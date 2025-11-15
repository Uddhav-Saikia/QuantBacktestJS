const express = require('express');
const router = express.Router();
const OHLCV = require('../models/OHLCV');

// Get OHLCV data for a symbol within a date range
router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { startDate, endDate, limit = 1000 } = req.query;
    
    let query = { symbol: symbol.toUpperCase() };
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    const data = await OHLCV.find(query)
      .sort({ timestamp: 1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get available symbols
router.get('/', async (req, res) => {
  try {
    const symbols = await OHLCV.distinct('symbol');
    res.json({
      success: true,
      symbols
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add OHLCV data (for seeding/testing)
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    const result = await OHLCV.insertMany(data, { ordered: false });
    
    res.status(201).json({
      success: true,
      inserted: result.length
    });
  } catch (error) {
    // Handle duplicate key errors gracefully
    if (error.code === 11000) {
      res.status(200).json({
        success: true,
        message: 'Some data already exists, inserted new records only'
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
});

module.exports = router;
