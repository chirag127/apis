/**
 * ISO 4217 currency scraper.
 *
 * Source: SIX Group "list one" of ISO 4217 currency codes (the registration
 * authority's own XML, which carries the minor unit per currency).
 * The Debian iso-codes iso_4217.json was checked and does NOT carry minor
 * units, so it is not used here.
 *
 * Run: node scraper/index.cjs
 */
const fs = require('fs');
const path = require('path');

const SOURCE_URL = 'https://www.six-group.com/dam/download/financial-information/data-center/iso-currrency/lists/list-one.xml';

const ROOT = path.join(__dirname, '..');
const API_DIR = path.join(ROOT, 'api/v1');

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'currencies-api/1.0 (+https://github.com/chirag127/currencies-api)' } });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  const text = await res.text();
  if (/^\s*<!doctype html/i.test(text)) throw new Error(`${url} returned HTML, not data`);
  return text;
}

function tag(body, name) {
  const m = body.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`));
  return m ? m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim() : null;
}

function build(xml) {
  const published = (xml.match(/Pblshd="([^"]+)"/) || [])[1] || null;
  const entries = [...xml.matchAll(/<CcyNtry>([\s\S]*?)<\/CcyNtry>/g)].map((m) => m[1]);
  if (entries.length === 0) throw new Error('No <CcyNtry> elements found — the source shape changed');

  const byCode = new Map();
  let withoutCurrency = 0;
  for (const entry of entries) {
    const code = tag(entry, 'Ccy');
    if (!code) {
      withoutCurrency++;
      continue;
    }
    const country = tag(entry, 'CtryNm');
    const minorRaw = tag(entry, 'CcyMnrUnts');
    if (!byCode.has(code)) {
      byCode.set(code, {
        id: code,
        alpha3: code,
        numeric: tag(entry, 'CcyNbr'),
        name: tag(entry, 'CcyNm'),
        // The registry writes "N.A." for XAU/XDR-style codes that have no minor unit.
        minorUnits: minorRaw && /^\d+$/.test(minorRaw) ? Number(minorRaw) : null,
        countries: [],
      });
    }
    if (country) byCode.get(code).countries.push(country);
  }

  const currencies = [...byCode.values()].sort((a, b) => a.alpha3.localeCompare(b.alpha3));
  for (const c of currencies) {
    if (!c.numeric) throw new Error(`${c.alpha3} has no numeric code`);
    // numeric codes are zero padded to three digits: ALL is "008", not "8".
    if (!/^\d{3}$/.test(c.numeric)) console.warn(`Unexpected numeric code for ${c.alpha3}: ${c.numeric}`);
  }
  return { published, currencies, entryCount: entries.length, withoutCurrency };
}

async function main() {
  console.log('Fetching', SOURCE_URL);
  const xml = await fetchText(SOURCE_URL);
  const { published, currencies, entryCount, withoutCurrency } = build(xml);
  console.log(`List one published ${published}: ${entryCount} country entries -> ${currencies.length} unique currencies`);
  console.log(`${withoutCurrency} entries name a territory with no currency (e.g. Antarctica)`);
  console.log(`${currencies.filter((c) => c.minorUnits === null).length} currencies have no minor unit (minorUnits: null)`);

  const json = JSON.stringify(currencies, null, 2) + '\n';
  for (const rel of ['data.json', 'data/currencies.json', 'data/index.json', 'api/v1/data.json']) {
    fs.writeFileSync(path.join(ROOT, rel), json);
  }

  const indivDir = path.join(API_DIR, 'individual');
  fs.rmSync(indivDir, { recursive: true, force: true });
  fs.mkdirSync(indivDir, { recursive: true });
  for (const c of currencies) {
    fs.writeFileSync(path.join(indivDir, `${c.id}.json`), JSON.stringify(c, null, 2) + '\n');
  }

  const byId = {};
  for (const c of currencies) byId[c.id] = c;
  fs.writeFileSync(path.join(API_DIR, 'search-index.json'), JSON.stringify({ byId }, null, 2) + '\n');

  const now = new Date();
  const meta = {
    status: 'healthy',
    lastUpdated: now.toISOString(),
    sourceUpdatedAt: published ? `${published}T00:00:00.000Z` : null,
    retrievedAt: now.toISOString(),
    recordCount: currencies.length,
    version: '1.0.0',
    schemaVersion: '1.0.0',
    source: 'ISO 4217 (SIX Group, list one)',
    sourceUrl: SOURCE_URL,
    license: 'ISO 4217 list one (SIX Group)',
    updateCadence: 'manual',
    nextUpdateDue: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    lastFailedAt: null,
    failureReason: null,
  };
  fs.writeFileSync(path.join(API_DIR, 'meta.json'), JSON.stringify(meta, null, 2) + '\n');
  fs.writeFileSync(
    path.join(__dirname, 'fixtures/expected.json'),
    JSON.stringify({ recordCount: currencies.length, sourceUpdatedAt: meta.sourceUpdatedAt }, null, 2) + '\n'
  );
  console.log(`Wrote ${currencies.length} records, ${currencies.length} individual files, search index, meta.json`);
}

main().catch((err) => {
  console.error('Scraper failed:', err.message);
  process.exit(1);
});
