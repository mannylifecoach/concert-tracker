const TM_BASE = 'https://app.ticketmaster.com/discovery/v2';

export default async function handler(req, res) {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Ticketmaster API key not configured' });
  }

  const { action, query, attractionId, lat, lon, radius } = req.query;

  if (!action) {
    return res.status(400).json({ error: 'Missing action parameter' });
  }

  try {
    let url;

    if (action === 'search') {
      if (!query) return res.status(400).json({ error: 'Missing query parameter' });
      const params = new URLSearchParams({
        apikey: apiKey,
        keyword: query,
        classificationName: 'music',
        size: '8',
        locale: '*',
      });
      url = `${TM_BASE}/attractions.json?${params}`;
    } else if (action === 'events') {
      if (!attractionId) return res.status(400).json({ error: 'Missing attractionId parameter' });
      const params = new URLSearchParams({
        apikey: apiKey,
        attractionId,
        classificationName: 'music',
        size: '50',
        sort: 'date,asc',
        locale: '*',
      });
      url = `${TM_BASE}/events.json?${params}`;
    } else if (action === 'cityEvents') {
      if (!lat || !lon) return res.status(400).json({ error: 'Missing lat/lon parameters' });
      const params = new URLSearchParams({
        apikey: apiKey,
        latlong: `${lat},${lon}`,
        radius: radius || '100',
        unit: 'miles',
        classificationName: 'music',
        size: '50',
        sort: 'date,asc',
        locale: '*',
      });
      url = `${TM_BASE}/events.json?${params}`;
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.fault?.faultstring || 'API error' });
    }

    // Cache responses for 5 minutes
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch from Ticketmaster' });
  }
}
