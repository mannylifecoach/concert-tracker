const ARTISTS_KEY = 'concert_tracker_artists';
const CITY_KEY = 'concert_tracker_city';
const VENUE_KEY = 'concert_tracker_venue';

/**
 * App state — single source of truth.
 * API keys are now server-side only (Vercel env vars).
 * Artists are stored as { id, name, seatgeekId, socials } objects.
 */
export const state = {
  // View mode
  viewMode: 'artists', // 'artists' | 'nearby' | 'venue'

  // Artist view state
  artists: loadArtists(),
  shows: [],
  activeFilter: null,
  loading: false,
  error: null,
  noShowArtists: [],
  announcementOnlyArtists: [],
  artistAnnouncements: {},

  // Nearby view state
  citySearch: loadCitySearch(), // { name, lat, lon, radius } or null
  cityShows: [],
  cityLoading: false,
  cityError: null,

  // Venue view state
  venueSearch: loadVenueSearch(), // { tmId, sgId, name, city, state, lat, lon } or null
  venueShows: [],
  venueLoading: false,
  venueError: null,

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

function loadVenueSearch() {
  try {
    const raw = localStorage.getItem(VENUE_KEY);
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

export function saveVenueSearch() {
  if (state.venueSearch) {
    localStorage.setItem(VENUE_KEY, JSON.stringify(state.venueSearch));
  } else {
    localStorage.removeItem(VENUE_KEY);
  }
}
