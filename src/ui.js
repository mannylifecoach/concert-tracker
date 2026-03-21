import { searchAttractions } from './api.js';
import { state, saveArtists } from './state.js';
import { fetchAllShows } from './shows.js';

let debounceTimer = null;
let autocompleteResults = [];
let expandedArtist = null; // which artist's social panel is open
let discordEditArtist = null; // which artist is being edited for discord

const socialIcons = {
  instagram: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`,
  twitter: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  facebook: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
  youtube: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/><polygon fill="#fff" points="9.545,15.568 15.818,12 9.545,8.432"/></svg>`,
  spotify: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>`,
  discord: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z"/></svg>`,
  homepage: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
};

function formatDate(date) {
  if (!(date instanceof Date) || isNaN(date)) return 'TBA';
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function formatLocation(show) {
  return [show.city, show.state || show.country].filter(Boolean).join(', ');
}

function getCardBackground(show) {
  if (show.image) return `url('${show.image}')`;
  return show.gradient;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderAutocomplete() {
  if (autocompleteResults.length === 0) return '';
  return `
    <div class="autocomplete-dropdown">
      ${autocompleteResults.map((a) => `
        <button class="autocomplete-item" data-id="${escapeHtml(a.id)}" data-name="${escapeHtml(a.name)}" data-socials='${escapeHtml(JSON.stringify(a.socials || {}))}' data-festival="${a.isFestival ? 'true' : 'false'}">
          ${a.imageUrl ? `<img src="${escapeHtml(a.imageUrl)}" alt="" class="autocomplete-img">` : '<div class="autocomplete-img placeholder"></div>'}
          <span>${escapeHtml(a.name)}</span>
          ${a.isFestival ? '<span class="autocomplete-festival-tag">festival</span>' : ''}
        </button>
      `).join('')}
    </div>
  `;
}

function renderSourceBadge(show) {
  const label = show.source === 'seatgeek' ? 'sg' : 'tm';
  let html = `<span class="source-badge source-${show.source}">${label}</span>`;
  if (show.isFestival) {
    html += `<span class="source-badge badge-festival">festival</span>`;
  }
  return html;
}

function renderTicketLinks(show) {
  let html = `<a href="${escapeHtml(show.ticketUrl)}" target="_blank" class="ticket-btn">${show.source === 'seatgeek' ? 'seatgeek' : 'tickets'}</a>`;
  if (show.altTicketUrl) {
    html += `<a href="${escapeHtml(show.altTicketUrl)}" target="_blank" class="ticket-btn ticket-btn-alt">${show.altSource === 'seatgeek' ? 'seatgeek' : 'tickets'}</a>`;
  }
  return html;
}

function buildShareText(show) {
  const date = formatDate(show.date);
  const location = formatLocation(show);
  return `${show.artist} @ ${show.venue}, ${location} — ${date}`;
}

async function handleShare(showId) {
  const show = state.shows.find((s) => s.id === showId);
  if (!show) return;

  const text = buildShareText(show);
  const url = show.ticketUrl !== '#' ? show.ticketUrl : '';
  const shareData = {
    title: `${show.artist} — ${show.venue}`,
    text: `${text}\n\ncome with me?`,
    url,
  };

  // Use native share on mobile, fallback to copy
  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (err) {
      if (err.name !== 'AbortError') console.error('Share failed:', err);
    }
  } else {
    const copyText = url ? `${text}\n${url}` : text;
    await navigator.clipboard.writeText(copyText);
    showCopyToast();
  }
}

function showCopyToast() {
  document.getElementById('toast-container')?.remove();

  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'toast-container';
  document.body.appendChild(container);

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = 'copied to clipboard';
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast-visible'));
  setTimeout(() => {
    toast.classList.remove('toast-visible');
    toast.addEventListener('transitionend', () => toast.remove());
  }, 2500);
}

function renderSocialLinks(artist) {
  const socials = artist.socials || {};
  const platforms = ['discord', 'instagram', 'twitter', 'spotify', 'youtube', 'facebook', 'homepage'];
  const links = [];

  for (const platform of platforms) {
    if (socials[platform]) {
      links.push(`
        <a href="${escapeHtml(socials[platform])}" target="_blank" class="social-link social-${platform}" title="${platform}">
          ${socialIcons[platform]}
        </a>
      `);
    }
  }

  // Always show Discord add button if no Discord link
  if (!socials.discord) {
    links.push(`
      <button class="social-link social-discord social-add" data-artist="${escapeHtml(artist.name)}" title="add discord">
        ${socialIcons.discord}
        <span class="social-add-plus">+</span>
      </button>
    `);
  }

  return links.join('');
}

function renderArtistSocials(artist) {
  if (expandedArtist !== artist.name) return '';

  const isEditing = discordEditArtist === artist.name;

  return `
    <div class="artist-socials-panel">
      <div class="social-links">
        ${renderSocialLinks(artist)}
      </div>
      ${isEditing ? `
        <div class="discord-edit">
          <input type="text" class="discord-input" id="discord-input" placeholder="paste discord invite link.." autocomplete="off">
          <button class="discord-save" id="discord-save">save</button>
        </div>
      ` : ''}
    </div>
  `;
}

function renderApp() {
  const filteredShows = state.activeFilter
    ? state.shows.filter((s) => s.artist.toLowerCase() === state.activeFilter.toLowerCase())
    : state.shows;

  return `
    <div class="container">
      <header>
        <div class="logo">shows..</div>
        <div class="artist-filters">
          <button class="artist-filter ${!state.activeFilter ? 'active' : ''}" data-filter="all">all</button>
          ${state.artists.map((artist) => `
            <div class="artist-filter-group">
              <button class="artist-filter ${state.activeFilter === artist.name ? 'active' : ''}" data-filter="${escapeHtml(artist.name)}">
                ${escapeHtml(artist.name.toLowerCase())}${artist.isFestival ? '<span class="filter-festival-tag">fest</span>' : ''}
                <span class="socials-toggle" data-socials-toggle="${escapeHtml(artist.name)}">↗</span>
                <span class="remove" data-remove="${escapeHtml(artist.name)}">×</span>
              </button>
              ${renderArtistSocials(artist)}
            </div>
          `).join('')}
        </div>
      </header>

      <div class="add-artist-section">
        <div class="add-artist-wrapper">
          <form class="add-artist-form" id="add-artist-form">
            <input
              type="text"
              class="add-artist-input"
              id="artist-input"
              placeholder="search artist.."
              autocomplete="off"
            >
          </form>
          ${renderAutocomplete()}
        </div>
      </div>

      ${state.loading ? `
        <div class="state-message">loading shows..</div>
      ` : state.error ? `
        <div class="state-message error">${escapeHtml(state.error)}</div>
      ` : state.artists.length === 0 ? `
        <div class="state-message">search for an artist to see their upcoming shows</div>
      ` : filteredShows.length === 0 ? `
        <div class="state-message">no upcoming shows found</div>
      ` : `
        <div class="shows-grid">
          ${filteredShows.map((show) => `
            <div class="show-card">
              <div class="show-card-bg" style="background: ${getCardBackground(show)}; background-size: cover; background-position: center;"></div>
              <div class="show-card-overlay"></div>
              <div class="show-card-content">
                <div class="show-date">${formatDate(show.date)} ${renderSourceBadge(show)}</div>
                <div class="show-venue">${escapeHtml(show.venue)}</div>
                <div class="show-city">${escapeHtml(formatLocation(show))}</div>
                <div class="show-footer">
                  <div class="ticket-links">
                    ${renderTicketLinks(show)}
                    <button class="share-btn" data-share-id="${escapeHtml(show.id)}" title="share">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                    </button>
                  </div>
                  <span class="show-artist">${escapeHtml(show.artist.toLowerCase())}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `}

      <footer>
        ✦ powered by ticketmaster + seatgeek
      </footer>
    </div>
  `;
}

function addArtist(attraction) {
  if (state.artists.some((a) => a.id === attraction.id)) return;

  state.artists.push({
    id: attraction.id,
    name: attraction.name,
    seatgeekId: null,
    socials: attraction.socials || {},
    isFestival: attraction.isFestival || false,
  });
  saveArtists();
  autocompleteResults = [];
  fetchAllShows(render);
}

function removeArtist(name) {
  state.artists = state.artists.filter((a) => a.name !== name);
  state.shows = state.shows.filter((s) => s.artist.toLowerCase() !== name.toLowerCase());
  if (state.activeFilter === name) state.activeFilter = null;
  if (expandedArtist === name) expandedArtist = null;
  saveArtists();
  render();
}

function handleSearchInput(value) {
  clearTimeout(debounceTimer);

  if (!value.trim()) {
    autocompleteResults = [];
    render();
    return;
  }

  debounceTimer = setTimeout(async () => {
    try {
      autocompleteResults = await searchAttractions(value);
      render();
      const input = document.getElementById('artist-input');
      if (input) {
        input.value = value;
        input.focus();
      }
    } catch (err) {
      console.error('Search failed:', err);
    }
  }, 300);
}

function bindEvents() {
  const artistInput = document.getElementById('artist-input');
  artistInput?.addEventListener('input', (e) => handleSearchInput(e.target.value));

  document.getElementById('add-artist-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
  });

  // Autocomplete item clicks
  document.querySelectorAll('.autocomplete-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      let socials = {};
      try { socials = JSON.parse(btn.dataset.socials || '{}'); } catch {}
      addArtist({ id: btn.dataset.id, name: btn.dataset.name, socials, isFestival: btn.dataset.festival === 'true' });
    });
  });

  // Close autocomplete and socials panel when clicking/tapping outside
  document.addEventListener('click', (e) => {
    let needsRender = false;

    if (!e.target.closest('.add-artist-wrapper') && autocompleteResults.length > 0) {
      autocompleteResults = [];
      needsRender = true;
    }

    if (!e.target.closest('.artist-filter-group') && !e.target.closest('.artist-socials-panel') && expandedArtist) {
      expandedArtist = null;
      discordEditArtist = null;
      needsRender = true;
    }

    if (needsRender) render();
  });

  // Filter buttons
  document.querySelectorAll('.artist-filter').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove')) return;
      if (e.target.classList.contains('socials-toggle')) return;
      const filter = btn.dataset.filter;
      state.activeFilter = filter === 'all' ? null : filter;
      expandedArtist = null;
      render();
    });
  });

  // Social toggle buttons
  document.querySelectorAll('.socials-toggle').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const artistName = btn.dataset.socialsToggle;
      expandedArtist = expandedArtist === artistName ? null : artistName;
      discordEditArtist = null;
      render();
    });
  });

  // Discord add buttons
  document.querySelectorAll('.social-add').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      discordEditArtist = btn.dataset.artist;
      render();
      document.getElementById('discord-input')?.focus();
    });
  });

  // Discord save
  document.getElementById('discord-save')?.addEventListener('click', () => {
    const input = document.getElementById('discord-input');
    const url = input?.value.trim();
    if (!url || !discordEditArtist) return;

    const artist = state.artists.find((a) => a.name === discordEditArtist);
    if (artist) {
      if (!artist.socials) artist.socials = {};
      artist.socials.discord = url;
      saveArtists();
    }
    discordEditArtist = null;
    render();
  });

  document.getElementById('discord-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('discord-save')?.click();
    }
  });

  // Share buttons
  document.querySelectorAll('.share-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleShare(btn.dataset.shareId);
    });
  });

  // Remove artist buttons
  document.querySelectorAll('.remove').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeArtist(btn.dataset.remove);
    });
  });
}

function showToasts() {
  if (!state.noShowArtists || state.noShowArtists.length === 0) return;

  // Remove any existing toast container
  document.getElementById('toast-container')?.remove();

  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'toast-container';
  document.body.appendChild(container);

  state.noShowArtists.forEach((name, i) => {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `no upcoming shows found for <strong>${escapeHtml(name.toLowerCase())}</strong>`;

    setTimeout(() => {
      container.appendChild(toast);
      // Trigger animation
      requestAnimationFrame(() => toast.classList.add('toast-visible'));
      // Auto dismiss after 4s
      setTimeout(() => {
        toast.classList.remove('toast-visible');
        toast.addEventListener('transitionend', () => toast.remove());
      }, 4000);
    }, i * 300);
  });

  // Clear so we don't re-show on next render
  state.noShowArtists = [];
}

export function render() {
  const app = document.getElementById('app');
  app.innerHTML = renderApp();
  bindEvents();
  showToasts();
}

export function init() {
  render();
  if (state.artists.length > 0) {
    fetchAllShows(render);
  }
}
