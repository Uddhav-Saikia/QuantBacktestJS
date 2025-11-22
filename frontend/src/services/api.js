import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      
      // Only redirect if not already on auth pages
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/register')) {
        toast.error('Session expired. Please login again.');
        window.location.href = '/login';
      }
    } else if (error.response?.status === 429) {
      toast.error('Too many requests. Please try again later.');
    } else if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action.');
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const register = (userData) => api.post('/auth/register', userData);
export const login = (credentials) => api.post('/auth/login', credentials);
export const getCurrentUser = () => api.get('/auth/me');
export const logout = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
  return Promise.resolve();
};

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

// Utility functions
export const isAuthenticated = () => {
  return !!localStorage.getItem('auth_token');
};

export const getStoredUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export default api;
