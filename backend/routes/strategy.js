const express = require('express');
const router = express.Router();
const Strategy = require('../models/Strategy');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { strategyValidation, mongoIdValidation } = require('../middleware/validators');

// Get all strategies
router.get('/', optionalAuth, async (req, res) => {
  try {
    const strategies = await Strategy.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: strategies.length,
      data: strategies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get a single strategy
router.get('/:id', optionalAuth, mongoIdValidation, async (req, res) => {
  try {
    const strategy = await Strategy.findById(req.params.id);
    
    if (!strategy) {
      return res.status(404).json({
        success: false,
        error: 'Strategy not found'
      });
    }
    
    res.json({
      success: true,
      data: strategy
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create a new strategy (requires authentication)
router.post('/', authenticate, strategyValidation, async (req, res) => {
  try {
    const { name, description, code, parameters } = req.body;
    
    const strategy = new Strategy({
      name,
      description,
      code,
      parameters
    });
    
    await strategy.save();
    
    res.status(201).json({
      success: true,
      data: strategy
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update a strategy (requires authentication)
router.put('/:id', authenticate, mongoIdValidation, strategyValidation, async (req, res) => {
  try {
    const { name, description, code, parameters } = req.body;
    
    const strategy = await Strategy.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        code,
        parameters,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    if (!strategy) {
      return res.status(404).json({
        success: false,
        error: 'Strategy not found'
      });
    }
    
    res.json({
      success: true,
      data: strategy
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete a strategy (requires authentication)
router.delete('/:id', authenticate, mongoIdValidation, async (req, res) => {
  try {
    const strategy = await Strategy.findByIdAndDelete(req.params.id);
    
    if (!strategy) {
      return res.status(404).json({
        success: false,
        error: 'Strategy not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Strategy deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
