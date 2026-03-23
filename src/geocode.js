const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';

/**
 * Search for cities using OpenStreetMap Nominatim.
 * Returns [{ name, lat, lon }].
 */
export async function searchCities(query) {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '5',
    addressdetails: '1',
    featuretype: 'city',
  });

  const res = await fetch(`${NOMINATIM_BASE}?${params}`, {
    headers: { 'User-Agent': 'ConcertTracker/1.0' },
  });

  if (!res.ok) return [];

  const data = await res.json();

  return data
    .filter((r) => r.type === 'city' || r.type === 'town' || r.type === 'administrative' || r.class === 'place')
    .map((r) => ({
      name: formatCityName(r),
      lat: r.lat,
      lon: r.lon,
    }));
}

function formatCityName(result) {
  const addr = result.address || {};
  const city = addr.city || addr.town || addr.village || result.name;
  const stateCode = addr.state || '';
  const country = addr['country_code']?.toUpperCase() || '';

  if (country === 'US' && stateCode) {
    return `${city}, ${stateCode}`;
  }
  if (stateCode) {
    return `${city}, ${stateCode}, ${country}`;
  }
  return `${city}, ${country}`;
}
