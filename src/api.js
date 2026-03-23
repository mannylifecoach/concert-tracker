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
    socials: parseSocials(a.externalLinks),
    isFestival: isAttractionFestival(a),
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
 * Check if a Ticketmaster attraction is a festival.
 */
function isAttractionFestival(attraction) {
  const cls = attraction.classifications?.[0] || {};
  if (cls.subType?.name?.toLowerCase() === 'festival') return true;
  if (cls.genre?.name?.toLowerCase().includes('festival')) return true;
  return /\bfest(ival)?\b/i.test(attraction.name || '');
}

/**
 * Extract social media links from Ticketmaster externalLinks.
 */
function parseSocials(externalLinks) {
  if (!externalLinks) return {};

  const socials = {};
  const platforms = ['instagram', 'twitter', 'facebook', 'youtube', 'spotify', 'homepage'];

  for (const platform of platforms) {
    if (externalLinks[platform]?.[0]?.url) {
      socials[platform] = externalLinks[platform][0].url;
    }
  }

  return socials;
}

/**
 * Fetch music events near a location via our serverless proxy.
 */
export async function fetchEventsByLocation(lat, lon, radius) {
  const params = new URLSearchParams({ action: 'cityEvents', lat, lon, radius: String(radius) });
  const res = await fetch(`/api/ticketmaster?${params}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch nearby events');
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
