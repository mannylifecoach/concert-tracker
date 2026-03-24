import { XMLParser } from 'fast-xml-parser';

const FEEDS = [
  { name: 'Consequence of Sound', url: 'https://consequence.net/feed/' },
  { name: 'Brooklyn Vegan', url: 'https://www.brooklynvegan.com/feed/' },
  { name: 'Stereogum', url: 'https://www.stereogum.com/feed/' },
];

const parser = new XMLParser({ ignoreAttributes: false, processEntities: false });

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchesArtist(text, artistNames) {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const name of artistNames) {
    const lowerName = name.toLowerCase();
    // Short names (< 4 chars) require exact word match in title only
    if (lowerName.length < 4) {
      const regex = new RegExp(`\\b${escapeRegex(lowerName)}\\b`, 'i');
      if (regex.test(text)) return name;
    } else if (lower.includes(lowerName)) {
      return name;
    }
  }
  return null;
}

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

async function fetchFeed(feed) {
  try {
    const res = await fetch(feed.url, {
      headers: { 'User-Agent': 'concert-tracker/1.0' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];

    const xml = await res.text();
    const parsed = parser.parse(xml);

    // Handle RSS 2.0 and Atom
    const items = parsed?.rss?.channel?.item || parsed?.feed?.entry || [];
    const itemArray = Array.isArray(items) ? items : [items];

    return itemArray.map((item) => ({
      title: item.title || '',
      link: item.link?.['@_href'] || item.link || '',
      description: stripHtml(item.description || item['content:encoded'] || item.summary || ''),
      pubDate: item.pubDate || item.published || item.updated || '',
      feedName: feed.name,
    }));
  } catch {
    return [];
  }
}

export default async function handler(req, res) {
  const { action, artists } = req.query;

  if (action !== 'search' || !artists) {
    return res.status(400).json({ error: 'Requires action=search and artists parameter' });
  }

  const artistNames = artists.split(',').map((a) => a.trim()).filter(Boolean);
  if (artistNames.length === 0) {
    return res.status(200).json({ announcements: [] });
  }

  try {
    const feedResults = await Promise.all(FEEDS.map(fetchFeed));
    const allItems = feedResults.flat();

    const announcements = [];
    for (const item of allItems) {
      const searchText = `${item.title} ${item.description}`;
      const matched = matchesArtist(searchText, artistNames);
      if (!matched) continue;

      announcements.push({
        id: `rss-${hashCode(item.link || item.title)}`,
        artist: matched,
        title: item.title,
        snippet: item.description.slice(0, 200),
        url: item.link,
        source: 'rss',
        sourceName: item.feedName,
        timestamp: item.pubDate ? new Date(item.pubDate).toISOString() : null,
      });
    }

    // Sort newest first, limit to 20
    announcements.sort((a, b) => (b.timestamp || '') > (a.timestamp || '') ? 1 : -1);
    const limited = announcements.slice(0, 20);

    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=1800');
    return res.status(200).json({ announcements: limited });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch RSS feeds' });
  }
}
