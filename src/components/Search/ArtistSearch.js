// src/components/Search/ArtistSearch.js (updated)
import React, { useState, useEffect, useRef } from 'react';
import { getSpotifyApi } from '../../services/spotify';
import { useToast } from '../UI/ToastContainer';
import LoadingSpinner from '../UI/LoadingSpinner';
import './ArtistSearch.css';

const ArtistSearch = ({ onSelectArtist }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);
  const debounceTimeout = useRef(null);
  const { showError } = useToast();

  // Handle search input change with debouncing
  const handleSearchChange = (e) => {
    const searchQuery = e.target.value;
    setQuery(searchQuery);
    
    // Clear any existing timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    if (searchQuery.trim() === '') {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    // Set loading state immediately for better UX
    setLoading(true);
    setError(null);
    
    // Debounce the API call (wait 500ms after typing stops)
    debounceTimeout.current = setTimeout(() => {
      fetchArtistSuggestions(searchQuery);
    }, 500);
  };

  // Fetch artist suggestions from Spotify API
  const fetchArtistSuggestions = async (searchQuery) => {
    try {
      const spotify = await getSpotifyApi();
      const response = await spotify.search(searchQuery, ['artist'], { limit: 8 });
      
      if (response.artists && response.artists.items) {
        setSuggestions(response.artists.items);
        setShowDropdown(true);
      } else {
        setSuggestions([]);
      }
      setError(null);
    } catch (err) {
      console.error('Error searching for artists:', err);
      setError('Failed to search artists. Please try again.');
      setSuggestions([]);
      
      // Show error toast
      showError(`Search error: ${err.message || 'Failed to search for artists'}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle artist selection
  const handleSelectArtist = (artist) => {
    onSelectArtist(artist);
    setQuery(artist.name);
    setShowDropdown(false);
  };

  // Close dropdown when clicking outside the component
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  return (
    <div className="artist-search" ref={searchRef}>
      <div className="search-input-container">
        <input
          type="text"
          value={query}
          onChange={handleSearchChange}
          placeholder="Search for an artist..."
          className="search-input"
          onFocus={() => query && setShowDropdown(true)}
        />
        {loading && <div className="search-spinner"></div>}
      </div>
      
      {error && <div className="search-error">{error}</div>}
      
      {showDropdown && suggestions.length > 0 && (
        <ul className="suggestions-dropdown">
          {suggestions.map(artist => (
            <li 
              key={artist.id} 
              className="suggestion-item"
              onClick={() => handleSelectArtist(artist)}
            >
              <div className="suggestion-content">
                {artist.images && artist.images.length > 0 ? (
                  <img 
                    src={artist.images[artist.images.length - 1].url} 
                    alt={artist.name}
                    className="suggestion-image" 
                  />
                ) : (
                  <div className="suggestion-image-placeholder"></div>
                )}
                <div className="suggestion-info">
                  <div className="suggestion-name">{artist.name}</div>
                  <div className="suggestion-followers">
                    {artist.followers.total.toLocaleString()} followers
                  </div>
                </div>
                {artist.popularity > 0 && (
                  <div 
                    className="suggestion-popularity" 
                    title={`Popularity: ${artist.popularity}/100`}
                  >
                    <div 
                      className="popularity-bar" 
                      style={{ width: `${artist.popularity}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      
      {showDropdown && query && suggestions.length === 0 && !loading && (
        <div className="no-results">
          <span className="no-results-icon">🔍</span>
          No artists found matching "{query}"
        </div>
      )}
    </div>
  );
};

export default ArtistSearch;
