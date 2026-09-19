// A Spotify client ID is public. Never add a client secret here or to VITE_*.
export const CONFIG = {
    spotifyClientId: import.meta.env?.VITE_SPOTIFY_CLIENT_ID || '',
    spotifyRedirectUri: import.meta.env?.VITE_SPOTIFY_REDIRECT_URI || '',
    spotifyPlayback: import.meta.env?.VITE_SPOTIFY_PLAYBACK === 'true',
    applicationName: 'Auxcade',
};
