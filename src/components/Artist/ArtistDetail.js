// src/components/Artist/ArtistDetail.js (updated)
import React, { useState, useEffect } from 'react';
import { getSpotifyApi } from '../../services/spotify';
import SimilarArtists from './SimilarArtists';
import './ArtistDetail.css';

const ArtistDetail = ({ artist, onSelectArtist }) => {
  const [topTracks, setTopTracks] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    if (!artist) return;

    const fetchArtistData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const spotify = await getSpotifyApi();
        
        // Get top tracks
        const tracksResponse = await spotify.getArtistTopTracks(artist.id, 'US');
        setTopTracks(tracksResponse.tracks);
        
        // Get albums
        const albumsResponse = await spotify.getArtistAlbums(artist.id, { 
          include_groups: 'album,single', 
          limit: 6 
        });
        setAlbums(albumsResponse.items);
      } catch (err) {
        console.error('Error fetching artist data:', err);
        setError('Failed to load artist data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchArtistData();
    // Reset to overview section when artist changes
    setActiveSection('overview');
  }, [artist]);

  // Handle playlist creation from SimilarArtists component
  const handleCreatePlaylist = (playlistData, storageKey) => {
    console.log('Playlist data ready for creation:', playlistData);
    console.log('Storage key:', storageKey);
    // In a real app, we would add code here to create the playlist in Spotify
    // or navigate to a playlist creation page
  };

  if (!artist) {
    return null;
  }

  // Format duration from milliseconds to MM:SS
  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
  };

  return (
    <div className="artist-detail">
      <div className="artist-header">
        {artist.images && artist.images.length > 0 ? (
          <img 
            src={artist.images[0].url} 
            alt={artist.name} 
            className="artist-image"
          />
        ) : (
          <div className="artist-image-placeholder"></div>
        )}
        
        <div className="artist-header-info">
          <h1 className="artist-name">{artist.name}</h1>
          <div className="artist-meta">
            <span className="artist-followers">
              {artist.followers?.total.toLocaleString()} followers
            </span>
            {artist.popularity && (
              <span className="artist-popularity">
                Popularity: {artist.popularity}/100
              </span>
            )}
          </div>
          
          {artist.genres && artist.genres.length > 0 && (
            <div className="artist-genres">
              {artist.genres.map(genre => (
                <span key={genre} className="genre-tag">
                  {genre}
                </span>
              ))}
            </div>
          )}
          
          {artist.external_urls && artist.external_urls.spotify && (
            <a 
              href={artist.external_urls.spotify} 
              target="_blank" 
              rel="noopener noreferrer"
              className="spotify-link"
            >
              View on Spotify
            </a>
          )}
        </div>
      </div>

      <div className="artist-nav">
        <button 
          className={`artist-nav-button ${activeSection === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSection('overview')}
        >
          Overview
        </button>
        <button 
          className={`artist-nav-button ${activeSection === 'similar' ? 'active' : ''}`}
          onClick={() => setActiveSection('similar')}
        >
          Similar Artists
        </button>
      </div>

      {activeSection === 'overview' && (
        <>
          {loading ? (
            <div className="loading-section">
              <div className="spinner"></div>
              <p>Loading artist data...</p>
            </div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <div className="artist-content">
              <section className="top-tracks-section">
                <h2 className="section-title">Top Tracks</h2>
                {topTracks.length === 0 ? (
                  <p className="no-content">No tracks available</p>
                ) : (
                  <ul className="top-tracks-list">
                    {topTracks.slice(0, 5).map(track => (
                      <li key={track.id} className="track-item">
                        <img 
                          src={track.album.images[2].url} 
                          alt={track.album.name} 
                          className="track-album-image" 
                        />
                        <div className="track-info">
                          <div className="track-name-row">
                            <span className="track-name">{track.name}</span>
                            <span className="track-duration">{formatDuration(track.duration_ms)}</span>
                          </div>
                          <span className="track-album">{track.album.name}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="albums-section">
                <h2 className="section-title">Albums</h2>
                {albums.length === 0 ? (
                  <p className="no-content">No albums available</p>
                ) : (
                  <div className="albums-grid">
                    {albums.map(album => (
                      <div key={album.id} className="album-card">
                        {album.images && album.images.length > 0 ? (
                          <img 
                            src={album.images[1].url} 
                            alt={album.name} 
                            className="album-image" 
                          />
                        ) : (
                          <div className="album-image-placeholder"></div>
                        )}
                        <div className="album-name">{album.name}</div>
                        <div className="album-year">
                          {new Date(album.release_date).getFullYear()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </>
      )}

      {activeSection === 'similar' && (
        <SimilarArtists 
          artist={artist} 
          onCreatePlaylist={handleCreatePlaylist}
          onSelectArtist={onSelectArtist}
        />
      )}
    </div>
  );
};

export default ArtistDetail;
