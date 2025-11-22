import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/api';
import { toast } from 'react-toastify';

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const response = await getCurrentUser();
      setUser(response.data.user);
    } catch (error) {
      console.error('Error loading profile:', error);
      if (error.response?.status === 401) {
        toast.error('Please login to view your profile');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: { color: '#f85149', label: 'Admin' },
      analyst: { color: '#58a6ff', label: 'Analyst' },
      user: { color: '#238636', label: 'User' }
    };
    const badge = badges[role] || badges.user;
    return (
      <span className="role-badge" style={{ backgroundColor: badge.color }}>
        {badge.label}
      </span>
    );
  };

  return (
    <div>
      <h2 style={{ marginBottom: '2rem', fontSize: '2rem', fontWeight: 600 }}>
        My Profile
      </h2>

      <div className="profile-container">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Account Information</h3>
            {getRoleBadge(user.role)}
          </div>

          <div className="profile-info">
            <div className="profile-field">
              <label>Username</label>
              <div className="profile-value">{user.username}</div>
            </div>

            <div className="profile-field">
              <label>Email</label>
              <div className="profile-value">{user.email}</div>
            </div>

            <div className="profile-field">
              <label>Role</label>
              <div className="profile-value">
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </div>
            </div>

            <div className="profile-field">
              <label>Member Since</label>
              <div className="profile-value">{formatDate(user.createdAt)}</div>
            </div>

            {user.lastLogin && (
              <div className="profile-field">
                <label>Last Login</label>
                <div className="profile-value">{formatDate(user.lastLogin)}</div>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Account Actions</h3>
          </div>

          <div className="profile-actions">
            <button 
              onClick={handleLogout}
              className="btn btn-danger"
              style={{ width: '100%' }}
            >
              Logout
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Permissions</h3>
          </div>

          <div className="permissions-list">
            <div className="permission-item">
              <span className="permission-icon">✓</span>
              <span>View and run backtests</span>
            </div>
            <div className="permission-item">
              <span className="permission-icon">✓</span>
              <span>View strategies</span>
            </div>
            {(user.role === 'analyst' || user.role === 'admin') && (
              <>
                <div className="permission-item">
                  <span className="permission-icon">✓</span>
                  <span>Create and edit strategies</span>
                </div>
                <div className="permission-item">
                  <span className="permission-icon">✓</span>
                  <span>Delete strategies</span>
                </div>
              </>
            )}
            {user.role === 'admin' && (
              <div className="permission-item">
                <span className="permission-icon">✓</span>
                <span>Full administrative access</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
