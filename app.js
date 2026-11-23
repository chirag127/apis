/* global Catalogue */
const entries = (window.__CATALOGUE__ || []).map(entry => ({ ...entry, status: 'checking' }));
const base = new URL('./', document.baseURI).href;
const grid = document.getElementById('grid');
const search = document.getElementById('q');
const count = document.getElementById('count');
let filter = 'all';
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function render() {
  const rows = Catalogue.filterEntries(entries, filter, search.value);
  count.textContent = `${rows.length} of ${entries.length} APIs`;
  document.getElementById('n-total').textContent = entries.length;
  document.getElementById('n-live').textContent = entries.filter(entry => entry.status === 'live').length;
  document.getElementById('n-stub').textContent = entries.filter(entry => entry.status === 'stub').length;
  grid.innerHTML = rows.length ? rows.map(entry => {
    const endpoint = Catalogue.endpointURL(entry, base);
    const label = { checking: 'Checking JSON…', stub: 'Scaffold data', empty: 'Empty dataset', unknown: 'Unrecognized data shape', dead: 'Fetch failed — open JSON to retry' }[entry.status] || `${entry.records.toLocaleString()} records`;
    return `<article class="card"><h2><a href="${escapeHTML(new URL(entry.name + '/', base).href)}">${escapeHTML(entry.name)}</a></h2><p class="desc">${escapeHTML(entry.desc)}</p><div class="meta"><span class="status ${entry.status}">${label}</span><span class="tag">${Catalogue.categoryOf(entry.name)}</span></div><a class="endpoint" href="${escapeHTML(endpoint)}">${escapeHTML(endpoint)}</a><a class="source" href="https://github.com/chirag127/apis/tree/main/datasets/${entry.name}">Source and contract</a></article>`;
  }).join('') : '<p>No matching APIs. Clear search or choose another filter.</p>';
}

search.addEventListener('input', render);
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  filter = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(other => {
    other.classList.toggle('on', other === button);
    other.setAttribute('aria-pressed', String(other === button));
  });
  render();
}));

async function checkEntries() {
  const queue = entries.slice();
  const worker = async () => {
    while (queue.length) {
      const entry = queue.shift();
      try {
        const response = await fetch(Catalogue.endpointURL(entry, base), { signal: AbortSignal.timeout(30000) });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        Object.assign(entry, Catalogue.inspectData(await response.json()));
      } catch { entry.status = 'dead'; }
      render();
    }
  };
  await Promise.all(Array.from({ length: 4 }, worker));
}
render();
checkEntries();
