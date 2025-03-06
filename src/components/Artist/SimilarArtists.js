import React, { useState, useEffect } from 'react';
import { 
  discoverSimilarArtistsWithTracks,
  prepareTracksForPlaylist,
  storeTrackDataForPlaylist
} from '../../services/artistDiscoveryService';
import CreatePlaylist from '../Playlist/CreatePlaylist';
import './SimilarArtists.css';
import AuthContainer from '../Auth/AuthContainer';
import QuickCreatePlaylist from '../Playlist/QuickCreatePlaylist';


const SimilarArtists = ({ artist, onSelectArtist }) => {
  const [discoveryData, setDiscoveryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [playlistTracks, setPlaylistTracks] = useState(null);
  const [tracksPerArtist, setTracksPerArtist] = useState(2);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [playlistCreateSuccess, setPlaylistCreateSuccess] = useState(null);


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
        // Discover similar artists with their top tracks
        const data = await discoverSimilarArtistsWithTracks(artist.id, 15, 10);
        setDiscoveryData(data);
        
        // Auto-select first 5 artists by default
        if (data.similarArtists && data.similarArtists.length > 0) {
          setSelectedArtists(data.similarArtists.slice(0, 5).map(a => a.id));
        }
      } catch (err) {
        console.error('Error discovering similar artists:', err);
        setError(err.message || 'Failed to find similar artists');
      } finally {
        setLoading(false);
      }
    };

    fetchSimilarArtists();
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
    if (!discoveryData || selectedArtists.length === 0) return;
    
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
    
    // Store data for playlist creation
    storeTrackDataForPlaylist(
      playlistData,
      `${discoveryData.sourceArtist.name} Mix`
    );
  };

  // Handle playlist creation success
  const handlePlaylistSuccess = (playlist) => {
    console.log('Playlist created successfully:', playlist);
    // You could add additional functionality here, like analytics
  };

   // Handle playlist creation error
   const handlePlaylistError = (error) => {
    console.error('Error creating playlist:', error);
    // You could add additional error handling here
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

  // Handle create on Spotify button click
  const handleCreateOnSpotify = () => {
    setShowCreatePlaylist(true);
  };

  if (loading) {
    return (
      <div className="similar-artists-loading">
        <div className="spinner"></div>
        <p>Discovering artists similar to {artist.name}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="similar-artists-error">
        <p>Error: {error}</p>
        <button onClick={() => window.location.reload()} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  if (!discoveryData || discoveryData.similarArtists.length === 0) {
    return (
      <div className="no-similar-artists">
        <p>No similar artists found for {artist.name}.</p>
        <p>Try searching for a different artist.</p>
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
      
      <div className="similar-artists-grid">
        {discoveryData.similarArtists.map(similarArtist => (
          <div 
            key={similarArtist.id}
            className={`similar-artist-card ${selectedArtists.includes(similarArtist.id) ? 'selected' : ''}`}
            onClick={() => toggleArtistSelection(similarArtist.id)}
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
             <p>🎉 Successfully created playlist: "{playlistCreateSuccess.name}"</p>
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
       </div>)}
    </div>
  );
};

export default SimilarArtists;
