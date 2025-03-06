import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSpotifyApi } from '../../services/spotify';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get configured Spotify API instance
        const spotify = await getSpotifyApi();
        
        // Fetch user profile
        const userProfile = await spotify.getMe();
        setProfile(userProfile);
        
        // Fetch user playlists
        const userPlaylists = await spotify.getUserPlaylists();
        setPlaylists(userPlaylists.items);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data from Spotify');
        setLoading(false);
        
        // If token is invalid, redirect to login
        if (err.message === 'No access token available') {
          navigate('/');
        }
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    // Clear localStorage items related to Spotify
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_token_expires');
    localStorage.removeItem('spotify_auth_state');
    
    // Redirect to login page
    navigate('/');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Spotify Dashboard</h1>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </header>

      {profile && (
        <div className="profile-container">
          <h2>Welcome, {profile.display_name}!</h2>
          {profile.images && profile.images.length > 0 && (
            <img src={profile.images[0].url} alt="Profile" className="profile-image" />
          )}
          <p>Email: {profile.email}</p>
          <p>Account Type: {profile.product}</p>
          <p>Followers: {profile.followers.total}</p>
        </div>
      )}

      <div className="playlists-container">
        <h2>Your Playlists</h2>
        {playlists.length === 0 ? (
          <p>No playlists found</p>
        ) : (
          <div className="playlists-grid">
            {playlists.map(playlist => (
              <div key={playlist.id} className="playlist-card">
                {playlist.images && playlist.images.length > 0 ? (
                  <img src={playlist.images[0].url} alt={playlist.name} className="playlist-image" />
                ) : (
                  <div className="playlist-image-placeholder"></div>
                )}
                <h3>{playlist.name}</h3>
                <p>{playlist.tracks.total} tracks</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
