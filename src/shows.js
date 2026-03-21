import { fetchEventsByAttractionId, searchAttractions, getBestImage } from './api.js';
import { fetchEventsByPerformerId, searchPerformers, getSeatGeekImage } from './seatgeek.js';
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

function parseTMEvent(event, artistName, index) {
  const venue = event._embedded?.venues?.[0];
  const image = getBestImage(event.images);

  return {
    id: `tm-${event.id}`,
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
    source: 'ticketmaster',
  };
}

function parseSGEvent(event, artistName, index) {
  const venue = event.venue || {};
  const image = getSeatGeekImage(event);

  return {
    id: `sg-${event.id}`,
    artist: artistName,
    name: event.title || event.short_title,
    venue: venue.name || 'TBA',
    city: venue.city || '',
    state: venue.state || '',
    country: venue.country || '',
    date: new Date(event.datetime_local || event.datetime_utc),
    ticketUrl: event.url || '#',
    image,
    gradient: gradients[index % gradients.length],
    source: 'seatgeek',
  };
}

async function resolveSeatGeekId(artist) {
  if (artist.seatgeekId) return artist.seatgeekId;

  try {
    const performers = await searchPerformers(artist.name);
    if (performers.length > 0) {
      artist.seatgeekId = performers[0].id;
      saveArtists();
      return artist.seatgeekId;
    }
  } catch (err) {
    console.error(`SeatGeek performer lookup failed for ${artist.name}:`, err);
  }
  return null;
}

async function fetchTMShows(artist) {
  try {
    let events;

    if (artist.id) {
      events = await fetchEventsByAttractionId(artist.id);
    } else {
      const attractions = await searchAttractions(artist.name);
      if (attractions.length > 0) {
        artist.id = attractions[0].id;
        saveArtists();
        events = await fetchEventsByAttractionId(artist.id);
      } else {
        events = [];
      }
    }

    return events.map((event, i) => parseTMEvent(event, artist.name, i));
  } catch (err) {
    console.error(`TM error for ${artist.name}:`, err);
    return [];
  }
}

async function fetchSGShows(artist) {
  try {
    const performerId = await resolveSeatGeekId(artist);
    if (!performerId) return [];

    const events = await fetchEventsByPerformerId(performerId);
    return events.map((event, i) => parseSGEvent(event, artist.name, i));
  } catch (err) {
    console.error(`SeatGeek error for ${artist.name}:`, err);
    return [];
  }
}

function dedupeShows(shows) {
  const deduped = new Map();

  for (const show of shows) {
    const dateStr = show.date instanceof Date && !isNaN(show.date)
      ? show.date.toISOString().slice(0, 10)
      : '';
    const key = `${show.artist.toLowerCase()}|${dateStr}|${show.city.toLowerCase()}`;

    if (deduped.has(key)) {
      const existing = deduped.get(key);
      if (show.source === 'seatgeek' && existing.source === 'ticketmaster') {
        existing.altTicketUrl = show.ticketUrl;
        existing.altSource = 'seatgeek';
      } else if (show.source === 'ticketmaster' && existing.source === 'seatgeek') {
        show.altTicketUrl = existing.ticketUrl;
        show.altSource = 'seatgeek';
        if (!show.image && existing.image) show.image = existing.image;
        deduped.set(key, show);
      }
    } else {
      deduped.set(key, show);
    }
  }

  return Array.from(deduped.values());
}

export async function fetchAllShows(renderFn) {
  if (state.artists.length === 0) {
    state.shows = [];
    renderFn();
    return;
  }

  state.loading = true;
  state.error = null;
  renderFn();

  try {
    const [tmResults, sgResults] = await Promise.all([
      Promise.all(state.artists.map(fetchTMShows)),
      Promise.all(state.artists.map(fetchSGShows)),
    ]);

    const allShows = [...tmResults.flat(), ...sgResults.flat()];
    state.shows = dedupeShows(allShows).sort((a, b) => a.date - b.date);

    // Find artists with zero shows
    const artistsWithShows = new Set(state.shows.map((s) => s.artist.toLowerCase()));
    state.noShowArtists = state.artists
      .filter((a) => !artistsWithShows.has(a.name.toLowerCase()))
      .map((a) => a.name);

    state.loading = false;
  } catch {
    state.error = 'Failed to fetch shows. Please try again.';
    state.loading = false;
  }

  renderFn();
}
