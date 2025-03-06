// src/components/Playlist/CreatePlaylist.js (updated)
import React, { useState } from 'react';
import { createSpotifyPlaylist } from '../../services/playlistService';
import LoadingSpinner from '../UI/LoadingSpinner';
import './CreatePlaylist.css';

const CreatePlaylist = ({ playlistData, onSuccess, onCancel }) => {
  const [playlistName, setPlaylistName] = useState(
    `${playlistData.sourceArtistName || 'Custom'} Mix • ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  );
  const [playlistDescription, setPlaylistDescription] = useState(
    `A playlist featuring tracks similar to ${playlistData.sourceArtistName || 'your selection'}, created with Spotify Explorer.`
  );
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    
    if (!playlistData || !playlistData.trackUris || playlistData.trackUris.length === 0) {
      setError('No tracks available for playlist creation');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Use the playlist service to create the playlist
      const options = {
        name: playlistName,
        description: playlistDescription,
        public: isPublic
      };
      
      const playlist = await createSpotifyPlaylist(playlistData, options);
      
      // Success - store playlist info
      setSuccess(playlist);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(playlist);
      }
    } catch (err) {
      console.error('Error creating playlist:', err);
      setError(
        err.message || 'Failed to create playlist. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="create-playlist-success">
        <div className="success-icon">✓</div>
        <h2>Playlist Created!</h2>
        <p>
          Your playlist "{success.name}" with {success.addedTracks} tracks has been 
          successfully created on Spotify.
        </p>
        <div className="success-actions">
          <a 
            href={success.external_urls.spotify} 
            target="_blank" 
            rel="noopener noreferrer"
            className="open-playlist-button"
          >
            Open in Spotify
          </a>
          <button 
            onClick={onCancel} 
            className="create-another-button"
          >
            Back to Playlist Generator
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="create-playlist-container">
      <h2>Create Playlist on Spotify</h2>
      
      <div className="playlist-preview">
        <div className="playlist-preview-count">
          <span className="track-count">{playlistData.totalTracks}</span>
          <span className="track-label">Tracks</span>
        </div>
        <div className="playlist-preview-artists">
          <span className="artists-label">Artists included:</span>
          <div className="artists-list">
            {playlistData.artistDistribution.map(artist => (
              <span key={artist.artistId} className="artist-pill">
                {artist.artistName} ({artist.trackCount})
              </span>
            ))}
          </div>
        </div>
      </div>
      
      {error && (
        <div className="playlist-create-error">
          <span className="error-icon">!</span>
          {error}
        </div>
      )}
      
      <form onSubmit={handleCreatePlaylist} className="playlist-form">
        <div className="form-group">
          <label htmlFor="playlist-name">Playlist Name</label>
          <input
            id="playlist-name"
            type="text"
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
            required
            maxLength="100"
            className="form-control"
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="playlist-description">Description</label>
          <textarea
            id="playlist-description"
            value={playlistDescription}
            onChange={(e) => setPlaylistDescription(e.target.value)}
            maxLength="300"
            className="form-control"
            rows="3"
            disabled={loading}
          />
        </div>
        
        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              disabled={loading}
            />
            Make playlist public
          </label>
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            onClick={onCancel}
            className="cancel-button"
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="create-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <LoadingSpinner size="small" />
                <span className="button-text">Creating...</span>
              </>
            ) : (
              'Create Playlist'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePlaylist;
