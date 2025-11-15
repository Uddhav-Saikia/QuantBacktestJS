import React, { useState, useEffect } from 'react';
import { getBacktestResults, getBacktestResult, deleteBacktestResult } from '../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

function Results() {
  const [results, setResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      setLoading(true);
      const response = await getBacktestResults({ limit: 50 });
      setResults(response.data.data);
    } catch (error) {
      toast.error('Error loading results');
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadResultDetails = async (id) => {
    try {
      setDetailLoading(true);
      const response = await getBacktestResult(id);
      setSelectedResult(response.data.data);
    } catch (error) {
      toast.error('Error loading result details');
      console.error('Error loading result details:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this result?')) return;

    try {
      await deleteBacktestResult(id);
      toast.success('Result deleted successfully');
      if (selectedResult && selectedResult._id === id) {
        setSelectedResult(null);
      }
      loadResults();
    } catch (error) {
      toast.error('Error deleting result');
      console.error('Error deleting result:', error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
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
        Backtest Results
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: selectedResult ? '1fr 2fr' : '1fr', gap: '1.5rem' }}>
        {/* Results List */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">All Results</h3>
          </div>

          {results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#8b949e' }}>
              <p>No results yet.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {results.map((result) => (
                <div
                  key={result._id}
                  onClick={() => loadResultDetails(result._id)}
                  style={{
                    padding: '1rem',
                    backgroundColor: selectedResult?._id === result._id ? '#21262d' : '#0d1117',
                    borderRadius: '6px',
                    border: '1px solid #30363d',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedResult?._id !== result._id) {
                      e.currentTarget.style.backgroundColor = '#161b22';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedResult?._id !== result._id) {
                      e.currentTarget.style.backgroundColor = '#0d1117';
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                        {result.strategyName}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#8b949e' }}>
                        {result.symbol} • {format(new Date(result.executedAt), 'MMM dd, yyyy')}
                      </div>
                      <div
                        style={{
                          fontSize: '0.875rem',
                          marginTop: '0.5rem',
                          color: result.totalReturnPercent >= 0 ? '#3fb950' : '#f85149',
                        }}
                      >
                        {result.totalReturnPercent >= 0 ? '+' : ''}
                        {result.totalReturnPercent.toFixed(2)}%
                      </div>
                    </div>
                    <button
                      className="btn btn-danger btn-small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(result._id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Result Details */}
        {selectedResult && (
          <div>
            {detailLoading ? (
              <div className="loading">
                <div className="spinner"></div>
              </div>
            ) : (
              <>
                {/* Performance Metrics */}
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                  <div className="card-header">
                    <h3 className="card-title">Performance Metrics</h3>
                  </div>
                  <div className="grid grid-4">
                    <div className="metric-card">
                      <div className="metric-label">Total Return</div>
                      <div className={`metric-value ${selectedResult.totalReturnPercent >= 0 ? 'positive' : 'negative'}`}>
                        {selectedResult.totalReturnPercent.toFixed(2)}%
                      </div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-label">Sharpe Ratio</div>
                      <div className="metric-value">{selectedResult.sharpeRatio.toFixed(2)}</div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-label">Max Drawdown</div>
                      <div className="metric-value negative">
                        {selectedResult.maxDrawdownPercent.toFixed(2)}%
                      </div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-label">Win Rate</div>
                      <div className="metric-value">{selectedResult.winRate.toFixed(2)}%</div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-label">Profit Factor</div>
                      <div className="metric-value">{selectedResult.profitFactor.toFixed(2)}</div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-label">Total Trades</div>
                      <div className="metric-value">{selectedResult.totalTrades}</div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-label">Initial Capital</div>
                      <div className="metric-value" style={{ fontSize: '1rem' }}>
                        {formatCurrency(selectedResult.initialCapital)}
                      </div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-label">Final Capital</div>
                      <div className="metric-value" style={{ fontSize: '1rem' }}>
                        {formatCurrency(selectedResult.finalCapital)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Equity Curve Chart */}
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                  <div className="card-header">
                    <h3 className="card-title">Equity Curve</h3>
                  </div>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={selectedResult.equityCurve}>
                        <defs>
                          <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3fb950" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3fb950" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(date) => format(new Date(date), 'MMM dd')}
                          stroke="#8b949e"
                          style={{ fontSize: '0.75rem' }}
                        />
                        <YAxis
                          stroke="#8b949e"
                          style={{ fontSize: '0.75rem' }}
                          tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#161b22',
                            border: '1px solid #30363d',
                            borderRadius: '6px',
                            color: '#e6edf3',
                          }}
                          formatter={(value) => formatCurrency(value)}
                          labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
                        />
                        <Area
                          type="monotone"
                          dataKey="equity"
                          stroke="#3fb950"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorEquity)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Drawdown Chart */}
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                  <div className="card-header">
                    <h3 className="card-title">Drawdown Chart</h3>
                  </div>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={selectedResult.equityCurve}>
                        <defs>
                          <linearGradient id="colorDrawdown" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f85149" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#f85149" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(date) => format(new Date(date), 'MMM dd')}
                          stroke="#8b949e"
                          style={{ fontSize: '0.75rem' }}
                        />
                        <YAxis
                          stroke="#8b949e"
                          style={{ fontSize: '0.75rem' }}
                          tickFormatter={(value) => `-${value.toFixed(0)}%`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#161b22',
                            border: '1px solid #30363d',
                            borderRadius: '6px',
                            color: '#e6edf3',
                          }}
                          formatter={(value) => `-${value.toFixed(2)}%`}
                          labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
                        />
                        <Area
                          type="monotone"
                          dataKey="drawdown"
                          stroke="#f85149"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorDrawdown)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Trade History */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Trade History</h3>
                  </div>
                  {selectedResult.trades && selectedResult.trades.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Side</th>
                            <th>Entry Date</th>
                            <th>Exit Date</th>
                            <th>Entry Price</th>
                            <th>Exit Price</th>
                            <th>Quantity</th>
                            <th>P&L</th>
                            <th>P&L %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedResult.trades.map((trade, index) => (
                            <tr key={index}>
                              <td>{index + 1}</td>
                              <td>
                                <span
                                  style={{
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    backgroundColor: trade.side === 'long' ? '#1a472a' : '#5a1e1e',
                                    color: trade.side === 'long' ? '#3fb950' : '#f85149',
                                  }}
                                >
                                  {trade.side.toUpperCase()}
                                </span>
                              </td>
                              <td>{format(new Date(trade.entryDate), 'MMM dd, yyyy')}</td>
                              <td>{format(new Date(trade.exitDate), 'MMM dd, yyyy')}</td>
                              <td>{formatCurrency(trade.entryPrice)}</td>
                              <td>{formatCurrency(trade.exitPrice)}</td>
                              <td>{trade.quantity}</td>
                              <td className={trade.pnl >= 0 ? 'positive' : 'negative'}>
                                {formatCurrency(trade.pnl)}
                              </td>
                              <td className={trade.pnlPercent >= 0 ? 'positive' : 'negative'}>
                                {trade.pnlPercent.toFixed(2)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#8b949e' }}>
                      No trades executed
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Results;
