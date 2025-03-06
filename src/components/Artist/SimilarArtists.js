// src/components/Artist/SimilarArtists.js (updated)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/UI/ToastContainer';
import { 
  discoverSimilarArtistsWithTracks,
  prepareTracksForPlaylist,
  storeTrackDataForPlaylist
} from '../../services/artistDiscoveryService';
import CreatePlaylist from '../Playlist/CreatePlaylist';
import QuickCreatePlaylist from '../Playlist/QuickCreatePlaylist';
import AuthContainer from '../Auth/AuthContainer';
import LoadingSpinner from '../UI/LoadingSpinner';
import './SimilarArtists.css';

const SimilarArtists = ({ artist, onSelectArtist }) => {
  const [discoveryData, setDiscoveryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [playlistTracks, setPlaylistTracks] = useState(null);
  const [tracksPerArtist, setTracksPerArtist] = useState(2);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [playlistCreateSuccess, setPlaylistCreateSuccess] = useState(null);
  const [generatingPlaylist, setGeneratingPlaylist] = useState(false);
  
  // Get toast functions
  const { showSuccess, showError, showInfo } = useToast();

  // Fetch similar artists when the selected artist changes
  useEffect(() => {
    const fetchSimilarArtists = async () => {
      if (!artist || !artist.id) return;
      
      setLoading(true);
      setError(null);
      setDiscoveryData(null);
      setSelectedArtists([]);
      setPlaylistTracks(null);
      setShowCreatePlaylist(false);
      setPlaylistCreateSuccess(null);
      
      try {
        // Show info toast while loading
        showInfo(`Finding artists similar to ${artist.name}...`);
        
        // Discover similar artists with their top tracks
        const data = await discoverSimilarArtistsWithTracks(artist.id, 15, 10);
        setDiscoveryData(data);
        
        // Auto-select first 5 artists by default
        if (data.similarArtists && data.similarArtists.length > 0) {
          setSelectedArtists(data.similarArtists.slice(0, 5).map(a => a.id));
          
          // Show success toast
          showSuccess(`Found ${data.similarArtists.length} artists similar to ${artist.name}`);
        } else {
          showInfo(`No similar artists found for ${artist.name}`);
        }
      } catch (err) {
        console.error('Error discovering similar artists:', err);
        setError(err.message || 'Failed to find similar artists');
        
        // Show error toast
        showError(`Error finding similar artists: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilarArtists();
  }, [artist, showInfo, showSuccess, showError]);

  // Toggle artist selection
  const toggleArtistSelection = (artistId) => {
    setSelectedArtists(prevSelected => {
      if (prevSelected.includes(artistId)) {
        return prevSelected.filter(id => id !== artistId);
      } else {
        return [...prevSelected, artistId];
      }
    });
    // Clear any generated playlist when selections change
    setPlaylistTracks(null);
    setShowCreatePlaylist(false);
    setPlaylistCreateSuccess(null);
  };

  // Generate a playlist from selected artists
  const generatePlaylist = () => {
    if (!discoveryData || selectedArtists.length === 0) return;
    
    setGeneratingPlaylist(true);
    
    try {
      // Filter to only include selected artists
      const filteredData = {
        ...discoveryData,
        similarArtists: discoveryData.similarArtists.filter(
          artist => selectedArtists.includes(artist.id)
        )
      };
      
      // Prepare tracks for playlist
      const playlistData = prepareTracksForPlaylist(
        filteredData,
        tracksPerArtist,
        true
      );
      
      setPlaylistTracks(playlistData);
      setShowCreatePlaylist(false);
      setPlaylistCreateSuccess(null);
      
      // Store data for playlist creation
      storeTrackDataForPlaylist(
        playlistData,
        `${discoveryData.sourceArtist.name} Mix`
      );
      
      // Show success toast
      showSuccess(`Generated playlist with ${playlistData.totalTracks} tracks from ${playlistData.artistDistribution.length} artists`);
    } catch (err) {
      console.error('Error generating playlist:', err);
      showError(`Error generating playlist: ${err.message || 'Unknown error'}`);
    } finally {
      setGeneratingPlaylist(false);
    }
  };

  // Handle playlist creation success
  const handlePlaylistSuccess = (playlist) => {
    console.log('Playlist created successfully:', playlist);
    setPlaylistCreateSuccess(playlist);
    setShowCreatePlaylist(false);
    
    // Show success toast
    showSuccess(
      `Playlist "${playlist.name}" created successfully with ${playlist.addedTracks} tracks!`
    );
  };

  // Handle playlist creation error
  const handlePlaylistError = (error) => {
    console.error('Error creating playlist:', error);
    
    // Show error toast
    showError(`Failed to create playlist: ${error.message || 'Unknown error'}`);
  };

  // Format track duration
  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
  };

  // Handle advanced create button click
  const handleAdvancedCreate = () => {
    setShowCreatePlaylist(true);
  };

  if (loading) {
    return (
      <div className="similar-artists-loading">
        <LoadingSpinner 
          size="large" 
          text={`Discovering artists similar to ${artist.name}...`} 
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="similar-artists-error">
        <div className="error-icon">!</div>
        <h3>Error Finding Similar Artists</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  if (!discoveryData || discoveryData.similarArtists.length === 0) {
    return (
      <div className="no-similar-artists">
        <div className="empty-state-icon">🔍</div>
        <h3>No Similar Artists Found</h3>
        <p>We couldn't find any artists similar to {artist.name}.</p>
        <p>Try searching for a different artist with more genre information.</p>
      </div>
    );
  }

  if (showCreatePlaylist && playlistTracks) {
    return (
      <CreatePlaylist 
        playlistData={playlistTracks}
        onSuccess={handlePlaylistSuccess}
        onCancel={() => setShowCreatePlaylist(false)}
      />
    );
  }

  return (
    <div className="similar-artists-container">
      <div className="similar-artists-header">
        <h2>Artists Similar to {artist.name}</h2>
        <p>Based on genre: {discoveryData.sourceArtist.genres.slice(0, 2).join(', ')}</p>
        <p className="selection-hint">Select artists to include in your custom playlist</p>
      </div>
      
      <div className="playlist-controls">
        <div className="tracks-per-artist-control">
          <label htmlFor="tracks-per-artist">Tracks per artist:</label>
          <select 
            id="tracks-per-artist"
            value={tracksPerArtist}
            onChange={(e) => setTracksPerArtist(Number(e.target.value))}
            disabled={generatingPlaylist}
          >
            <option value="1">1 track</option>
            <option value="2">2 tracks</option>
            <option value="3">3 tracks</option>
            <option value="5">5 tracks</option>
          </select>
        </div>
        
        <div className="selection-controls">
          <button 
            onClick={() => setSelectedArtists(discoveryData.similarArtists.map(a => a.id))}
            className="select-all-button"
            disabled={generatingPlaylist}
          >
            Select All
          </button>
          <button 
            onClick={() => setSelectedArtists([])}
            className="clear-selection-button"
            disabled={generatingPlaylist}
          >
            Clear Selection
          </button>
        </div>
        
        <button 
          onClick={generatePlaylist}
          disabled={selectedArtists.length === 0 || generatingPlaylist}
          className={`generate-playlist-button ${selectedArtists.length === 0 || generatingPlaylist ? 'disabled' : ''}`}
        >
          {generatingPlaylist ? (
            <>
              <span className="button-spinner"></span>
              Generating...
            </>
          ) : (
            `Generate Playlist (${selectedArtists.length} artists)`
          )}
        </button>
      </div>
      
      <div className="similar-artists-grid">
        {discoveryData.similarArtists.map(similarArtist => (
          <div 
            key={similarArtist.id}
            className={`similar-artist-card ${selectedArtists.includes(similarArtist.id) ? 'selected' : ''} ${generatingPlaylist ? 'disabled' : ''}`}
            onClick={() => !generatingPlaylist && toggleArtistSelection(similarArtist.id)}
          >
            <div className="artist-select-indicator"></div>
            {similarArtist.images && similarArtist.images.length > 0 ? (
              <img 
                src={similarArtist.images[1]?.url || similarArtist.images[0].url} 
                alt={similarArtist.name}
                className="similar-artist-image" 
              />
            ) : (
              <div className="similar-artist-image-placeholder"></div>
            )}
            
            <div className="similar-artist-info">
              <h3>{similarArtist.name}</h3>
              <p className="similar-artist-genres">
                {similarArtist.genres?.slice(0, 2).join(', ') || 'No genres'}
              </p>
              <p className="similar-artist-tracks-count">
                {similarArtist.topTracks?.length || 0} top tracks available
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {playlistTracks && (
        <div className="generated-playlist">
          <div className="playlist-header">
            <h3>Generated Playlist: {discoveryData.sourceArtist.name} Mix</h3>
            <p className="playlist-stats">
              {playlistTracks.totalTracks} tracks from {playlistTracks.artistDistribution.length} artists
            </p>
          </div>
          
          {playlistCreateSuccess ? (
            <div className="playlist-success-message">
              <div className="success-icon">✓</div>
              <h4>Playlist Created Successfully!</h4>
              <p>"{playlistCreateSuccess.name}" has been added to your Spotify account.</p>
              <a 
                href={playlistCreateSuccess.external_urls.spotify} 
                target="_blank" 
                rel="noopener noreferrer"
                className="view-playlist-link"
              >
                Open in Spotify
              </a>
            </div>
          ) : (
            <AuthContainer>
              <QuickCreatePlaylist 
                playlistData={playlistTracks}
                onSuccess={handlePlaylistSuccess}
                onError={handlePlaylistError}
              />
            </AuthContainer>
          )}
          
          <div className="playlist-tracks-container">
            <div className="playlist-tracks-header">
              <h4>Tracks in Playlist</h4>
              {!playlistCreateSuccess && (
                <AuthContainer>
                  <button 
                    onClick={handleAdvancedCreate} 
                    className="advanced-create-button"
                  >
                    Advanced Options
                  </button>
                </AuthContainer>
              )}
            </div>
            
            <ul className="playlist-tracks-list">
              {playlistTracks.tracks.map((track, index) => (
                <li key={`${track.id}-${index}`} className="playlist-track-item">
                  <span className="track-number">{index + 1}</span>
                  <div className="track-info">
                    <div className="track-primary">
                      <span className="track-name">{track.name}</span>
                      <span className="track-duration">{formatDuration(track.duration_ms)}</span>
                    </div>
                    <span className="track-artist">{track.artistName}</span>
                  </div>
                </li>
              ))}
            </ul>
            
            {!playlistCreateSuccess && (
              <div className="playlist-regenerate">
                <button 
                  className="regenerate-button"
                  onClick={() => setPlaylistTracks(null)}
                >
                  Regenerate Playlist
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SimilarArtists;
