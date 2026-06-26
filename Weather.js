const cityForm = document.getElementById('city-form');
const cityInput = document.getElementById('city-input');
const cityName = document.getElementById('city-name');
const citySummary = document.getElementById('city-summary');
const statusMessage = document.getElementById('status-message');
const eventsList = document.getElementById('events-list');
const newsList = document.getElementById('news-list');

const fallbackCityData = {
  'new york': {
    name: 'New York',
    summary: 'Showing sample updates while the live feed is unavailable.',
    events: [
      { title: 'Central Park Summer Concert', date: 'Sample event', detail: 'Live data will appear here when the API responds.' }
    ],
    news: [
      { title: 'Live news will appear here', detail: 'Your city headlines will populate automatically from a public news feed.' }
    ]
  },
  london: {
    name: 'London',
    summary: 'Showing sample updates while the live feed is unavailable.',
    events: [
      { title: 'South Bank Street Food Festival', date: 'Sample event', detail: 'Live data will appear here when the API responds.' }
    ],
    news: [
      { title: 'London headlines will appear here', detail: 'Your city headlines will populate automatically from a public news feed.' }
    ]
  },
  tokyo: {
    name: 'Tokyo',
    summary: 'Showing sample updates while the live feed is unavailable.',
    events: [
      { title: 'Shibuya Summer Night Walk', date: 'Sample event', detail: 'Live data will appear here when the API responds.' }
    ],
    news: [
      { title: 'Tokyo headlines will appear here', detail: 'Your city headlines will populate automatically from a public news feed.' }
    ]
  },
  sydney: {
    name: 'Sydney',
    summary: 'Showing sample updates while the live feed is unavailable.',
    events: [
      { title: 'Bondi Beach Sunset Yoga', date: 'Sample event', detail: 'Live data will appear here when the API responds.' }
    ],
    news: [
      { title: 'Sydney headlines will appear here', detail: 'Your city headlines will populate automatically from a public news feed.' }
    ]
  }
};

function toTitleCase(text) {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function createKey(text) {
  return text.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).join(' ');
}

function renderCards(items, kind) {
  if (!items || items.length === 0) {
    return `<div class="empty-state">No ${kind === 'event' ? 'upcoming events' : 'recent news'} were returned right now.</div>`;
  }

  return items
    .map((item) => {
      const title = item.title || 'Untitled update';
      const detail = item.detail || item.description || 'More details will appear here.';
      const meta = item.date || item.pubDate || '';
      const link = item.link ? `<a class="link" href="${item.link}" target="_blank" rel="noopener noreferrer">View source</a>` : '';

      return `
        <article class="card-item">
          <h4>${title}</h4>
          ${meta ? `<p class="meta">${meta}</p>` : ''}
          <p>${detail}</p>
          ${link ? `<p style="margin-top:0.55rem;">${link}</p>` : ''}
        </article>
      `;
    })
    .join('');
}

function renderCity(cityLabel, events, news, source) {
  const friendlyName = cityLabel || 'Selected city';
  const fallback = fallbackCityData[createKey(friendlyName)] || fallbackCityData['new york'];
  const safeEvents = events && events.length ? events : fallback.events;
  const safeNews = news && news.length ? news : fallback.news;

  cityName.textContent = friendlyName;
  citySummary.textContent = source === 'live'
    ? `Live updates for ${friendlyName}.`
    : fallback.summary;
  eventsList.innerHTML = renderCards(safeEvents, 'event');
  newsList.innerHTML = renderCards(safeNews, 'news');
}

async function fetchEvents(cityName) {
  const endpoint = `https://app.ticketmaster.com/discovery/v2/events.json?city=${encodeURIComponent(cityName)}&size=4&apikey=7elxdku9GGG5k8j0Xm8KWdANDgecHMV0`;
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error('Event feed unavailable');
  }

  const data = await response.json();
  return (data._embedded?.events || []).slice(0, 4).map((event) => ({
    title: event.name,
    date: event.dates?.start?.localDate || 'Upcoming event',
    detail: event._embedded?.venues?.[0]?.name || event.info || 'Live event details from Ticketmaster',
    link: event.url
  }));
}

async function fetchNews(cityName) {
  const endpoint = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(`https://news.google.com/rss/search?q=${cityName}`)}`;
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error('News feed unavailable');
  }

  const data = await response.json();
  return (data.items || []).slice(0, 4).map((item) => ({
    title: item.title,
    date: item.pubDate,
    detail: item.description.replace(/<[^>]+>/g, '').trim(),
    link: item.link
  }));
}

async function loadCity(cityInputValue) {
  const rawQuery = cityInputValue.trim();
  const cityLabel = rawQuery ? toTitleCase(rawQuery) : 'New York';
  const cityKey = createKey(cityLabel);

  cityName.textContent = cityLabel;
  citySummary.textContent = 'Fetching live events and headlines for your city…';
  statusMessage.textContent = 'Connecting to public live feeds…';
  eventsList.innerHTML = '<div class="empty-state">Loading upcoming events…</div>';
  newsList.innerHTML = '<div class="empty-state">Loading latest news…</div>';

  try {
    const [events, news] = await Promise.all([fetchEvents(cityLabel), fetchNews(cityLabel)]);
    renderCity(cityLabel, events, news, 'live');
    statusMessage.textContent = `Live results loaded for ${cityLabel}.`;
  } catch (error) {
    const fallback = fallbackCityData[cityKey] || fallbackCityData['new york'];
    renderCity(cityLabel, fallback.events, fallback.news, 'fallback');
    statusMessage.textContent = `Live data was unavailable, so sample updates are shown for ${cityLabel}.`;
  }
}

cityForm.addEventListener('submit', (event) => {
  event.preventDefault();
  loadCity(cityInput.value);
});

loadCity('New York');

