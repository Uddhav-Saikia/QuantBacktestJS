import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// OHLCV Data
export const getSymbols = () => api.get('/ohlcv');
export const getOHLCVData = (symbol, params) => api.get(`/ohlcv/${symbol}`, { params });

// Strategies
export const getStrategies = () => api.get('/strategies');
export const getStrategy = (id) => api.get(`/strategies/${id}`);
export const createStrategy = (data) => api.post('/strategies', data);
export const updateStrategy = (id, data) => api.put(`/strategies/${id}`, data);
export const deleteStrategy = (id) => api.delete(`/strategies/${id}`);

// Backtest
export const runBacktest = (data) => api.post('/backtest/run', data);
export const getBacktestResults = (params) => api.get('/backtest/results', { params });
export const getBacktestResult = (id) => api.get(`/backtest/results/${id}`);
export const deleteBacktestResult = (id) => api.delete(`/backtest/results/${id}`);
export const getDefaultStrategies = () => api.get('/backtest/strategies/default');

export default api;
