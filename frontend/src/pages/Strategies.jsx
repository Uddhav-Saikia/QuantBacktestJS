import React, { useState, useEffect } from 'react';
import { getStrategies, createStrategy, deleteStrategy } from '../services/api';
import { toast } from 'react-toastify';

function Strategies() {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    parameters: '{}',
  });

  useEffect(() => {
    loadStrategies();
  }, []);

  const loadStrategies = async () => {
    try {
      setLoading(true);
      const response = await getStrategies();
      setStrategies(response.data.data);
    } catch (error) {
      toast.error('Error loading strategies');
      console.error('Error loading strategies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate JSON parameters
      JSON.parse(formData.parameters);
      
      await createStrategy({
        ...formData,
        parameters: JSON.parse(formData.parameters),
      });
      
      toast.success('Strategy created successfully');
      setShowForm(false);
      setFormData({ name: '', description: '', code: '', parameters: '{}' });
      loadStrategies();
    } catch (error) {
      toast.error('Error creating strategy: ' + error.message);
      console.error('Error creating strategy:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this strategy?')) return;
    
    try {
      await deleteStrategy(id);
      toast.success('Strategy deleted successfully');
      loadStrategies();
    } catch (error) {
      toast.error('Error deleting strategy');
      console.error('Error deleting strategy:', error);
    }
  };

  const exampleStrategy = `function myStrategy(data, params) {
  const { shortPeriod = 10, longPeriod = 50 } = params;
  
  if (data.length < longPeriod) return null;
  
  // Calculate moving averages
  const shortMA = data.slice(-shortPeriod)
    .reduce((sum, bar) => sum + bar.close, 0) / shortPeriod;
  const longMA = data.slice(-longPeriod)
    .reduce((sum, bar) => sum + bar.close, 0) / longPeriod;
  
  // Previous values
  const prevShortMA = data.slice(-shortPeriod - 1, -1)
    .reduce((sum, bar) => sum + bar.close, 0) / shortPeriod;
  const prevLongMA = data.slice(-longPeriod - 1, -1)
    .reduce((sum, bar) => sum + bar.close, 0) / longPeriod;
  
  // Generate signals
  if (prevShortMA <= prevLongMA && shortMA > longMA) {
    return 'BUY';
  }
  if (prevShortMA >= prevLongMA && shortMA < longMA) {
    return 'SELL';
  }
  
  return null;
}`;

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 600 }}>Trading Strategies</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Strategy'}
        </button>
      </div>

      {/* Create Strategy Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h3 className="card-title">Create New Strategy</h3>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Strategy Name *</label>
              <input
                type="text"
                className="form-control"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                className="form-control"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Strategy Code *</label>
              <small style={{ display: 'block', marginBottom: '0.5rem', color: '#8b949e' }}>
                Function that receives (data, params) and returns 'BUY', 'SELL', 'SHORT', 'COVER', or null
              </small>
              <textarea
                className="form-control"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder={exampleStrategy}
                required
                style={{ minHeight: '300px' }}
              />
            </div>

            <div className="form-group">
              <label>Default Parameters (JSON)</label>
              <input
                type="text"
                className="form-control"
                value={formData.parameters}
                onChange={(e) => setFormData({ ...formData, parameters: e.target.value })}
                placeholder='{"shortPeriod": 10, "longPeriod": 50}'
              />
            </div>

            <button type="submit" className="btn btn-primary">
              Create Strategy
            </button>
          </form>
        </div>
      )}

      {/* Strategies List */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Your Strategies</h3>
        </div>

        {strategies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#8b949e' }}>
            <p>No custom strategies yet.</p>
            <p style={{ marginTop: '0.5rem' }}>
              Create your first strategy or use default strategies in the backtest page.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {strategies.map((strategy) => (
              <div
                key={strategy._id}
                style={{
                  padding: '1.5rem',
                  backgroundColor: '#0d1117',
                  borderRadius: '6px',
                  border: '1px solid #30363d',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                      {strategy.name}
                    </h4>
                    {strategy.description && (
                      <p style={{ color: '#8b949e', marginBottom: '1rem' }}>
                        {strategy.description}
                      </p>
                    )}
                    <div style={{ fontSize: '0.75rem', color: '#8b949e' }}>
                      Created: {new Date(strategy.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    className="btn btn-danger btn-small"
                    onClick={() => handleDelete(strategy._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Strategies;
