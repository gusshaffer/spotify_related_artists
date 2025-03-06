// src/contexts/AuthContext.js (updated)
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  isAuthenticated, 
  getUserProfile, 
  logout as spotifyLogout
} from '../services/spotify';

// Create the authentication context
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  const [authError, setAuthError] = useState(null);

  // Load user profile when authenticated
  useEffect(() => {
    const loadUserProfile = async () => {
      if (authenticated) {
        try {
          const profile = await getUserProfile();
          if (profile) {
            setUser(profile);
            setAuthError(null);
          } else {
            // Profile not found but we thought we were authenticated
            setAuthenticated(false);
            setAuthError('Session expired or invalid');
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
          setAuthenticated(false);
          setAuthError(error.message);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [authenticated]);

  // Handle successful authentication
  const handleAuthSuccess = (tokenData) => {
    setAuthenticated(true);
    // The user profile will be loaded in the useEffect above
  };

  // Handle logout
  const logout = () => {
    spotifyLogout();
    setUser(null);
    setAuthenticated(false);
    setAuthError(null);
  };

  // Value to be provided by the context
  const value = {
    user,
    loading,
    authenticated,
    authError,
    handleAuthSuccess,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
