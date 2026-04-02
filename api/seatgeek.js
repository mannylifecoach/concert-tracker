const SG_BASE = 'https://api.seatgeek.com/2';

export default async function handler(req, res) {
  const clientId = process.env.SEATGEEK_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: 'SeatGeek client ID not configured' });
  }

  const { action, query, performerId, lat, lon, radius, venueId } = req.query;

  if (!action) {
    return res.status(400).json({ error: 'Missing action parameter' });
  }

  try {
    let url;

    if (action === 'search') {
      if (!query) return res.status(400).json({ error: 'Missing query parameter' });
      const params = new URLSearchParams({
        client_id: clientId,
        q: query,
        per_page: '8',
      });
      url = `${SG_BASE}/performers?${params}`;
    } else if (action === 'events') {
      if (!performerId) return res.status(400).json({ error: 'Missing performerId parameter' });
      const params = new URLSearchParams({
        client_id: clientId,
        'performers.id': performerId,
        sort: 'datetime_local.asc',
        per_page: '200',
      });
      url = `${SG_BASE}/events?${params}`;
    } else if (action === 'cityEvents') {
      if (!lat || !lon) return res.status(400).json({ error: 'Missing lat/lon parameters' });
      const params = new URLSearchParams({
        client_id: clientId,
        lat,
        lon,
        range: `${radius || '100'}mi`,
        sort: 'datetime_local.asc',
        per_page: '200',
        type: 'concert',
      });
      url = `${SG_BASE}/events?${params}`;
    } else if (action === 'searchVenues') {
      if (!query) return res.status(400).json({ error: 'Missing query parameter' });
      const params = new URLSearchParams({
        client_id: clientId,
        q: query,
        per_page: '8',
      });
      url = `${SG_BASE}/venues?${params}`;
    } else if (action === 'venueEvents') {
      if (!venueId) return res.status(400).json({ error: 'Missing venueId parameter' });
      const params = new URLSearchParams({
        client_id: clientId,
        'venue.id': venueId,
        sort: 'datetime_local.asc',
        per_page: '200',
        type: 'concert',
      });
      url = `${SG_BASE}/events?${params}`;
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: 'SeatGeek API error' });
    }

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch from SeatGeek' });
  }
}
