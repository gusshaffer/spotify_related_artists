// src/components/Artist/RelatedArtists.js (updated)
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  getRelatedArtistsWithTracks,
  prepareTracksForPlaylist,
  storeTrackDataForPlaylist
} from '../../services/relatedArtistsService';
import CreatePlaylist from '../Playlist/CreatePlaylist';
import './RelatedArtists.css';

const RelatedArtists = ({ artist, onSelectArtist }) => {
  const [relatedData, setRelatedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [playlistTracks, setPlaylistTracks] = useState(null);
  const [tracksPerArtist, setTracksPerArtist] = useState(2);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);

  // Fetch related artists when the selected artist changes
  useEffect(() => {
    const fetchRelatedArtists = async () => {
      if (!artist || !artist.id) return;
      
      setLoading(true);
      setError(null);
      setRelatedData(null);
      setSelectedArtists([]);
      setPlaylistTracks(null);
      setShowCreatePlaylist(false);
      
      try {
        // Fetch related artists with their top tracks
        const data = await getRelatedArtistsWithTracks(artist.id, 15, 10);
        setRelatedData(data);
        
        // Auto-select first 5 artists by default
        if (data.relatedArtists && data.relatedArtists.length > 0) {
          setSelectedArtists(data.relatedArtists.slice(0, 5).map(a => a.id));
        }
      } catch (err) {
        console.error('Error fetching related artists:', err);
        setError(err.message || 'Failed to load related artists');
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedArtists();
  }, [artist]);

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
  };

  // Generate a playlist from selected artists
  const generatePlaylist = () => {
    if (!relatedData || selectedArtists.length === 0) return;
    
    // Filter to only include selected artists
    const filteredData = {
      ...relatedData,
      relatedArtists: relatedData.relatedArtists.filter(
        artist => selectedArtists.includes(artist.id)
      )
    };
    
    // Prepare tracks for playlist
    const playlistData = prepareTracksForPlaylist(
      filteredData,
      tracksPerArtist,
      true
    );
    
    // Add the source artist name for reference
    playlistData.artistName = artist.name;
    
    setPlaylistTracks(playlistData);
    setShowCreatePlaylist(false);
    
    // Store data for playlist creation
    storeTrackDataForPlaylist(
      playlistData,
      `${artist.name} Mix`
    );
  };

  // Handle playlist creation success
  const handlePlaylistSuccess = (playlist) => {
    console.log('Playlist created successfully:', playlist);
    // You could add additional functionality here, like analytics
  };

  // Format track duration
  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
  };

  // Handle create on Spotify button click
  const handleCreateOnSpotify = () => {
    setShowCreatePlaylist(true);
  };

  if (loading) {
    return (
      <div className="related-artists-loading">
        <div className="spinner"></div>
        <p>Discovering related artists...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="related-artists-error">
        <p>Error: {error}</p>
        <button onClick={() => window.location.reload()} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  if (!relatedData || relatedData.relatedArtists.length === 0) {
    return (
      <div className="no-related-artists">
        <p>No related artists found for {artist.name}.</p>
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
    <div className="related-artists-container">
      <div className="related-artists-header">
        <h2>Artists Similar to {artist.name}</h2>
        <p>Select artists to include in your custom playlist</p>
      </div>
      
      <div className="playlist-controls">
        <div className="tracks-per-artist-control">
          <label htmlFor="tracks-per-artist">Tracks per artist:</label>
          <select 
            id="tracks-per-artist"
            value={tracksPerArtist}
            onChange={(e) => setTracksPerArtist(Number(e.target.value))}
          >
            <option value="1">1 track</option>
            <option value="2">2 tracks</option>
            <option value="3">3 tracks</option>
            <option value="5">5 tracks</option>
          </select>
        </div>
        
        <div className="selection-controls">
          <button 
            onClick={() => setSelectedArtists(relatedData.relatedArtists.map(a => a.id))}
            className="select-all-button"
          >
            Select All
          </button>
          <button 
            onClick={() => setSelectedArtists([])}
            className="clear-selection-button"
          >
            Clear Selection
          </button>
        </div>
        
        <button 
          onClick={generatePlaylist}
          disabled={selectedArtists.length === 0}
          className={`generate-playlist-button ${selectedArtists.length === 0 ? 'disabled' : ''}`}
        >
          Generate Playlist ({selectedArtists.length} artists)
        </button>
      </div>
      
      <div className="related-artists-grid">
        {relatedData.relatedArtists.map(relatedArtist => (
          <div 
            key={relatedArtist.id}
            className={`related-artist-card ${selectedArtists.includes(relatedArtist.id) ? 'selected' : ''}`}
            onClick={() => toggleArtistSelection(relatedArtist.id)}
          >
            <div className="artist-select-indicator"></div>
            {relatedArtist.images && relatedArtist.images.length > 0 ? (
              <img 
                src={relatedArtist.images[1]?.url || relatedArtist.images[0].url} 
                alt={relatedArtist.name}
                className="related-artist-image" 
              />
            ) : (
              <div className="related-artist-image-placeholder"></div>
            )}
            
            <div className="related-artist-info">
              <h3>{relatedArtist.name}</h3>
              <p className="related-artist-genres">
                {relatedArtist.genres?.slice(0, 2).join(', ') || 'No genres'}
              </p>
              <p className="related-artist-tracks-count">
                {relatedArtist.topTracks?.length || 0} top tracks available
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {playlistTracks && (
        <div className="generated-playlist">
          <div className="playlist-header">
            <h3>Generated Playlist: {artist.name} Mix</h3>
            <p className="playlist-stats">
              {playlistTracks.totalTracks} tracks from {playlistTracks.artistDistribution.length} artists
            </p>
          </div>
          
          <div className="playlist-tracks-container">
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
            
            <div className="playlist-actions">
              <button 
                className="playlist-action-button primary"
                onClick={handleCreateOnSpotify}
              >
                Create on Spotify
              </button>
              <button 
                className="playlist-action-button secondary"
                onClick={() => setPlaylistTracks(null)}
              >
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RelatedArtists;
