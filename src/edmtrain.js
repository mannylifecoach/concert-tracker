/**
 * Search EDMTrain events by artist name via our serverless proxy.
 */
export async function fetchEventsByArtist(artistName) {
  const params = new URLSearchParams({ action: 'artistEvents', artistName });
  const res = await fetch(`/api/edmtrain?${params}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch EDMTrain events');
  }

  const data = await res.json();
  return data.data || [];
}

/**
 * Fetch EDMTrain events near a location via our serverless proxy.
 */
export async function fetchEventsByLocation(lat, lon, state) {
  const params = new URLSearchParams({ action: 'cityEvents', lat, lon });
  if (state) params.set('state', state);
  const res = await fetch(`/api/edmtrain?${params}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch nearby EDMTrain events');
  }

  const data = await res.json();
  return data.data || [];
}
