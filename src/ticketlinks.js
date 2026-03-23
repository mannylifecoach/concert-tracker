/**
 * Build search deep links to alternative ticket platforms.
 * These are search URLs — no API keys needed.
 */

export function buildTickPickUrl(artist, venue) {
  const query = encodeURIComponent(`${artist} ${venue}`);
  return `https://www.tickpick.com/search?q=${query}`;
}

export function buildDiceUrl(artist) {
  const query = encodeURIComponent(artist);
  return `https://dice.fm/search?query=${query}`;
}
