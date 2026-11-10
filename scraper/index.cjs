/**
 * Periodic table scraper.
 *
 * Primary source: Bowserinator/Periodic-Table-JSON (IUPAC element names and
 * atomic weights, NIST ionisation/electronegativity values republished).
 * Publication year comes from the PubChem periodic table endpoint, which is the
 * only one of the two that carries a discovery year.
 *
 * Run: node scraper/index.cjs
 */
const fs = require('fs');
const path = require('path');

const ELEMENTS_URL = 'https://raw.githubusercontent.com/Bowserinator/Periodic-Table-JSON/master/PeriodicTableJSON.json';
const PUBMED_PT_URL = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/JSON';

const ROOT = path.join(__dirname, '..');
const API_DIR = path.join(ROOT, 'api/v1');

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'periodic-table-api/1.0 (+https://github.com/chirag127/periodic-table-api)' } });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  const text = await res.text();
  if (/^\s*<!doctype html/i.test(text)) throw new Error(`${url} returned HTML, not data`);
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`${url} did not return JSON: ${err.message}`);
  }
}

async function main() {
  console.log('Fetching', ELEMENTS_URL);
  const source = await fetchJson(ELEMENTS_URL);
  const raw = source.elements;
  if (!Array.isArray(raw) || raw.length === 0) throw new Error('elements array missing — the source shape changed');

  console.log('Fetching', PUBMED_PT_URL);
  const pubchem = await fetchJson(PUBMED_PT_URL);
  const columns = pubchem.Table.Columns.Column;
  const yearIndex = columns.indexOf('YearDiscovered');
  if (yearIndex < 0) throw new Error('PubChem response has no YearDiscovered column');
  const years = new Map();
  for (const row of pubchem.Table.Row) {
    years.set(Number(row.Cell[columns.indexOf('AtomicNumber')]), row.Cell[yearIndex]);
  }

  // The upstream file also ships element 119 (ununennium), which has no IUPAC
  // confirmation and no measured properties; the dataset stops at 118.
  const elements = raw
    .filter((e) => e.number <= 118)
    .sort((a, b) => a.number - b.number)
    .map((e) => ({
      id: e.symbol,
      atomicNumber: e.number,
      symbol: e.symbol,
      name: e.name,
      atomicMass: e.atomic_mass,
      category: e.category,
      block: e.block,
      group: e.group,
      period: e.period,
      phase: e.phase,
      density: e.density,
      meltingPoint: e.melt,
      boilingPoint: e.boil,
      electronConfiguration: e.electron_configuration,
      electronConfigurationSemantic: e.electron_configuration_semantic,
      electronegativity: e.electronegativity_pauling,
      shells: e.shells,
      cpkHex: e['cpk-hex'] || null,
      // Both discovery fields are upstream verbatim: the "discovered by" column
      // holds a person, an era ("Ancient Egypt") or a year ("5000 BC") depending
      // on the element, and PubChem's year is numeric or a string like "Ancient".
      discoveredBy: e.discovered_by ?? null,
      yearDiscovered: years.has(e.number) ? years.get(e.number) : null,
    }));

  const numbers = elements.map((e) => e.atomicNumber);
  const missing = [];
  for (let n = 1; n <= 118; n++) if (!numbers.includes(n)) missing.push(n);
  if (missing.length) throw new Error(`Missing atomic numbers: ${missing.join(', ')}`);
  const dupes = numbers.filter((n, i) => numbers.indexOf(n) !== i);
  if (dupes.length) throw new Error(`Duplicate atomic numbers: ${dupes.join(', ')}`);

  console.log(`${raw.length} elements upstream, ${elements.length} written (1-118)`);
  console.log(`Missing electronegativity: ${elements.filter((e) => e.electronegativity === null).length}`);
  console.log(`Missing melting point: ${elements.filter((e) => e.meltingPoint === null).length}; missing boiling point: ${elements.filter((e) => e.boilingPoint === null).length}`);
  console.log(`Missing discovery year: ${elements.filter((e) => e.yearDiscovered === null).length}`);

  const json = JSON.stringify(elements, null, 2) + '\n';
  for (const rel of ['data.json', 'data/elements.json', 'data/index.json', 'api/v1/data.json']) {
    fs.writeFileSync(path.join(ROOT, rel), json);
  }

  const indivDir = path.join(API_DIR, 'individual');
  fs.rmSync(indivDir, { recursive: true, force: true });
  fs.mkdirSync(indivDir, { recursive: true });
  for (const e of elements) {
    fs.writeFileSync(path.join(indivDir, `${e.id}.json`), JSON.stringify(e, null, 2) + '\n');
  }

  const byId = {};
  for (const e of elements) byId[e.id] = e;
  fs.writeFileSync(path.join(API_DIR, 'search-index.json'), JSON.stringify({ byId }, null, 2) + '\n');

  const now = new Date();
  const meta = {
    status: 'healthy',
    lastUpdated: now.toISOString(),
    sourceUpdatedAt: null,
    retrievedAt: now.toISOString(),
    recordCount: elements.length,
    version: '1.0.0',
    schemaVersion: '1.0.0',
    source: 'Bowserinator/Periodic-Table-JSON + PubChem periodic table',
    sourceUrl: ELEMENTS_URL,
    license: 'Element facts from IUPAC and NIST; upstream JSON has no licence file',
    updateCadence: 'manual',
    nextUpdateDue: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    lastFailedAt: null,
    failureReason: null,
  };
  fs.writeFileSync(path.join(API_DIR, 'meta.json'), JSON.stringify(meta, null, 2) + '\n');
  fs.writeFileSync(
    path.join(__dirname, 'fixtures/expected.json'),
    JSON.stringify({ recordCount: elements.length, maxAtomicNumber: 118 }, null, 2) + '\n'
  );
  console.log(`Wrote ${elements.length} records, ${elements.length} individual files, search index, meta.json`);
}

main().catch((err) => {
  console.error('Scraper failed:', err.message);
  process.exit(1);
});
