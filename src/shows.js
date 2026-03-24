import { fetchEventsByAttractionId, searchAttractions, getBestImage, fetchEventsByLocation as fetchTMByLocation } from './api.js';
import { fetchEventsByPerformerId, searchPerformers, getSeatGeekImage, fetchEventsByLocation as fetchSGByLocation } from './seatgeek.js';
import { fetchEventsByArtist as fetchETByArtist, fetchEventsByLocation as fetchETByLocation } from './edmtrain.js';
import { state, saveArtists } from './state.js';
import { buildTickPickUrl, buildDiceUrl } from './ticketlinks.js';
import { fetchAllAnnouncements } from './announcements.js';

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

function isFestival(event) {
  const cls = event.classifications?.[0] || {};
  if (cls.subType?.name?.toLowerCase() === 'festival') return true;
  if (cls.genre?.name?.toLowerCase().includes('festival')) return true;
  const name = (event.name || event.title || '').toLowerCase();
  return /\bfest(ival)?\b/.test(name);
}

function getArtistSocials(artistName) {
  const artist = state.artists.find((a) => a.name.toLowerCase() === artistName.toLowerCase());
  return artist?.socials || {};
}

function parseTMEvent(event, artistName, index) {
  const venue = event._embedded?.venues?.[0];
  const image = getBestImage(event.images);
  const venueName = venue?.name || 'TBA';
  const socials = getArtistSocials(artistName);

  return {
    id: `tm-${event.id}`,
    artist: artistName,
    name: event.name,
    venue: venueName,
    city: venue?.city?.name || '',
    state: venue?.state?.stateCode || '',
    country: venue?.country?.countryCode || '',
    date: new Date(event.dates?.start?.dateTime || event.dates?.start?.localDate),
    ticketUrl: event.url || '#',
    image,
    gradient: gradients[index % gradients.length],
    source: 'ticketmaster',
    isFestival: isFestival(event),
    socials,
    artistHomepage: socials.homepage || null,
    tickPickUrl: buildTickPickUrl(artistName, venueName),
    diceUrl: buildDiceUrl(artistName),
  };
}

function parseSGEvent(event, artistName, index) {
  const venue = event.venue || {};
  const image = getSeatGeekImage(event);
  const venueName = venue.name || 'TBA';
  const socials = getArtistSocials(artistName);

  return {
    id: `sg-${event.id}`,
    artist: artistName,
    name: event.title || event.short_title,
    venue: venueName,
    city: venue.city || '',
    state: venue.state || '',
    country: venue.country || '',
    date: new Date(event.datetime_local || event.datetime_utc),
    ticketUrl: event.url || '#',
    image,
    gradient: gradients[index % gradients.length],
    source: 'seatgeek',
    isFestival: isFestival(event),
    socials,
    artistHomepage: socials.homepage || null,
    tickPickUrl: buildTickPickUrl(artistName, venueName),
    diceUrl: buildDiceUrl(artistName),
  };
}

function parseETEvent(event, artistName, index) {
  const venue = event.venue || {};
  const venueName = venue.name || 'TBA';
  const socials = getArtistSocials(artistName);

  return {
    id: `et-${event.id}`,
    artist: artistName,
    name: event.name || artistName,
    venue: venueName,
    city: venue.location || '',
    state: venue.state || '',
    country: venue.country || 'US',
    date: new Date(event.date),
    ticketUrl: event.link || '#',
    image: null,
    gradient: gradients[index % gradients.length],
    source: 'edmtrain',
    isFestival: event.festivalInd || false,
    socials,
    artistHomepage: socials.homepage || null,
    tickPickUrl: buildTickPickUrl(artistName, venueName),
    diceUrl: buildDiceUrl(artistName),
  };
}

function simplifyName(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim();
}

async function resolveSeatGeekId(artist) {
  if (artist.seatgeekId) return artist.seatgeekId;

  try {
    // Try exact name first
    let performers = await searchPerformers(artist.name);

    // Fallback: try simplified name (strip accents, special chars)
    if (performers.length === 0) {
      const simplified = simplifyName(artist.name);
      if (simplified !== artist.name) {
        console.log(`SeatGeek: no match for "${artist.name}", retrying as "${simplified}"`);
        performers = await searchPerformers(simplified);
      }
    }

    if (performers.length > 0) {
      console.log(`SeatGeek: matched "${artist.name}" → performer ID ${performers[0].id}`);
      artist.seatgeekId = performers[0].id;
      saveArtists();
      return artist.seatgeekId;
    }

    console.warn(`SeatGeek: no performer match found for "${artist.name}"`);
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

    console.log(`TM: ${events.length} events for "${artist.name}"`);
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
    console.log(`SG: ${events.length} events for "${artist.name}"`);
    return events.map((event, i) => parseSGEvent(event, artist.name, i));
  } catch (err) {
    console.error(`SeatGeek error for ${artist.name}:`, err);
    return [];
  }
}

async function fetchETShows(artist) {
  try {
    const events = await fetchETByArtist(artist.name);
    console.log(`ET: ${events.length} events for "${artist.name}"`);
    return events.map((event, i) => {
      // Use the matched artist name from the lineup if available
      const matchedArtist = event.artistList?.find(
        (a) => a.name.toLowerCase().includes(artist.name.toLowerCase()),
      );
      return parseETEvent(event, matchedArtist?.name || artist.name, i);
    });
  } catch (err) {
    console.error(`EDMTrain error for ${artist.name}:`, err);
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
        existing.isFestival = existing.isFestival || show.isFestival;
        if (!existing.artistHomepage) existing.artistHomepage = show.artistHomepage;
      } else if (show.source === 'ticketmaster' && existing.source === 'seatgeek') {
        show.altTicketUrl = existing.ticketUrl;
        show.altSource = 'seatgeek';
        show.isFestival = show.isFestival || existing.isFestival;
        if (!show.image && existing.image) show.image = existing.image;
        if (!show.artistHomepage) show.artistHomepage = existing.artistHomepage;
        deduped.set(key, show);
      }
    } else {
      deduped.set(key, show);
    }
  }

  return Array.from(deduped.values());
}

function parseTMCityEvent(event, index) {
  const artistName = event._embedded?.attractions?.[0]?.name || event.name || 'Unknown';
  return parseTMEvent(event, artistName, index);
}

function parseSGCityEvent(event, index) {
  const artistName = event.performers?.[0]?.name || event.short_title || event.title || 'Unknown';
  return parseSGEvent(event, artistName, index);
}

export async function fetchCityShows(renderFn) {
  if (!state.citySearch) {
    state.cityShows = [];
    renderFn();
    return;
  }

  state.cityLoading = true;
  state.cityError = null;
  renderFn();

  try {
    const { lat, lon, radius } = state.citySearch;

    const [tmEvents, sgEvents, etEvents] = await Promise.all([
      fetchTMByLocation(lat, lon, radius).catch((err) => {
        console.error('TM city search error:', err);
        return [];
      }),
      fetchSGByLocation(lat, lon, radius).catch((err) => {
        console.error('SG city search error:', err);
        return [];
      }),
      fetchETByLocation(lat, lon).catch((err) => {
        console.error('ET city search error:', err);
        return [];
      }),
    ]);

    const tmShows = tmEvents.map((e, i) => parseTMCityEvent(e, i));
    const sgShows = sgEvents.map((e, i) => parseSGCityEvent(e, i));
    const etShows = etEvents.map((e, i) => {
      const artistName = e.artistList?.[0]?.name || e.name || 'Unknown';
      return parseETEvent(e, artistName, i);
    });

    state.cityShows = dedupeShows([...tmShows, ...sgShows, ...etShows]).sort((a, b) => a.date - b.date);
    state.cityLoading = false;
  } catch {
    state.cityError = 'Failed to fetch nearby shows. Please try again.';
    state.cityLoading = false;
  }

  renderFn();
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
    // Fetch announcements alongside shows (with timeout so slow RSS doesn't block)
    const announcementPromise = fetchAllAnnouncements(state.artists.map((a) => a.name))
      .catch(() => []);
    const announcementTimeout = new Promise((resolve) => setTimeout(() => resolve([]), 5000));

    const [tmResults, sgResults, etResults, announcements] = await Promise.all([
      Promise.all(state.artists.map(fetchTMShows)),
      Promise.all(state.artists.map(fetchSGShows)),
      Promise.all(state.artists.map(fetchETShows)),
      Promise.race([announcementPromise, announcementTimeout]),
    ]);

    state.announcements = announcements;

    const allShows = [...tmResults.flat(), ...sgResults.flat(), ...etResults.flat()];
    state.shows = dedupeShows(allShows).sort((a, b) => a.date - b.date);

    // Find artists with zero shows
    const artistsWithShows = new Set(state.shows.map((s) => s.artist.toLowerCase()));
    const noShowArtistList = state.artists.filter((a) => !artistsWithShows.has(a.name.toLowerCase()));

    // Split no-show artists: those with announcements stay, others get removed
    const artistAnnouncements = {};
    const announcementOnly = [];
    const trulyNoShows = [];

    for (const artist of noShowArtistList) {
      const matched = announcements.filter((a) => a.artist.toLowerCase() === artist.name.toLowerCase());
      if (matched.length > 0) {
        announcementOnly.push(artist.name);
        artistAnnouncements[artist.name.toLowerCase()] = matched;
      } else {
        trulyNoShows.push(artist.name);
      }
    }

    state.announcementOnlyArtists = announcementOnly;
    state.artistAnnouncements = artistAnnouncements;
    state.noShowArtists = trulyNoShows;

    if (trulyNoShows.length > 0) {
      const keepSet = new Set([
        ...Array.from(artistsWithShows),
        ...announcementOnly.map((n) => n.toLowerCase()),
      ]);
      state.artists = state.artists.filter((a) => keepSet.has(a.name.toLowerCase()));
      saveArtists();
    }

    state.loading = false;
  } catch {
    state.error = 'Failed to fetch shows. Please try again.';
    state.loading = false;
  }

  renderFn();
}
