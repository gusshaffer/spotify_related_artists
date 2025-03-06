// src/components/Auth/Login.js
import React from 'react';
import { generateSpotifyAuthUrl } from '../../services/spotify';
import './Login.css';

const Login = () => {
  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Spotify Explorer</h1>
        <p className="login-description">
          Connect with your Spotify account to browse your playlists, discover new music,
          and see your listening stats.
        </p>
        <div className="login-benefits">
          <h3>What you'll get:</h3>
          <ul>
            <li>View your playlists and saved tracks</li>
            <li>See your listening activity</li>
            <li>Discover personalized recommendations</li>
          </ul>
        </div>
        <a 
          href={generateSpotifyAuthUrl()}
          className="login-button"
        >
          <img 
            src="/spotify-logo.png" 
            alt="Spotify" 
            className="spotify-logo"
          />
          Login with Spotify
        </a>
        <p className="login-disclaimer">
          We only access your Spotify data with your permission.
          Your credentials are never stored on our servers.
        </p>
      </div>
    </div>
  );
};

export default Login;
