const { body, param, query, validationResult } = require('express-validator');

// Middleware to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  
  next();
};

// User registration validation
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores and hyphens'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  validate
];

// Login validation
const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  validate
];

// Backtest validation
const backtestValidation = [
  body('strategyId')
    .optional()
    .isMongoId()
    .withMessage('Invalid strategy ID'),
  
  body('symbol')
    .trim()
    .notEmpty()
    .withMessage('Symbol is required')
    .isLength({ min: 1, max: 10 })
    .withMessage('Symbol must be 1-10 characters')
    .matches(/^[A-Z]+$/)
    .withMessage('Symbol must be uppercase letters only'),
  
  body('startDate')
    .isISO8601()
    .withMessage('Invalid start date. Use ISO 8601 format'),
  
  body('endDate')
    .isISO8601()
    .withMessage('Invalid end date. Use ISO 8601 format')
    .custom((endDate, { req }) => {
      if (new Date(endDate) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  
  body('initialCapital')
    .isFloat({ min: 100, max: 100000000 })
    .withMessage('Initial capital must be between $100 and $100,000,000'),
  
  body('strategyCode')
    .optional()
    .isString()
    .withMessage('Strategy code must be a string')
    .isLength({ max: 50000 })
    .withMessage('Strategy code too large (max 50KB)'),
  
  body('parameters')
    .optional()
    .isObject()
    .withMessage('Parameters must be an object'),
  
  validate
];

// Strategy validation
const strategyValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Strategy name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Strategy name must be 3-100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description too long (max 1000 characters)'),
  
  body('code')
    .notEmpty()
    .withMessage('Strategy code is required')
    .isString()
    .withMessage('Code must be a string')
    .isLength({ max: 50000 })
    .withMessage('Code too large (max 50KB)'),
  
  body('parameters')
    .optional()
    .isObject()
    .withMessage('Parameters must be an object'),
  
  validate
];

// OHLCV query validation
const ohlcvQueryValidation = [
  query('symbol')
    .optional()
    .trim()
    .matches(/^[A-Z]+$/)
    .withMessage('Symbol must be uppercase letters only'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Limit must be 1-10000')
    .toInt(),
  
  query('skip')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Skip must be non-negative')
    .toInt(),
  
  validate
];

// ID parameter validation
const mongoIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  
  validate
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  backtestValidation,
  strategyValidation,
  ohlcvQueryValidation,
  mongoIdValidation
};
