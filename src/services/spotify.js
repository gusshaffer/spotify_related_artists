// src/services/spotify.js (updated for the new auth flow)
import SpotifyWebApi from 'spotify-web-api-js';
import axios from 'axios';

const spotifyApi = new SpotifyWebApi();

// Get the Spotify API credentials from environment variables
const CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.REACT_APP_REDIRECT_URI || 'http://localhost:3000/callback';

// Key constants for storage
const ACCESS_TOKEN_KEY = 'spotify_access_token';
const REFRESH_TOKEN_KEY = 'spotify_refresh_token';
const TOKEN_EXPIRY_KEY = 'spotify_token_expires';

// Scopes define what permissions we're requesting from the user
const SCOPES = [
  'user-read-private',
  'user-read-email',
  'playlist-read-private',
  'user-library-read',
  'user-top-read',
  'user-read-recently-played',
  'playlist-modify-public',
  'playlist-modify-private'
];

/**
 * Generate Spotify authorization URL
 * @param {string} state - State parameter for CSRF protection
 * @returns {string} Authorization URL
 */
export const generateSpotifyAuthUrl = (state) => {
  const authUrl = 'https://accounts.spotify.com/authorize';
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: SCOPES.join(' '),
    redirect_uri: REDIRECT_URI,
    state: state,
    show_dialog: 'true' // Always show the auth dialog for testing
  });

  return `${authUrl}?${params.toString()}`;
};

/**
 * Exchange authorization code for access and refresh tokens
 * @param {string} code - Authorization code from Spotify
 * @returns {Promise<Object>} Token data
 */
export const exchangeCodeForToken = async (code) => {
  try {
    // In a production app, this should be handled server-side for security
    // For this demo, we'll handle it client-side
    const tokenUrl = 'https://accounts.spotify.com/api/token';
    const payload = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI
    });

    const response = await axios.post(tokenUrl, payload, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`
      }
    });

    const { access_token, refresh_token, expires_in } = response.data;
    
    // Calculate token expiry time
    const expiryTime = Date.now() + (expires_in * 1000);
    
    // Store tokens
    localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    
    // Configure Spotify API with the token
    spotifyApi.setAccessToken(access_token);
    
    return {
      access_token,
      refresh_token,
      expires_in,
      expires_at: expiryTime
    };
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    throw new Error(error.response?.data?.error_description || error.message || 'Failed to get access token');
  }
};

/**
 * Refresh the access token
 * @returns {Promise<Object>} New token data
 */
export const refreshAccessToken = async () => {
  const refresh_token = localStorage.getItem(REFRESH_TOKEN_KEY);
  
  if (!refresh_token) {
    throw new Error('No refresh token available. Please log in again.');
  }

  try {
    const tokenUrl = 'https://accounts.spotify.com/api/token';
    const payload = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    });

    const response = await axios.post(tokenUrl, payload, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`
      }
    });

    const { access_token, expires_in } = response.data;
    
    // If a new refresh token is provided, store it
    if (response.data.refresh_token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refresh_token);
    }
    
    // Calculate new expiry time
    const expiryTime = Date.now() + (expires_in * 1000);
    localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    
    // Update the Spotify API instance
    spotifyApi.setAccessToken(access_token);
    
    return {
      access_token,
      expires_in,
      expires_at: expiryTime
    };
  } catch (error) {
    console.error('Error refreshing token:', error);
    logout();
    throw new Error('Session expired. Please log in again.');
  }
};

/**
 * Get the Spotify API instance with a valid token
 * @returns {Promise<Object>} Configured Spotify API instance
 */
export const getSpotifyApi = async () => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  
  if (!token) {
    throw new Error('Not authenticated');
  }

  // If token is expired or about to expire (within 5 minutes), refresh it
  const expiryTime = parseInt(expiry, 10);
  const fiveMinutes = 5 * 60 * 1000;
  
  if (Date.now() + fiveMinutes >= expiryTime) {
    await refreshAccessToken();
  }
  
  // Ensure we're using the latest token
  spotifyApi.setAccessToken(localStorage.getItem(ACCESS_TOKEN_KEY));
  return spotifyApi;
};

/**
 * Check if user is authenticated
 * @returns {boolean} Authentication status
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Get user profile if authenticated
 * @returns {Promise<Object|null>} User profile or null if not authenticated
 */
export const getUserProfile = async () => {
  try {
    if (!isAuthenticated()) {
      return null;
    }
    
    const spotify = await getSpotifyApi();
    return await spotify.getMe();
  } catch (error) {
    console.error('Error getting user profile:', error);
    if (error.message === 'Not authenticated' || error.status === 401) {
      logout();
    }
    return null;
  }
};

/**
 * Log out the user by clearing tokens
 */
export const logout = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  spotifyApi.setAccessToken(null);
};

export default spotifyApi;
