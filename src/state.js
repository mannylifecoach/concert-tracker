const ARTISTS_KEY = 'concert_tracker_artists';
const CITY_KEY = 'concert_tracker_city';

/**
 * App state — single source of truth.
 * API keys are now server-side only (Vercel env vars).
 * Artists are stored as { id, name, seatgeekId, socials } objects.
 */
export const state = {
  // View mode
  viewMode: 'artists', // 'artists' | 'nearby'

  // Artist view state
  artists: loadArtists(),
  shows: [],
  activeFilter: null,
  loading: false,
  error: null,
  noShowArtists: [],

  // Nearby view state
  citySearch: loadCitySearch(), // { name, lat, lon, radius } or null
  cityShows: [],
  cityLoading: false,
  cityError: null,

  // Announcements (buzz)
  announcements: [],
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

function loadCitySearch() {
  try {
    const raw = localStorage.getItem(CITY_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveArtists() {
  localStorage.setItem(ARTISTS_KEY, JSON.stringify(state.artists));
}

export function saveCitySearch() {
  if (state.citySearch) {
    localStorage.setItem(CITY_KEY, JSON.stringify(state.citySearch));
  } else {
    localStorage.removeItem(CITY_KEY);
  }
}
