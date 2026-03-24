/**
 * Fetch RSS tour announcements matching tracked artists.
 */
export async function fetchRSSAnnouncements(artistNames) {
  const params = new URLSearchParams({ action: 'search', artists: artistNames.join(',') });
  const res = await fetch(`/api/rss?${params}`);

  if (!res.ok) return [];

  const data = await res.json();
  return data.announcements || [];
}
