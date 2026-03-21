import { fetchEventsByAttractionId, searchAttractions, getBestImage } from './api.js';
import { state, saveArtists } from './state.js';

const gradients = [
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  'linear-gradient(135deg, #2d132c 0%, #801336 50%, #c72c41 100%)',
  'linear-gradient(135deg, #0f0f23 0%, #1e3a5f 50%, #3d5a80 100%)',
  'linear-gradient(135deg, #1a0a0a 0%, #4a1942 50%, #2d132c 100%)',
  'linear-gradient(135deg, #0d1b2a 0%, #1b263b 50%, #415a77 100%)',
  'linear-gradient(135deg, #10002b 0%, #240046 50%, #3c096c 100%)',
  'linear-gradient(135deg, #1b1b1b 0%, #2e2e2e 50%, #4a4a4a 100%)',
  'linear-gradient(135deg, #0a1628 0%, #1a365d 50%, #2c5282 100%)',
  'linear-gradient(135deg, #1a0000 0%, #4a0e0e 50%, #7f1d1d 100%)',
  'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
  'linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%)',
  'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
];

/**
 * Parse a single Ticketmaster event into our show format.
 */
function parseEvent(event, artistName, index) {
  const venue = event._embedded?.venues?.[0];
  const image = getBestImage(event.images);

  return {
    id: event.id,
    artist: artistName,
    name: event.name,
    venue: venue?.name || 'TBA',
    city: venue?.city?.name || '',
    state: venue?.state?.stateCode || '',
    country: venue?.country?.countryCode || '',
    date: new Date(event.dates?.start?.dateTime || event.dates?.start?.localDate),
    ticketUrl: event.url || '#',
    image,
    gradient: gradients[index % gradients.length],
  };
}

/**
 * Fetch shows for a single artist.
 * Uses attraction ID if available, falls back to keyword search.
 */
async function fetchArtistShows(artist) {
  try {
    let events;

    if (artist.id) {
      events = await fetchEventsByAttractionId(state.apiKey, artist.id);
    } else {
      // Legacy artists without IDs — try to resolve the ID first
      const attractions = await searchAttractions(state.apiKey, artist.name);
      if (attractions.length > 0) {
        const match = attractions[0];
        artist.id = match.id;
        saveArtists();
        events = await fetchEventsByAttractionId(state.apiKey, match.id);
      } else {
        events = [];
      }
    }

    return events.map((event, i) => parseEvent(event, artist.name, i));
  } catch (err) {
    console.error(`Error fetching ${artist.name}:`, err);
    if (err.message === 'Invalid API key') {
      state.error = 'Invalid API key. Please check and try again.';
    }
    return [];
  }
}

/**
 * Fetch shows for all tracked artists, dedupe and sort.
 */
export async function fetchAllShows(renderFn) {
  if (!state.apiKey || state.artists.length === 0) {
    state.shows = [];
    renderFn();
    return;
  }

  state.loading = true;
  state.error = null;
  renderFn();

  try {
    const allShows = await Promise.all(state.artists.map(fetchArtistShows));

    const showMap = new Map();
    allShows.flat().forEach((show) => {
      if (!showMap.has(show.id)) {
        showMap.set(show.id, show);
      }
    });

    state.shows = Array.from(showMap.values()).sort((a, b) => a.date - b.date);
    state.loading = false;
  } catch {
    state.error = 'Failed to fetch shows. Please try again.';
    state.loading = false;
  }

  renderFn();
}
