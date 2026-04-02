/**
 * Search SeatGeek performers by name via our serverless proxy.
 * Returns an array of { id, name, imageUrl }.
 */
export async function searchPerformers(query) {
  if (!query.trim()) return [];

  const params = new URLSearchParams({ action: 'search', query });
  const res = await fetch(`/api/seatgeek?${params}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to search SeatGeek performers');
  }

  const data = await res.json();
  return (data.performers || []).map((p) => ({
    id: String(p.id),
    name: p.name,
    imageUrl: p.image || null,
  }));
}

/**
 * Fetch upcoming events for a SeatGeek performer ID via our serverless proxy.
 */
export async function fetchEventsByPerformerId(performerId) {
  const params = new URLSearchParams({ action: 'events', performerId });
  const res = await fetch(`/api/seatgeek?${params}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch SeatGeek events');
  }

  const data = await res.json();
  return data.events || [];
}

/**
 * Fetch music events near a location via our serverless proxy.
 */
export async function fetchEventsByLocation(lat, lon, radius) {
  const params = new URLSearchParams({ action: 'cityEvents', lat, lon, radius: String(radius) });
  const res = await fetch(`/api/seatgeek?${params}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch nearby SeatGeek events');
  }

  const data = await res.json();
  return data.events || [];
}

/**
 * Search for SeatGeek venues by name via our serverless proxy.
 * Returns an array of { id, name, city, state, country, lat, lon }.
 */
export async function searchSGVenues(query) {
  if (!query.trim()) return [];

  const params = new URLSearchParams({ action: 'searchVenues', query });
  const res = await fetch(`/api/seatgeek?${params}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to search SeatGeek venues');
  }

  const data = await res.json();
  return (data.venues || []).map((v) => ({
    id: String(v.id),
    name: v.name,
    city: v.city || '',
    state: v.state || '',
    country: v.country || '',
    lat: v.location?.lat || null,
    lon: v.location?.lon || null,
  }));
}

/**
 * Fetch upcoming events at a specific SeatGeek venue ID.
 */
export async function fetchEventsByVenueId(venueId) {
  const params = new URLSearchParams({ action: 'venueEvents', venueId });
  const res = await fetch(`/api/seatgeek?${params}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch SeatGeek venue events');
  }

  const data = await res.json();
  return data.events || [];
}

/**
 * Pick the best image from a SeatGeek event's performers.
 */
export function getSeatGeekImage(event) {
  const performers = event.performers || [];
  for (const p of performers) {
    if (p.image) return p.image;
  }
  return null;
}
