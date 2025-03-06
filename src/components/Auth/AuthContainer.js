// src/components/Auth/AuthContainer.js
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AuthBridge from './AuthBridge';
import './AuthContainer.css';

const AuthContainer = ({ children }) => {
  const { authenticated, loading, handleAuthSuccess, authError } = useAuth();

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="spinner"></div>
        <p>Checking authentication status...</p>
      </div>
    );
  }

  // If not authenticated, show the auth bridge
  if (!authenticated) {
    return (
      <div className="auth-container">
        <h2>Authentication Required</h2>
        <p>You need to connect to Spotify to use this feature</p>
        {authError && (
          <div className="auth-error-message">
            <p>Error: {authError}</p>
          </div>
        )}
        <AuthBridge onAuthComplete={handleAuthSuccess} />
      </div>
    );
  }

  // If authenticated, show the children
  return children;
};

export default AuthContainer;
