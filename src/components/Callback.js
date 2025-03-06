// src/components/Callback.js
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { exchangeCodeForToken } from '../services/spotify';
import { useAuth } from '../contexts/AuthContext';
import './Callback.css';

const Callback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleAuthSuccess } = useAuth();

  useEffect(() => {
    const processCallback = async () => {
      // This is for when users are redirected directly to the callback URL
      // (not through a popup)
      try {
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        
        if (error) {
          console.error('Spotify auth error:', error);
          // If in a popup, send message to parent window
          if (window.opener) {
            window.opener.postMessage({ type: 'AUTH_ERROR', error }, '*');
            window.close();
            return;
          }
          // Otherwise redirect to login page
          navigate('/');
          return;
        }
        
        if (!code) {
          // If in a popup, send message to parent window
          if (window.opener) {
            window.opener.postMessage({ type: 'AUTH_ERROR', error: 'No code provided' }, '*');
            window.close();
            return;
          }
          // Otherwise redirect to login page
          navigate('/');
          return;
        }
        
        // Exchange code for token
        const tokenData = await exchangeCodeForToken(code);
        
        // If in a popup, send message to parent window
        if (window.opener) {
          window.opener.postMessage({ type: 'AUTH_SUCCESS', tokenData }, '*');
          window.close();
          return;
        }
        
        // Otherwise handle auth success in this window
        handleAuthSuccess(tokenData);
        navigate('/dashboard');
      } catch (error) {
        console.error('Error processing callback:', error);
        
        // If in a popup, send message to parent window
        if (window.opener) {
          window.opener.postMessage({ type: 'AUTH_ERROR', error: error.message }, '*');
          window.close();
          return;
        }
        
        // Otherwise redirect to login page
        navigate('/');
      }
    };

    processCallback();
  }, [location, navigate, handleAuthSuccess]);

  // This message is shown briefly before redirect or window close
  return (
    <div className="callback-container">
      <div className="spinner"></div>
      <p>Completing authentication...</p>
    </div>
  );
};

export default Callback;
