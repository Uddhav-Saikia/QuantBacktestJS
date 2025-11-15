import React, { useState, useEffect } from 'react';
import { runBacktest, getSymbols, getStrategies, getDefaultStrategies } from '../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

function Backtest() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [symbols, setSymbols] = useState([]);
  const [customStrategies, setCustomStrategies] = useState([]);
  const [defaultStrategies, setDefaultStrategies] = useState([]);
  const [formData, setFormData] = useState({
    strategyType: 'default',
    selectedDefaultStrategy: '',
    selectedCustomStrategy: '',
    symbol: '',
    startDate: '2022-01-01',
    endDate: '2023-12-31',
    initialCapital: 10000,
    parameters: '{}',
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [symbolsRes, strategiesRes, defaultStrategiesRes] = await Promise.all([
        getSymbols(),
        getStrategies(),
        getDefaultStrategies(),
      ]);

      setSymbols(symbolsRes.data.symbols || []);
      setCustomStrategies(strategiesRes.data.data || []);
      setDefaultStrategies(defaultStrategiesRes.data.data || []);

      // Set default values
      if (symbolsRes.data.symbols && symbolsRes.data.symbols.length > 0) {
        setFormData(prev => ({ ...prev, symbol: symbolsRes.data.symbols[0] }));
      }
      if (defaultStrategiesRes.data.data && defaultStrategiesRes.data.data.length > 0) {
        setFormData(prev => ({ ...prev, selectedDefaultStrategy: defaultStrategiesRes.data.data[0].type }));
      }
    } catch (error) {
      toast.error('Error loading data');
      console.error('Error loading initial data:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate parameters JSON
      const params = JSON.parse(formData.parameters);

      const backtestData = {
        symbol: formData.symbol,
        startDate: formData.startDate,
        endDate: formData.endDate,
        initialCapital: parseFloat(formData.initialCapital),
        parameters: params,
      };

      // Add strategy based on type
      if (formData.strategyType === 'default') {
        backtestData.strategyType = formData.selectedDefaultStrategy;
      } else {
        backtestData.strategyId = formData.selectedCustomStrategy;
      }

      const response = await runBacktest(backtestData);
      
      toast.success('Backtest completed successfully!');
      
      // Navigate to results page with the result ID
      setTimeout(() => {
        navigate('/results');
      }, 1000);
    } catch (error) {
      toast.error('Error running backtest: ' + (error.response?.data?.error || error.message));
      console.error('Error running backtest:', error);
    } finally {
      setLoading(false);
    }
  };

  const getParameterSuggestions = () => {
    if (formData.strategyType === 'default') {
      const strategy = defaultStrategies.find(s => s.type === formData.selectedDefaultStrategy);
      if (strategy) {
        switch (strategy.type) {
          case 'movingAverageCrossover':
            return '{"shortPeriod": 10, "longPeriod": 50}';
          case 'rsiStrategy':
            return '{"period": 14, "oversold": 30, "overbought": 70}';
          case 'bollingerBandsStrategy':
            return '{"period": 20, "stdDev": 2}';
          case 'macdStrategy':
            return '{"fastPeriod": 12, "slowPeriod": 26, "signalPeriod": 9}';
          default:
            return '{}';
        }
      }
    }
    return '{}';
  };

  return (
    <div>
      <h2 style={{ marginBottom: '2rem', fontSize: '2rem', fontWeight: 600 }}>
        Run Backtest
      </h2>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Configure Backtest</h3>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Strategy Type Selection */}
          <div className="form-group">
            <label>Strategy Type *</label>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  value="default"
                  checked={formData.strategyType === 'default'}
                  onChange={(e) => setFormData({ ...formData, strategyType: e.target.value })}
                  style={{ marginRight: '0.5rem' }}
                />
                Default Strategy
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  value="custom"
                  checked={formData.strategyType === 'custom'}
                  onChange={(e) => setFormData({ ...formData, strategyType: e.target.value })}
                  style={{ marginRight: '0.5rem' }}
                />
                Custom Strategy
              </label>
            </div>
          </div>

          {/* Strategy Selection */}
          {formData.strategyType === 'default' ? (
            <div className="form-group">
              <label>Select Default Strategy *</label>
              <select
                className="form-control"
                value={formData.selectedDefaultStrategy}
                onChange={(e) => setFormData({ ...formData, selectedDefaultStrategy: e.target.value })}
                required
              >
                <option value="">Choose a strategy...</option>
                {defaultStrategies.map((strategy) => (
                  <option key={strategy.type} value={strategy.type}>
                    {strategy.name} - {strategy.description}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="form-group">
              <label>Select Custom Strategy *</label>
              <select
                className="form-control"
                value={formData.selectedCustomStrategy}
                onChange={(e) => setFormData({ ...formData, selectedCustomStrategy: e.target.value })}
                required
              >
                <option value="">Choose a strategy...</option>
                {customStrategies.map((strategy) => (
                  <option key={strategy._id} value={strategy._id}>
                    {strategy.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Symbol */}
          <div className="form-group">
            <label>Symbol *</label>
            <select
              className="form-control"
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
              required
            >
              <option value="">Choose a symbol...</option>
              {symbols.map((symbol) => (
                <option key={symbol} value={symbol}>
                  {symbol}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-2">
            <div className="form-group">
              <label>Start Date *</label>
              <input
                type="date"
                className="form-control"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>End Date *</label>
              <input
                type="date"
                className="form-control"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Initial Capital */}
          <div className="form-group">
            <label>Initial Capital ($) *</label>
            <input
              type="number"
              className="form-control"
              value={formData.initialCapital}
              onChange={(e) => setFormData({ ...formData, initialCapital: e.target.value })}
              min="100"
              step="100"
              required
            />
          </div>

          {/* Parameters */}
          <div className="form-group">
            <label>Strategy Parameters (JSON)</label>
            <small style={{ display: 'block', marginBottom: '0.5rem', color: '#8b949e' }}>
              Suggested: {getParameterSuggestions()}
            </small>
            <input
              type="text"
              className="form-control"
              value={formData.parameters}
              onChange={(e) => setFormData({ ...formData, parameters: e.target.value })}
              placeholder={getParameterSuggestions()}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ minWidth: '150px' }}
          >
            {loading ? 'Running...' : 'Run Backtest'}
          </button>
        </form>
      </div>

      {/* Info Card */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">ℹ️ How It Works</h3>
        </div>
        <div style={{ color: '#c9d1d9', lineHeight: '1.6' }}>
          <ol style={{ paddingLeft: '1.5rem' }}>
            <li>Select a trading strategy (default or custom)</li>
            <li>Choose the stock symbol and date range for backtesting</li>
            <li>Set your initial capital amount</li>
            <li>Configure strategy parameters (optional)</li>
            <li>Click "Run Backtest" to execute the strategy on historical data</li>
            <li>View comprehensive results including equity curves, drawdown charts, and performance metrics</li>
          </ol>
          <p style={{ marginTop: '1rem', color: '#8b949e' }}>
            The backtesting engine simulates trades based on your strategy's signals and calculates
            key performance metrics like Sharpe ratio, maximum drawdown, win rate, and profit factor.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Backtest;
