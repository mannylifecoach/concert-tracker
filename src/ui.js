import { searchAttractions } from './api.js';
import { state, saveArtists, saveApiKey, saveSeatGeekId } from './state.js';
import { fetchAllShows } from './shows.js';

let debounceTimer = null;
let autocompleteResults = [];
let showSettings = false;

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

function renderSetup() {
  return `
    <div class="setup-section">
      <h2>setup..</h2>
      <p>
        to fetch real concert data, you'll need a free ticketmaster api key.
        paste it below and you're good to go.
      </p>
      <input
        type="text"
        id="api-key-input"
        placeholder="paste your api key here"
        value="${escapeHtml(state.apiKey)}"
      >
      <button id="save-api-key">save & continue</button>
      <p class="hint">
        get your free key at <a href="https://developer.ticketmaster.com" target="_blank">developer.ticketmaster.com</a>
      </p>
    </div>
  `;
}

function renderAutocomplete() {
  if (autocompleteResults.length === 0) return '';
  return `
    <div class="autocomplete-dropdown">
      ${autocompleteResults.map((a) => `
        <button class="autocomplete-item" data-id="${escapeHtml(a.id)}" data-name="${escapeHtml(a.name)}">
          ${a.imageUrl ? `<img src="${escapeHtml(a.imageUrl)}" alt="" class="autocomplete-img">` : '<div class="autocomplete-img placeholder"></div>'}
          <span>${escapeHtml(a.name)}</span>
        </button>
      `).join('')}
    </div>
  `;
}

function renderSettings() {
  if (!showSettings) return '';
  return `
    <div class="settings-panel">
      <div class="settings-inner">
        <div class="settings-header">
          <span>settings</span>
          <button class="settings-close" id="close-settings">×</button>
        </div>
        <div class="settings-group">
          <label class="settings-label">ticketmaster api key</label>
          <input type="text" class="settings-input" id="settings-tm-key" value="${escapeHtml(state.apiKey)}" placeholder="ticketmaster api key">
        </div>
        <div class="settings-group">
          <label class="settings-label">seatgeek client id <span class="optional">(optional)</span></label>
          <input type="text" class="settings-input" id="settings-sg-key" value="${escapeHtml(state.seatgeekClientId)}" placeholder="seatgeek client id">
          <p class="settings-hint">adds a second data source for better coverage. get one free at <a href="https://seatgeek.com/account/develop" target="_blank">seatgeek.com/account/develop</a></p>
        </div>
        <button class="settings-save" id="save-settings">save</button>
      </div>
    </div>
  `;
}

function renderSourceBadge(show) {
  const label = show.source === 'seatgeek' ? 'sg' : 'tm';
  return `<span class="source-badge source-${show.source}">${label}</span>`;
}

function renderTicketLinks(show) {
  let html = `<a href="${escapeHtml(show.ticketUrl)}" target="_blank" class="ticket-btn">${show.source === 'seatgeek' ? 'seatgeek' : 'tickets'}</a>`;
  if (show.altTicketUrl) {
    html += `<a href="${escapeHtml(show.altTicketUrl)}" target="_blank" class="ticket-btn ticket-btn-alt">${show.altSource === 'seatgeek' ? 'seatgeek' : 'tickets'}</a>`;
  }
  return html;
}

function renderApp() {
  const filteredShows = state.activeFilter
    ? state.shows.filter((s) => s.artist.toLowerCase() === state.activeFilter.toLowerCase())
    : state.shows;

  const sourceCount = state.seatgeekClientId ? 'ticketmaster + seatgeek' : 'ticketmaster';

  return `
    <div class="container">
      <header>
        <div class="header-left">
          <div class="logo">shows..</div>
        </div>
        <div class="artist-filters">
          <button class="artist-filter ${!state.activeFilter ? 'active' : ''}" data-filter="all">all</button>
          ${state.artists.map((artist) => `
            <button class="artist-filter ${state.activeFilter === artist.name ? 'active' : ''}" data-filter="${escapeHtml(artist.name)}">
              ${escapeHtml(artist.name.toLowerCase())}
              <span class="remove" data-remove="${escapeHtml(artist.name)}">×</span>
            </button>
          `).join('')}
        </div>
        <button class="settings-btn" id="open-settings">⚙</button>
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
                  <div class="ticket-links">${renderTicketLinks(show)}</div>
                  <span class="show-artist">${escapeHtml(show.artist.toLowerCase())}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `}

      <footer>
        ✦ powered by ${sourceCount}
      </footer>
    </div>
    ${renderSettings()}
  `;
}

function addArtist(attraction) {
  if (state.artists.some((a) => a.id === attraction.id)) return;

  state.artists.push({ id: attraction.id, name: attraction.name, seatgeekId: null });
  saveArtists();
  autocompleteResults = [];
  fetchAllShows(render);
}

function removeArtist(name) {
  state.artists = state.artists.filter((a) => a.name !== name);
  state.shows = state.shows.filter((s) => s.artist.toLowerCase() !== name.toLowerCase());
  if (state.activeFilter === name) state.activeFilter = null;
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
      autocompleteResults = await searchAttractions(state.apiKey, value);
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
  if (!state.apiKey) {
    document.getElementById('save-api-key')?.addEventListener('click', () => {
      const input = document.getElementById('api-key-input');
      if (input.value.trim()) {
        saveApiKey(input.value.trim());
        fetchAllShows(render);
      }
    });

    document.getElementById('api-key-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const input = document.getElementById('api-key-input');
        if (input.value.trim()) {
          saveApiKey(input.value.trim());
          fetchAllShows(render);
        }
      }
    });
    return;
  }

  // Artist search input
  const artistInput = document.getElementById('artist-input');
  artistInput?.addEventListener('input', (e) => handleSearchInput(e.target.value));

  // Prevent form submit
  document.getElementById('add-artist-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
  });

  // Autocomplete item clicks
  document.querySelectorAll('.autocomplete-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      addArtist({ id: btn.dataset.id, name: btn.dataset.name });
    });
  });

  // Close autocomplete when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.add-artist-wrapper') && autocompleteResults.length > 0) {
      autocompleteResults = [];
      render();
    }
  });

  // Filter buttons
  document.querySelectorAll('.artist-filter').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove')) return;
      const filter = btn.dataset.filter;
      state.activeFilter = filter === 'all' ? null : filter;
      render();
    });
  });

  // Remove artist buttons
  document.querySelectorAll('.remove').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeArtist(btn.dataset.remove);
    });
  });

  // Settings
  document.getElementById('open-settings')?.addEventListener('click', () => {
    showSettings = true;
    render();
  });

  document.getElementById('close-settings')?.addEventListener('click', () => {
    showSettings = false;
    render();
  });

  document.getElementById('save-settings')?.addEventListener('click', () => {
    const tmKey = document.getElementById('settings-tm-key')?.value.trim();
    const sgKey = document.getElementById('settings-sg-key')?.value.trim();

    if (tmKey) saveApiKey(tmKey);
    saveSeatGeekId(sgKey || '');

    // Clear cached SeatGeek IDs if the client ID changed
    state.artists.forEach((a) => { a.seatgeekId = null; });
    saveArtists();

    showSettings = false;
    fetchAllShows(render);
  });

  // Close settings on backdrop click
  document.querySelector('.settings-panel')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('settings-panel')) {
      showSettings = false;
      render();
    }
  });
}

export function render() {
  const app = document.getElementById('app');
  if (!state.apiKey) {
    app.innerHTML = renderSetup();
  } else {
    app.innerHTML = renderApp();
  }
  bindEvents();
}

export function init() {
  render();
  if (state.apiKey && state.artists.length > 0) {
    fetchAllShows(render);
  }
}
