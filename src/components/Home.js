// src/components/Home.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getSpotifyApi } from '../services/spotify';
import './Home.css';

const Home = () => {
  const { user, logout, authenticated, loading } = useAuth();
  const [recentTracks, setRecentTracks] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!authenticated) return;
      
      setLoadingData(true);
      setError(null);
      
      try {
        const spotify = await getSpotifyApi();
        
        // Get recently played tracks
        const recentTracksResponse = await spotify.getMyRecentlyPlayedTracks({ limit: 5 });
        setRecentTracks(recentTracksResponse.items);
        
        // Get top artists
        const topArtistsResponse = await spotify.getMyTopArtists({ limit: 6, time_range: 'short_term' });
        setTopArtists(topArtistsResponse.items);
      } catch (error) {
        console.error('Error fetching Spotify data:', error);
        setError('Failed to load your Spotify data. Please try again later.');
      } finally {
        setLoadingData(false);
      }
    };

    fetchUserData();
  }, [authenticated]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="home-container">
      {authenticated && user ? (
        <div className="dashboard-content">
          <header className="dashboard-header">
            <div className="user-info">
              {user.images && user.images.length > 0 ? (
                <img 
                  src={user.images[0].url} 
                  alt="Profile" 
                  className="profile-picture" 
                />
              ) : (
                <div className="profile-picture-placeholder"></div>
              )}
              <div className="user-details">
                <h1>Welcome, {user.display_name || 'Spotify User'}!</h1>
                <p className="user-meta">
                  {user.followers.total} followers • {user.product === 'premium' ? 'Premium Account' : 'Free Account'}
                </p>
              </div>
            </div>
            <button onClick={logout} className="logout-button">Log Out</button>
          </header>

          <div className="dashboard-grid">
            <section className="recent-tracks">
              <h2>Recently Played</h2>
              {loadingData ? (
                <div className="section-loading">
                  <div className="spinner small"></div>
                </div>
              ) : error ? (
                <div className="error-message">{error}</div>
              ) : (
                <ul className="track-list">
                  {recentTracks.length === 0 ? (
                    <p className="no-data-message">No recently played tracks found</p>
                  ) : (
                    recentTracks.map((item, index) => (
                      <li key={`${item.track.id}-${index}`} className="track-item">
                        <img 
                          src={item.track.album.images[0].url} 
                          alt={item.track.album.name} 
                          className="track-image"
                        />
                        <div className="track-info">
                          <p className="track-name">{item.track.name}</p>
                          <p className="track-artist">
                            {item.track.artists.map(artist => artist.name).join(', ')}
                          </p>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </section>

            <section className="top-artists">
              <h2>Your Top Artists</h2>
              {loadingData ? (
                <div className="section-loading">
                  <div className="spinner small"></div>
                </div>
              ) : error ? (
                <div className="error-message">{error}</div>
              ) : (
                <div className="artists-grid">
                  {topArtists.length === 0 ? (
                    <p className="no-data-message">No top artists found</p>
                  ) : (
                    topArtists.map(artist => (
                      <div key={artist.id} className="artist-card">
                        <img 
                          src={artist.images[0].url} 
                          alt={artist.name} 
                          className="artist-image"
                        />
                        <p className="artist-name">{artist.name}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      ) : (
        <div className="not-authenticated">
          <h1>Spotify Explorer</h1>
          <p>Please log in to view your Spotify profile and data.</p>
          <Link to="/" className="login-link">
            Go to Login
          </Link>
        </div>
      )}
    </div>
  );
};

export default Home;
