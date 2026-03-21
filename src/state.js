const ARTISTS_KEY = 'concert_tracker_artists';

/**
 * App state — single source of truth.
 * API keys are now server-side only (Vercel env vars).
 * Artists are stored as { id, name, seatgeekId, socials } objects.
 */
export const state = {
  artists: loadArtists(),
  shows: [],
  activeFilter: null,
  loading: false,
  error: null,
  noShowArtists: [],
};

function loadArtists() {
  try {
    const raw = localStorage.getItem(ARTISTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (parsed.length > 0 && typeof parsed[0] === 'string') {
      return parsed.map((name) => ({ id: null, name, seatgeekId: null }));
    }
    return parsed;
  } catch {
    return [];
  }
}

export function saveArtists() {
  localStorage.setItem(ARTISTS_KEY, JSON.stringify(state.artists));
}
