const ARTISTS_KEY = 'concert_tracker_artists';
const API_KEY_KEY = 'concert_tracker_api_key';

const DEFAULT_API_KEY = 'XR2dT3GWFrZAGxcnGJs940nDRG6lxdTH';

/**
 * App state — single source of truth.
 * Artists are stored as { id, name } objects (attraction ID + display name).
 */
export const state = {
  apiKey: localStorage.getItem(API_KEY_KEY) || DEFAULT_API_KEY,
  artists: loadArtists(),
  shows: [],
  activeFilter: null,
  loading: false,
  error: null,
};

function loadArtists() {
  try {
    const raw = localStorage.getItem(ARTISTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Migration: if old format (array of strings), return empty — user re-adds with new search
    if (parsed.length > 0 && typeof parsed[0] === 'string') {
      return parsed.map((name) => ({ id: null, name }));
    }
    return parsed;
  } catch {
    return [];
  }
}

export function saveArtists() {
  localStorage.setItem(ARTISTS_KEY, JSON.stringify(state.artists));
}

export function saveApiKey(key) {
  state.apiKey = key;
  localStorage.setItem(API_KEY_KEY, key);
}
