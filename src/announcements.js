import { fetchRSSAnnouncements } from './rss.js';

/**
 * Fetch announcements from all sources, dedupe, and sort by timestamp.
 */
export async function fetchAllAnnouncements(artistNames) {
  if (artistNames.length === 0) return [];

  const [rssResults] = await Promise.all([
    fetchRSSAnnouncements(artistNames).catch(() => []),
    // Future: fetchRedditAnnouncements(artistNames).catch(() => []),
    // Future: fetchBlueskyAnnouncements(artistNames).catch(() => []),
  ]);

  const all = [...rssResults];

  // Dedupe by URL
  const seen = new Set();
  const deduped = all.filter((a) => {
    const key = a.url || a.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort newest first
  deduped.sort((a, b) => (b.timestamp || '') > (a.timestamp || '') ? 1 : -1);

  return deduped;
}
