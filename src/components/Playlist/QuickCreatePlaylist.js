// src/components/Playlist/QuickCreatePlaylist.js (updated)
import React, { useState } from 'react';
import { createSpotifyPlaylist } from '../../services/playlistService';
import LoadingSpinner from '../UI/LoadingSpinner';
import './QuickCreatePlaylist.css';

const QuickCreatePlaylist = ({ playlistData, onSuccess, onError }) => {
  const [creating, setCreating] = useState(false);
  const [createdPlaylist, setCreatedPlaylist] = useState(null);
  const [error, setError] = useState(null);

  const handleCreatePlaylist = async () => {
    setCreating(true);
    setError(null);
    
    try {
      // Generate a playlist name based on current date and time
      const formattedDate = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      
      const options = {
        name: `${playlistData.sourceArtistName} Mix • ${formattedDate}`,
        description: `A curated mix of tracks inspired by ${playlistData.sourceArtistName}, featuring ${playlistData.artistDistribution.length} similar artists. Created with Spotify Explorer.`
      };
      
      // Create the playlist
      const playlist = await createSpotifyPlaylist(playlistData, options);
      
      // Set the created playlist
      setCreatedPlaylist(playlist);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(playlist);
      }
    } catch (err) {
      console.error('Error creating playlist:', err);
      setError(err.message || 'Failed to create playlist');
      
      // Call error callback if provided
      if (onError) {
        onError(err);
      }
    } finally {
      setCreating(false);
    }
  };

  if (createdPlaylist) {
    return (
      <div className="quick-create-success">
        <div className="success-icon">✅</div>
        <h3>Playlist Created!</h3>
        <p>
          Your playlist "{createdPlaylist.name}" has been created with {createdPlaylist.addedTracks} tracks.
        </p>
        <div className="success-actions">
          <a
            href={createdPlaylist.external_urls.spotify}
            target="_blank"
            rel="noopener noreferrer"
            className="open-playlist-button"
          >
            Open in Spotify
          </a>
          <button
            onClick={() => setCreatedPlaylist(null)}
            className="create-another-button"
          >
            Create Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quick-create-container">
      <button
        onClick={handleCreatePlaylist}
        disabled={creating}
        className={`quick-create-button ${creating ? 'creating' : ''}`}
      >
        {creating ? (
          <>
            <LoadingSpinner size="small" />
            <span className="button-text">Creating Playlist...</span>
          </>
        ) : (
          'Create Playlist Now'
        )}
      </button>
      
      {error && (
        <div className="quick-create-error">
          <span className="error-icon">!</span>
          {error}
        </div>
      )}
      
      <div className="quick-create-details">
        <p>This will create a playlist with:</p>
        <ul>
          <li><strong>{playlistData.totalTracks} tracks</strong> from {playlistData.artistDistribution.length} similar artists</li>
          <li>Named: "<strong>{playlistData.sourceArtistName} Mix • {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</strong>"</li>
          <li>You can customize more settings with the advanced option below</li>
        </ul>
      </div>
    </div>
  );
};

export default QuickCreatePlaylist;
