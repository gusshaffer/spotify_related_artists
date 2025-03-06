// src/pages/SearchPage.js
import React, { useState } from 'react';
import ArtistSearch from '../components/Search/ArtistSearch';
import ArtistDetail from '../components/Artist/ArtistDetail';
import { useAuth } from '../contexts/AuthContext';
import './SearchPage.css';

const SearchPage = () => {
  const { authenticated, loading } = useAuth();
  const [selectedArtist, setSelectedArtist] = useState(null);

  // Handle artist selection from search component
  const handleSelectArtist = (artist) => {
    setSelectedArtist(artist);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="unauthorized-container">
        <h2>You need to be logged in to search for artists</h2>
        <a href="/" className="login-link">Go to Login</a>
      </div>
    );
  }

  return (
    <div className="search-page">
      <div className="search-header">
        <h1>Find Your Favorite Artists</h1>
        <p>Search for any artist on Spotify to see their top tracks and albums</p>
      </div>
      
      <ArtistSearch onSelectArtist={handleSelectArtist} />
      
      {selectedArtist ? (
        <ArtistDetail artist={selectedArtist} />
      ) : (
        <div className="search-prompt">
          <p>Try searching for your favorite artist</p>
          <div className="search-suggestions">
            <span>Try searching for:</span>
            <button 
              onClick={() => handleSelectArtist({ 
                id: '06HL4z0CvFAxyc27GXpf02',
                name: 'Taylor Swift'
              })}
              className="suggestion-button"
            >
              Taylor Swift
            </button>
            <button 
              onClick={() => handleSelectArtist({
                id: '3TVXtAsR1Inumwj472S9r4',
                name: 'Drake'
              })}
              className="suggestion-button"
            >
              Drake
            </button>
            <button 
              onClick={() => handleSelectArtist({
                id: '1Xyo4u8uXC1ZmMpatF05PJ',
                name: 'The Weeknd'
              })}
              className="suggestion-button"
            >
              The Weeknd
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
