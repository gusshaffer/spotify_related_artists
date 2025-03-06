// src/services/relatedArtistsService.js
import { getSpotifyApi } from './spotify';

/**
 * Fetches related artists for a given artist ID
 * @param {string} artistId - Spotify artist ID
 * @returns {Promise<Object[]>} Array of related artist objects
 */
export const getRelatedArtists = async (artistId) => {
  try {
    const spotify = await getSpotifyApi();
    const response = await spotify.getArtistRelatedArtists(artistId);
    return response.artists || [];
  } catch (error) {
    console.error('Error fetching related artists:', error);
    throw new Error(`Failed to fetch related artists: ${error.message}`);
  }
};

/**
 * Fetches top tracks for a given artist ID (defaulting to US market)
 * @param {string} artistId - Spotify artist ID
 * @param {string} market - Market code (default: 'US')
 * @returns {Promise<Object[]>} Array of track objects
 */
export const getArtistTopTracks = async (artistId, market = 'US') => {
  try {
    const spotify = await getSpotifyApi();
    const response = await spotify.getArtistTopTracks(artistId, market);
    return response.tracks || [];
  } catch (error) {
    console.error(`Error fetching top tracks for artist ${artistId}:`, error);
    throw new Error(`Failed to fetch top tracks: ${error.message}`);
  }
};

/**
 * Fetches related artists and their top tracks for a given artist
 * @param {string} artistId - Spotify artist ID
 * @param {number} limit - Maximum number of related artists to fetch (default: 10)
 * @param {number} tracksPerArtist - Number of top tracks to fetch per artist (default: 10)
 * @returns {Promise<Object>} Object containing related artists with their top tracks
 */
export const getRelatedArtistsWithTracks = async (
  artistId,
  limit = 10,
  tracksPerArtist = 10
) => {
  try {
    // Get related artists
    const relatedArtists = await getRelatedArtists(artistId);
    
    // Limit the number of related artists
    const limitedArtists = relatedArtists.slice(0, limit);
    
    // Fetch top tracks for each related artist
    const artistsWithTracks = await Promise.all(
      limitedArtists.map(async (artist) => {
        try {
          const topTracks = await getArtistTopTracks(artist.id);
          return {
            ...artist,
            topTracks: topTracks.slice(0, tracksPerArtist)
          };
        } catch (error) {
          console.warn(`Could not fetch top tracks for ${artist.name}:`, error);
          return {
            ...artist,
            topTracks: [],
            error: error.message
          };
        }
      })
    );
    
    return {
      sourceArtistId: artistId,
      relatedArtists: artistsWithTracks,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in getRelatedArtistsWithTracks:', error);
    throw error;
  }
};

/**
 * Extracts and prepares tracks from related artists data for playlist creation
 * @param {Object} relatedArtistsData - Data from getRelatedArtistsWithTracks
 * @param {number} tracksPerArtist - Max tracks to include per artist (default: 2)
 * @param {boolean} shuffle - Whether to shuffle the tracks (default: true)
 * @returns {Object} Structured data for playlist creation
 */
export const prepareTracksForPlaylist = (
  relatedArtistsData,
  tracksPerArtist = 2,
  shuffle = true
) => {
  if (!relatedArtistsData || !relatedArtistsData.relatedArtists) {
    throw new Error('Invalid related artists data');
  }

  // Extract tracks from each artist
  let allTracks = [];
  const artistTrackMap = {};

  relatedArtistsData.relatedArtists.forEach(artist => {
    if (!artist.topTracks || !Array.isArray(artist.topTracks)) return;
    
    // Store artist's tracks separately for balanced selection
    artistTrackMap[artist.id] = artist.topTracks.map(track => ({
      ...track,
      artistName: artist.name,
      artistId: artist.id
    }));
  });

  // Get a balanced selection of tracks from each artist
  Object.values(artistTrackMap).forEach(tracks => {
    if (tracks.length > 0) {
      // Take up to tracksPerArtist from each artist
      const selectedTracks = tracks.slice(0, tracksPerArtist);
      allTracks = [...allTracks, ...selectedTracks];
    }
  });

  // Shuffle the tracks if requested
  if (shuffle && allTracks.length > 0) {
    for (let i = allTracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allTracks[i], allTracks[j]] = [allTracks[j], allTracks[i]];
    }
  }

  // Structure the data for playlist creation
  return {
    sourceArtistId: relatedArtistsData.sourceArtistId,
    tracks: allTracks,
    totalTracks: allTracks.length,
    trackUris: allTracks.map(track => track.uri),
    artistDistribution: Object.entries(artistTrackMap).map(([artistId, tracks]) => ({
      artistId,
      artistName: tracks[0]?.artistName || "Unknown Artist",
      trackCount: Math.min(tracks.length, tracksPerArtist)
    })),
    timestamp: new Date().toISOString()
  };
};

/**
 * Store track data in localStorage for later use
 * @param {Object} playlistData - Data from prepareTracksForPlaylist
 * @param {string} name - Name to identify the stored data
 */
export const storeTrackDataForPlaylist = (playlistData, name) => {
  try {
    const key = `spotify_playlist_data_${name.replace(/\s+/g, '_').toLowerCase()}`;
    localStorage.setItem(key, JSON.stringify({
      ...playlistData,
      storageTimestamp: new Date().toISOString()
    }));
    return key;
  } catch (error) {
    console.error('Failed to store playlist data:', error);
    throw new Error('Failed to store playlist data');
  }
};

/**
 * Retrieve stored playlist data from localStorage
 * @param {string} name - Name identifier used during storage
 * @returns {Object|null} The stored playlist data or null if not found
 */
export const getStoredPlaylistData = (name) => {
  try {
    const key = `spotify_playlist_data_${name.replace(/\s+/g, '_').toLowerCase()}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to retrieve stored playlist data:', error);
    return null;
  }
};
