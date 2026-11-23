(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Catalogue = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  function inspectData(data) {
    const keys = ['records', 'data', 'entities', 'elements', 'countries', 'subdivisions', 'airports', 'currencies', 'states', 'quotes', 'emoji', 'ports', 'tlds', 'items', 'formulas', 'compounds'];
    const records = Array.isArray(data) ? data : data && keys.map(key => data[key]).find(Array.isArray);
    if (!records) return { status: 'unknown', records: 0 };
    const stub = records.some(record => record && typeof record === 'object' && (
      record.placeholder === true || record.scaffold === true || ['scaffold', 'pilot-fixture', 'awaiting-source-refresh'].includes(record.status) ||
      /^(sample|placeholder|todo)([-_ ]|$)/i.test(String(record.id || '')) ||
      /\b(placeholder record|replace me|TODO:)\b/i.test(JSON.stringify(record))
    ));
    return { status: stub ? 'stub' : records.length ? 'live' : 'empty', records: records.length };
  }
  function endpointURL(entry, base) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*-api$/.test(entry.name) || typeof entry.endpoint !== 'string') throw new Error('Invalid endpoint');
    const path = entry.endpoint;
    if (!path || /[\\%?#:]/.test(path) || path.startsWith('/') || path.split('/').some(part => part === '..' || part === '.')) throw new Error('Endpoint escapes dataset');
    const root = new URL(entry.name + '/', base);
    const url = new URL(path, root);
    if (!url.href.startsWith(root.href)) throw new Error('Endpoint escapes dataset');
    return url.href;
  }
  function categoryOf(name) {
    if (/^(india[n]?-|ncert-|jee-|neet-|upsc-|gate-|rbi-|gst-|tds-|ipo-|gsec-|cricket-ipl|income-tax|mutual-fund|govt-)/.test(name)) return 'india';
    if (/^(http-|html-|css-|json-|regex-|git-|linux-|sql-|javascript-|mime-|software-|crypto-|unicode-|programming-)/.test(name)) return 'dev';
    if (/^(periodic-|physics-|math-|si-|nav-|chemistry-|nutrition-)/.test(name)) return 'science';
    return 'other';
  }
  function filterEntries(entries, filter = 'all', query = '') {
    const search = query.trim().toLowerCase();
    return entries.filter(entry => (filter === 'all' || (['india', 'dev', 'science'].includes(filter) ? categoryOf(entry.name) === filter : entry.status === filter)) && `${entry.name} ${entry.desc || ''}`.toLowerCase().includes(search));
  }
  return { inspectData, endpointURL, filterEntries, categoryOf };
});
