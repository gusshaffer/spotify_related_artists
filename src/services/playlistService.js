// src/services/playlistService.js
import { getSpotifyApi } from './spotify';

/**
 * Creates a playlist in the user's Spotify account and adds tracks to it
 * 
 * @param {Object} playlistData - Data object containing tracks and metadata
 * @param {Object} options - Customization options for the playlist
 * @returns {Promise<Object>} The created playlist with additional metadata
 */
export const createSpotifyPlaylist = async (playlistData, options = {}) => {
  try {
    if (!playlistData || !playlistData.trackUris || playlistData.trackUris.length === 0) {
      throw new Error('No tracks available for playlist creation');
    }

    const spotify = await getSpotifyApi();
    
    // Get current user information
    const user = await spotify.getMe();
    
    // Generate playlist name if not provided
    const sourceArtistName = playlistData.sourceArtistName || 'Custom';
    const playlistName = options.name || `${sourceArtistName} Mix • ${new Date().toLocaleDateString()}`;
    
    // Create description if not provided
    const description = options.description || 
      `Playlist inspired by ${sourceArtistName} featuring ${playlistData.artistDistribution.length} similar artists. Created via Spotify Explorer.`;
    
    // Default to public playlist unless specified
    const isPublic = options.public !== undefined ? options.public : true;
    
    // Step 1: Create an empty playlist
    const playlist = await spotify.createPlaylist(user.id, {
      name: playlistName,
      description: description,
      public: isPublic
    });
    
    // Step 2: Add tracks to the playlist
    // Spotify API can only handle 100 tracks at a time, so we chunk the requests
    const trackUris = playlistData.trackUris;
    const chunkSize = 100;
    
    for (let i = 0; i < trackUris.length; i += chunkSize) {
      const chunk = trackUris.slice(i, i + chunkSize);
      await spotify.addTracksToPlaylist(playlist.id, chunk);
    }
    
    // Return enhanced playlist object with additional metadata
    return {
      ...playlist,
      addedTracks: trackUris.length,
      addedArtists: playlistData.artistDistribution.length,
      sourceArtist: playlistData.sourceArtistName,
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error creating playlist:', error);
    throw new Error(`Failed to create playlist: ${error.message}`);
  }
};

/**
 * Checks if the user has the necessary permissions to create playlists
 * 
 * @returns {Promise<boolean>} True if the user can create playlists
 */
export const canUserCreatePlaylists = async () => {
  try {
    const spotify = await getSpotifyApi();
    const user = await spotify.getMe();
    
    // Check for product type (premium users always have playlist creation rights)
    // Note: This is a simple check, actual permission might depend on other factors
    return user.product === 'premium' || true; // For now, assume all users can create playlists
  } catch (error) {
    console.error('Error checking playlist permissions:', error);
    return false;
  }
};
