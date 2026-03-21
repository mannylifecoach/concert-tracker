const BASE_URL = 'https://app.ticketmaster.com/discovery/v2';

/**
 * Search for artist attractions by name.
 * Returns an array of { id, name, imageUrl } matches.
 */
export async function searchAttractions(apiKey, query) {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    apikey: apiKey,
    keyword: query,
    classificationName: 'music',
    size: '8',
    locale: '*',
  });

  const res = await fetch(`${BASE_URL}/attractions.json?${params}`);
  if (!res.ok) {
    if (res.status === 401) throw new Error('Invalid API key');
    throw new Error('Failed to search attractions');
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
 * Fetch upcoming events for a specific attraction ID.
 */
export async function fetchEventsByAttractionId(apiKey, attractionId) {
  const params = new URLSearchParams({
    apikey: apiKey,
    attractionId,
    classificationName: 'music',
    size: '50',
    sort: 'date,asc',
    locale: '*',
  });

  const res = await fetch(`${BASE_URL}/events.json?${params}`);
  if (!res.ok) {
    if (res.status === 401) throw new Error('Invalid API key');
    throw new Error('Failed to fetch events');
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
