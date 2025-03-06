// src/components/Auth/AuthBridge.js
import React, { useState, useEffect } from 'react';
import { generateSpotifyAuthUrl, exchangeCodeForToken } from '../../services/spotify';
import './AuthBridge.css';

const AuthBridge = ({ onAuthComplete }) => {
  const [authState, setAuthState] = useState({
    step: 'initial', // initial, authorizing, exchanging, success, error
    error: null,
    code: null
  });

  // Handle the authorization code when it arrives
  useEffect(() => {
    const handleAuthCallback = async () => {
      // If we're already processing or completed, don't proceed
      if (authState.step !== 'authorizing' || !authState.code) return;

      setAuthState(prev => ({ ...prev, step: 'exchanging' }));
      
      try {
        // Exchange the code for tokens
        const tokenData = await exchangeCodeForToken(authState.code);
        setAuthState(prev => ({ ...prev, step: 'success' }));
        
        // Notify parent component of successful authentication
        if (onAuthComplete) {
          onAuthComplete(tokenData);
        }
      } catch (error) {
        console.error('Error exchanging code for token:', error);
        setAuthState({ 
          step: 'error',
          error: error.message || 'Failed to complete authentication',
          code: null
        });
      }
    };

    handleAuthCallback();
  }, [authState.step, authState.code, onAuthComplete]);

  // Step 1: Launch Spotify authorization in a popup
  const startAuth = () => {
    setAuthState({ step: 'authorizing', error: null, code: null });
    
    // Generate state parameter for security
    const state = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('spotify_auth_state', state);
    
    // Generate the auth URL
    const authUrl = generateSpotifyAuthUrl(state);
    
    // Open a popup window for authentication
    const width = 450;
    const height = 730;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    const authWindow = window.open(
      authUrl,
      'Spotify Authentication',
      `width=${width},height=${height},left=${left},top=${top}`
    );
    
    // Set up a listener to handle the redirect back with code
    const checkPopup = setInterval(() => {
      try {
        // Check if the window is closed or redirected to our domain
        if (!authWindow || authWindow.closed) {
          clearInterval(checkPopup);
          if (authState.step === 'authorizing') {
            setAuthState({ 
              step: 'error', 
              error: 'Authentication window was closed', 
              code: null 
            });
          }
          return;
        }
        
        // Try to access the current URL of the popup
        // This will throw an error if redirected to a different domain due to CORS
        const currentUrl = authWindow.location.href;
        
        // Check if redirected to our callback URL
        if (currentUrl.includes('callback')) {
          clearInterval(checkPopup);
          
          // Parse the URL for code and state
          const urlParams = new URLSearchParams(authWindow.location.search);
          const code = urlParams.get('code');
          const returnedState = urlParams.get('state');
          const error = urlParams.get('error');
          
          // Close the popup
          authWindow.close();
          
          // Validate state to prevent CSRF attacks
          const originalState = localStorage.getItem('spotify_auth_state');
          
          if (error) {
            setAuthState({ 
              step: 'error', 
              error: `Spotify authentication error: ${error}`, 
              code: null 
            });
          } else if (returnedState !== originalState) {
            setAuthState({ 
              step: 'error', 
              error: 'State validation failed', 
              code: null 
            });
          } else if (code) {
            // Store the code and continue to exchange step
            setAuthState(prev => ({ ...prev, code }));
          } else {
            setAuthState({ 
              step: 'error', 
              error: 'No authentication code received', 
              code: null 
            });
          }
        }
      } catch (e) {
        // CORS error when the popup navigates to Spotify domain
        // This is expected and can be ignored
      }
    }, 500);
  };

  return (
    <div className="auth-bridge">
      {authState.step === 'initial' && (
        <div className="auth-initial">
          <h2>Connect to Spotify</h2>
          <p>You need to connect your Spotify account to use this feature.</p>
          <button onClick={startAuth} className="start-auth-button">
            Connect to Spotify
          </button>
        </div>
      )}
      
      {authState.step === 'authorizing' && (
        <div className="auth-authorizing">
          <div className="spinner"></div>
          <p>Waiting for Spotify authentication...</p>
          <p className="auth-note">
            (If a popup didn't open, please check your popup blocker)
          </p>
        </div>
      )}
      
      {authState.step === 'exchanging' && (
        <div className="auth-exchanging">
          <div className="spinner"></div>
          <p>Completing authentication...</p>
        </div>
      )}
      
      {authState.step === 'success' && (
        <div className="auth-success">
          <div className="success-icon">✓</div>
          <h3>Authentication Successful!</h3>
          <p>You've successfully connected to Spotify.</p>
        </div>
      )}
      
      {authState.step === 'error' && (
        <div className="auth-error">
          <div className="error-icon">!</div>
          <h3>Authentication Failed</h3>
          <p>{authState.error}</p>
          <button onClick={startAuth} className="retry-auth-button">
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default AuthBridge;
