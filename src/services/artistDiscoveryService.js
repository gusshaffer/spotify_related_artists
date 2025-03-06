// src/services/artistDiscoveryService.js
import { getSpotifyApi } from './spotify';

/**
 * Fetches artist details by ID
 * @param {string} artistId - Spotify artist ID
 * @returns {Promise<Object>} The artist object
 */
export const getArtistDetails = async (artistId) => {
  try {
    const spotify = await getSpotifyApi();
    return await spotify.getArtist(artistId);
  } catch (error) {
    console.error('Error fetching artist details:', error);
    throw new Error(`Failed to fetch artist details: ${error.message}`);
  }
};

/**
 * Search for artists based on genre and name similarity
 * @param {Object} sourceArtist - The source artist object
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Object[]>} Array of artist objects
 */
export const findSimilarArtists = async (sourceArtist, limit = 20) => {
  if (!sourceArtist || !sourceArtist.genres) {
    throw new Error('Invalid source artist data');
  }

  try {
    const spotify = await getSpotifyApi();
    const results = [];
    
    // Use genres to find similar artists
    if (sourceArtist.genres && sourceArtist.genres.length > 0) {
      // Take top 2 genres for search
      for (const genre of sourceArtist.genres.slice(0, 2)) {
        // Search for this genre, excluding the source artist
        const response = await spotify.searchArtists(`genre:"${genre}" NOT "${sourceArtist.name}"`, { 
          limit: Math.ceil(limit/2) 
        });
        
        if (response.artists && response.artists.items) {
          results.push(...response.artists.items);
        }
      }
    }
    
    // If we don't have enough results, add some based on name/popularity
    if (results.length < limit) {
      const additionalArtistsNeeded = limit - results.length;
      
      // Search for artists with similar popularity or fanbase
      const additionalQuery = `NOT "${sourceArtist.name}"`;
      const additionalResponse = await spotify.searchArtists(additionalQuery, { 
        limit: additionalArtistsNeeded
      });
      
      if (additionalResponse.artists && additionalResponse.artists.items) {
        results.push(...additionalResponse.artists.items);
      }
    }
    
    // Remove duplicates
    const uniqueArtists = Array.from(
      new Map(results.map(artist => [artist.id, artist])).values()
    );
    
    // Sort by popularity
    return uniqueArtists
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
      
  } catch (error) {
    console.error('Error finding similar artists:', error);
    throw new Error(`Failed to find similar artists: ${error.message}`);
  }
};

/**
 * Fetches top tracks for an artist
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
 * Discovers similar artists and their top tracks based on a source artist
 * @param {string} artistId - Source artist Spotify ID
 * @param {number} limit - Maximum number of similar artists to fetch
 * @param {number} tracksPerArtist - Maximum number of top tracks per artist
 * @returns {Promise<Object>} Object containing similar artists with their top tracks
 */
export const discoverSimilarArtistsWithTracks = async (
  artistId,
  limit = 10,
  tracksPerArtist = 10
) => {
  try {
    // Get source artist details
    const sourceArtist = await getArtistDetails(artistId);
    
    // Find similar artists based on genres
    const similarArtists = await findSimilarArtists(sourceArtist, limit);
    
    // Fetch top tracks for each similar artist
    const artistsWithTracks = await Promise.all(
      similarArtists.map(async (artist) => {
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
      sourceArtist,
      similarArtists: artistsWithTracks,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error discovering similar artists:', error);
    throw error;
  }
};

/**
 * Extracts and prepares tracks from similar artists data for playlist creation
 * @param {Object} similarArtistsData - Data from discoverSimilarArtistsWithTracks
 * @param {number} tracksPerArtist - Max tracks to include per artist
 * @param {boolean} shuffle - Whether to shuffle the tracks
 * @returns {Object} Structured data for playlist creation
 */
export const prepareTracksForPlaylist = (
  similarArtistsData,
  tracksPerArtist = 2,
  shuffle = true
) => {
  if (!similarArtistsData || !similarArtistsData.similarArtists) {
    throw new Error('Invalid similar artists data');
  }

  // Extract tracks from each artist
  let allTracks = [];
  const artistTrackMap = {};

  similarArtistsData.similarArtists.forEach(artist => {
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
    sourceArtistId: similarArtistsData.sourceArtist.id,
    sourceArtistName: similarArtistsData.sourceArtist.name,
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
