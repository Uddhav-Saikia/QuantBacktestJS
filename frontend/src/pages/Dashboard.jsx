import React, { useState, useEffect } from 'react';
import { getBacktestResults } from '../services/api';
import { format } from 'date-fns';

function Dashboard() {
  const [recentResults, setRecentResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBacktests: 0,
    avgReturn: 0,
    avgSharpe: 0,
    bestStrategy: null,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await getBacktestResults({ limit: 10 });
      const results = response.data.data;
      setRecentResults(results);

      // Calculate statistics
      if (results.length > 0) {
        const avgReturn = results.reduce((sum, r) => sum + r.totalReturnPercent, 0) / results.length;
        const avgSharpe = results.reduce((sum, r) => sum + r.sharpeRatio, 0) / results.length;
        const bestStrategy = results.reduce((best, current) => 
          current.totalReturnPercent > best.totalReturnPercent ? current : best
        );

        setStats({
          totalBacktests: results.length,
          avgReturn: avgReturn.toFixed(2),
          avgSharpe: avgSharpe.toFixed(2),
          bestStrategy: bestStrategy.strategyName,
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: '2rem', fontSize: '2rem', fontWeight: 600 }}>
        Dashboard
      </h2>

      {/* Statistics Cards */}
      <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
        <div className="metric-card">
          <div className="metric-label">Total Backtests</div>
          <div className="metric-value">{stats.totalBacktests}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Avg Return</div>
          <div className={`metric-value ${stats.avgReturn >= 0 ? 'positive' : 'negative'}`}>
            {stats.avgReturn}%
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Avg Sharpe Ratio</div>
          <div className="metric-value">{stats.avgSharpe}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Best Strategy</div>
          <div className="metric-value" style={{ fontSize: '1rem' }}>
            {stats.bestStrategy || 'N/A'}
          </div>
        </div>
      </div>

      {/* Recent Results */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Backtest Results</h3>
        </div>

        {recentResults.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#8b949e' }}>
            <p>No backtest results yet.</p>
            <p style={{ marginTop: '0.5rem' }}>
              Run your first backtest to see results here.
            </p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Strategy</th>
                <th>Symbol</th>
                <th>Date Range</th>
                <th>Total Return</th>
                <th>Sharpe Ratio</th>
                <th>Win Rate</th>
                <th>Max Drawdown</th>
              </tr>
            </thead>
            <tbody>
              {recentResults.map((result) => (
                <tr key={result._id}>
                  <td>{result.strategyName}</td>
                  <td>{result.symbol}</td>
                  <td>
                    {format(new Date(result.startDate), 'MMM dd, yyyy')} - {' '}
                    {format(new Date(result.endDate), 'MMM dd, yyyy')}
                  </td>
                  <td className={result.totalReturnPercent >= 0 ? 'positive' : 'negative'}>
                    {result.totalReturnPercent.toFixed(2)}%
                  </td>
                  <td>{result.sharpeRatio.toFixed(2)}</td>
                  <td>{result.winRate.toFixed(2)}%</td>
                  <td className="negative">
                    {result.maxDrawdownPercent.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Quick Actions</h3>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <a href="/backtest" className="btn btn-primary">
            Run New Backtest
          </a>
          <a href="/strategies" className="btn btn-secondary">
            Manage Strategies
          </a>
          <a href="/results" className="btn btn-secondary">
            View All Results
          </a>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
