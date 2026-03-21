const BASE_URL = 'https://api.seatgeek.com/2';

/**
 * Search SeatGeek performers by name.
 * Returns an array of { id, name, imageUrl }.
 */
export async function searchPerformers(clientId, query) {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    client_id: clientId,
    q: query,
    per_page: '8',
  });

  const res = await fetch(`${BASE_URL}/performers?${params}`);
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) throw new Error('Invalid SeatGeek client ID');
    throw new Error('Failed to search SeatGeek performers');
  }

  const data = await res.json();
  return (data.performers || []).map((p) => ({
    id: String(p.id),
    name: p.name,
    imageUrl: p.image || null,
  }));
}

/**
 * Fetch upcoming events for a SeatGeek performer ID.
 */
export async function fetchEventsByPerformerId(clientId, performerId) {
  const params = new URLSearchParams({
    client_id: clientId,
    'performers.id': performerId,
    sort: 'datetime_local.asc',
    per_page: '50',
  });

  const res = await fetch(`${BASE_URL}/events?${params}`);
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) throw new Error('Invalid SeatGeek client ID');
    throw new Error('Failed to fetch SeatGeek events');
  }

  const data = await res.json();
  return data.events || [];
}

/**
 * Pick the best image from a SeatGeek performer's images.
 */
export function getSeatGeekImage(event) {
  const performers = event.performers || [];
  for (const p of performers) {
    if (p.image) return p.image;
  }
  return null;
}
