import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../services/api';

function Landing() {
  const navigate = useNavigate();

  const handleProtectedNavigation = (path) => {
    if (!isAuthenticated()) {
      navigate('/login');
    } else {
      navigate(path);
    }
  };

  return (
    <div className="landing-page">
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="gradient-text">Algorithmic Trading</span>
            <br />
            Made Simple
          </h1>
          <p className="hero-subtitle">
            Backtest your trading strategies with historical data, analyze performance metrics, 
            and optimize your approach before risking real capital.
          </p>
          <div className="hero-buttons">
            <button 
              onClick={() => handleProtectedNavigation('/dashboard')} 
              className="btn btn-primary btn-large"
            >
              Get Started
            </button>
            <button 
              onClick={() => handleProtectedNavigation('/strategies')} 
              className="btn btn-secondary btn-large"
            >
              View Strategies
            </button>
          </div>
        </div>
        <div className="hero-image">
          <div className="chart-preview">
            <div className="chart-bar" style={{ height: '60%' }}></div>
            <div className="chart-bar" style={{ height: '80%' }}></div>
            <div className="chart-bar" style={{ height: '45%' }}></div>
            <div className="chart-bar" style={{ height: '90%' }}></div>
            <div className="chart-bar" style={{ height: '70%' }}></div>
            <div className="chart-bar" style={{ height: '85%' }}></div>
            <div className="chart-bar" style={{ height: '55%' }}></div>
          </div>
        </div>
      </section>

      <section className="features">
        <h2 className="section-title">Powerful Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Historical Backtesting</h3>
            <p>Test your strategies against years of market data with accurate simulations</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Fast Execution</h3>
            <p>Optimized algorithms ensure quick backtests even with large datasets</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3>Performance Metrics</h3>
            <p>Comprehensive analytics including Sharpe ratio, max drawdown, and returns</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔧</div>
            <h3>Custom Strategies</h3>
            <p>Write your own trading logic in JavaScript with full parameter control</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📉</div>
            <h3>Risk Analysis</h3>
            <p>Understand drawdowns, volatility, and risk-adjusted returns</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💾</div>
            <h3>Save & Compare</h3>
            <p>Store backtest results and compare different strategy performances</p>
          </div>
        </div>
      </section>

      <section className="strategies-preview">
        <h2 className="section-title">Pre-Built Strategies</h2>
        <p className="section-subtitle">Start with proven strategies or build your own</p>
        <div className="strategies-list">
          <div className="strategy-preview-card">
            <h3>Moving Average Crossover</h3>
            <p>Classic trend-following strategy using short and long-term moving averages</p>
            <div className="strategy-tags">
              <span className="tag">Trend Following</span>
              <span className="tag">Beginner Friendly</span>
            </div>
          </div>
          <div className="strategy-preview-card">
            <h3>RSI Strategy</h3>
            <p>Momentum-based approach using Relative Strength Index indicators</p>
            <div className="strategy-tags">
              <span className="tag">Momentum</span>
              <span className="tag">Mean Reversion</span>
            </div>
          </div>
          <div className="strategy-preview-card">
            <h3>Bollinger Bands</h3>
            <p>Volatility-based strategy trading at statistical price extremes</p>
            <div className="strategy-tags">
              <span className="tag">Volatility</span>
              <span className="tag">Range Trading</span>
            </div>
          </div>
          <div className="strategy-preview-card">
            <h3>MACD</h3>
            <p>Trend and momentum strategy using moving average convergence divergence</p>
            <div className="strategy-tags">
              <span className="tag">Trend</span>
              <span className="tag">Momentum</span>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button 
            onClick={() => handleProtectedNavigation('/strategies')} 
            className="btn btn-primary"
          >
            Explore All Strategies →
          </button>
        </div>
      </section>

      <section className="cta">
        <div className="cta-content">
          <h2>Ready to Optimize Your Trading?</h2>
          <p>Join traders who backtest before they invest</p>
          <button 
            onClick={() => handleProtectedNavigation('/backtest')} 
            className="btn btn-primary btn-large"
          >
            Run Your First Backtest
          </button>
        </div>
      </section>

      <footer className="landing-footer">
        <p>Built with React, Node.js, and MongoDB</p>
        <p className="footer-links">
          <a href="https://github.com/Uddhav-Saikia/QuantBacktestJS" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          {' • '}
          <button 
            onClick={() => handleProtectedNavigation('/dashboard')} 
            className="footer-link-btn"
          >
            Dashboard
          </button>
          {' • '}
          <button 
            onClick={() => handleProtectedNavigation('/strategies')} 
            className="footer-link-btn"
          >
            Strategies
          </button>
        </p>
      </footer>
    </div>
  );
}

export default Landing;
