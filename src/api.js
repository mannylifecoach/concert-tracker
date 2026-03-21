/**
 * Search for artist attractions by name via our serverless proxy.
 * Returns an array of { id, name, imageUrl } matches.
 */
export async function searchAttractions(query) {
  if (!query.trim()) return [];

  const params = new URLSearchParams({ action: 'search', query });
  const res = await fetch(`/api/ticketmaster?${params}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to search attractions');
  }

  const data = await res.json();
  const attractions = data._embedded?.attractions || [];

  return attractions.map((a) => ({
    id: a.id,
    name: a.name,
    imageUrl: getBestImage(a.images),
  }));
}

/**
 * Fetch upcoming events for a specific attraction ID via our serverless proxy.
 */
export async function fetchEventsByAttractionId(attractionId) {
  const params = new URLSearchParams({ action: 'events', attractionId });
  const res = await fetch(`/api/ticketmaster?${params}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch events');
  }

  const data = await res.json();
  return data._embedded?.events || [];
}

/**
 * Pick the best image from a Ticketmaster images array.
 */
export function getBestImage(images) {
  if (!images || images.length === 0) return null;

  const preferred = images.find(
    (img) => img.ratio === '16_9' && img.width >= 640,
  );
  if (preferred) return preferred.url;

  const sorted = [...images].sort((a, b) => (b.width || 0) - (a.width || 0));
  return sorted[0]?.url || null;
}
