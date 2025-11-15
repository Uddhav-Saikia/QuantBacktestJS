import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Dashboard from './pages/Dashboard.jsx';
import Strategies from './pages/Strategies.jsx';
import Backtest from './pages/Backtest.jsx';
import Results from './pages/Results.jsx';

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <h1>📈 Algorithmic Trading Platform</h1>
          <ul className="nav-links">
            <li><Link to="/">Dashboard</Link></li>
            <li><Link to="/strategies">Strategies</Link></li>
            <li><Link to="/backtest">Run Backtest</Link></li>
            <li><Link to="/results">Results</Link></li>
          </ul>
        </nav>

        <main className="container">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/strategies" element={<Strategies />} />
            <Route path="/backtest" element={<Backtest />} />
            <Route path="/results" element={<Results />} />
          </Routes>
        </main>

        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          theme="dark"
        />
      </div>
    </Router>
  );
}

export default App;
