import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Landing from './pages/Landing.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Strategies from './pages/Strategies.jsx';
import Backtest from './pages/Backtest.jsx';
import Results from './pages/Results.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Profile from './pages/Profile.jsx';
import { isAuthenticated, getStoredUser } from './services/api';

function Navigation() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const user = getStoredUser();

  if (isLandingPage || isAuthPage) {
    return null;
  }

  return (
    <nav className="navbar">
      <h1>📈 Algorithmic Trading Platform</h1>
      <ul className="nav-links">
        <li><Link to="/dashboard">Dashboard</Link></li>
        <li><Link to="/strategies">Strategies</Link></li>
        <li><Link to="/backtest">Run Backtest</Link></li>
        <li><Link to="/results">Results</Link></li>
        {user ? (
          <li className="user-menu">
            <Link to="/profile" className="user-link">
              <span className="user-avatar">{user.username.charAt(0).toUpperCase()}</span>
              <span>{user.username}</span>
            </Link>
          </li>
        ) : (
          <li><Link to="/login" className="login-btn">Login</Link></li>
        )}
      </ul>
    </nav>
  );
}

// Protected route wrapper
function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <Router>
      <div className="app">
        <Navigation />

        <main className="container">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/strategies" element={<Strategies />} />
            <Route path="/backtest" element={<Backtest />} />
            <Route path="/results" element={<Results />} />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
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
