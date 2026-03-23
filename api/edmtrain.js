const ET_BASE = 'https://edmtrain.com/api';

export default async function handler(req, res) {
  const apiKey = process.env.EDMTRAIN_API_KEY;
  if (!apiKey) {
    // Silently return empty results if no key configured yet
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({ data: [] });
  }

  const { action, artistIds, locationIds, lat, lon, state: stateParam } = req.query;

  if (!action) {
    return res.status(400).json({ error: 'Missing action parameter' });
  }

  try {
    let url;

    if (action === 'events') {
      const params = new URLSearchParams({ client: apiKey });
      if (artistIds) params.set('artistIds', artistIds);
      if (locationIds) params.set('locationIds', locationIds);
      params.set('festivalInd', 'true');
      params.set('includeElectronicGenreInd', 'true');
      params.set('includeOtherGenreInd', 'true');
      url = `${ET_BASE}/events?${params}`;
    } else if (action === 'artistEvents') {
      // Fetch all events, filter by artist name server-side
      const { artistName } = req.query;
      if (!artistName) return res.status(400).json({ error: 'Missing artistName parameter' });
      const params = new URLSearchParams({
        client: apiKey,
        includeElectronicGenreInd: 'true',
        includeOtherGenreInd: 'true',
      });
      url = `${ET_BASE}/events?${params}`;

      // Fetch and filter by artist name
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({ error: 'EDMTrain API error' });
      }

      const nameLC = artistName.toLowerCase();
      const filtered = (data.data || []).filter((event) =>
        event.artistList?.some((a) => a.name.toLowerCase().includes(nameLC)),
      );

      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
      return res.status(200).json({ data: filtered });
    } else if (action === 'cityEvents') {
      if (!lat || !lon) return res.status(400).json({ error: 'Missing lat/lon parameters' });
      const params = new URLSearchParams({
        client: apiKey,
        latitude: lat,
        longitude: lon,
        includeElectronicGenreInd: 'true',
        includeOtherGenreInd: 'true',
      });
      if (stateParam) params.set('state', stateParam);
      url = `${ET_BASE}/events?${params}`;
    } else if (action === 'locations') {
      const params = new URLSearchParams({ client: apiKey });
      const { city, state: st } = req.query;
      if (city) params.set('city', city);
      if (st) params.set('state', st);
      url = `${ET_BASE}/locations?${params}`;
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: 'EDMTrain API error' });
    }

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch from EDMTrain' });
  }
}
