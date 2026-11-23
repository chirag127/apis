import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { sourcePlan, dueOn, refreshSource, loadSources } from '../scripts/refresh.mjs';

const names = `currencies-api currency-rates-api gsec-rates-api gst-rates-api income-tax-slabs-api indian-banks-api ipo-performance-api mutual-fund-categories-api rbi-rates-api tds-rates-api countries-api holiday-world-api india-airports-api india-districts-api india-holidays-api india-pincode-api india-railway-stations-api india-states-api iso-3166-2-api world-airports-api gate-syllabus-api govt-colleges-api govt-hospitals-api govt-schemes-api india-parliament-api jee-syllabus-api ncert-books-api neet-syllabus-api upsc-syllabus-api colors-api crypto-algorithms-api css-properties-api git-commands-api html-elements-api html-entities-api html-entities-api http-headers-api http-status-api javascript-builtin-api json-schema-ref-api linux-commands-api mime-types-api programming-languages-api regex-tokens-api software-licenses-api sql-functions-api unicode-blocks-api country-calling-codes-api gpus-api mobile-chipsets-api phone-number-formats-api tcp-ports-api tlds-api usb-standards-api wifi-standards-api chemistry-formulas-api math-formulas-api nav-units-api periodic-table-api physics-formulas-api si-units-api indian-crops-api indian-foods-api indian-spices-api nutrition-api cricket-ipl-api cricket-world-cup-api olympics-api emoji-api languages-api quotes-api`.split(' ').filter((n, i, all) => all.indexOf(n) === i);

function fixture(t, name = 'currencies-api', generator = '') {
  const root = fs.mkdtempSync(join(process.env.API_REFRESH_TEMP || tmpdir(), 'refresh-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const put = (p, data) => { fs.mkdirSync(join(root, p, '..'), { recursive: true }); fs.writeFileSync(join(root, p), data); };
  put('migration/sources.json', JSON.stringify({ owner: 'chirag127', destination: 'apis', sources: names.map(name => ({ name })) }));
  const dir = join(root, 'datasets', name);
  put(`datasets/${name}/api/v1/data.json`, '[{"id":"USD","code":"USD","name":"Dollar"}]\n');
  put(`datasets/${name}/schemas/data.json`, '{"type":"array","items":{"required":["id","name"]}}');
  put(`datasets/${name}/README.md`, 'Original instructions');
  put(`datasets/${name}/scraper/index.cjs`, `const fs = require('node:fs');\n${generator}`);
  put(`datasets/${name}/scripts/validate.cjs`, "const fs=require('node:fs'); const d=JSON.parse(fs.readFileSync('api/v1/data.json')); if (!d.every(x=>x.id && x.name)) process.exit(4);");
  put(`datasets/${name}/tests/validate-schema.test.cjs`, "const fs=require('node:fs'); if(!Array.isArray(JSON.parse(fs.readFileSync('api/v1/data.json')))) process.exit(5);");
  return { root, dir, put, run: () => refreshSource({ root, name, tempRoot: root }) };
}

test('manifest admits exact 70 names and rejects unapproved or duplicate sources', t => {
  const f = fixture(t);
  assert.equal(loadSources(f.root).length, 70);
  f.put('migration/sources.json', JSON.stringify({ owner: 'chirag127', destination: 'apis', sources: [...names.slice(1), '../private'].map(name => ({ name })) }));
  assert.throws(() => loadSources(f.root), /source|manifest/i);
  f.put('migration/sources.json', JSON.stringify({ owner: 'chirag127', destination: 'apis', sources: [...names.slice(1), names[1]].map(name => ({ name })) }));
  assert.throws(() => loadSources(f.root), /source|manifest/i);
});

test('unsupported sources do not run a validation-only scraper or invent freshness', async t => {
  const f = fixture(t, 'colors-api', "throw new Error('must not execute');");
  const before = fs.readFileSync(join(f.dir, 'api/v1/data.json'));
  const result = await f.run();
  assert.equal(result.status, 'unsupported');
  assert.match(result.reason, /validation.only|fetcher/i);
  assert.deepEqual(fs.readFileSync(join(f.dir, 'api/v1/data.json')), before);
  assert.equal(sourcePlan('mime-types-api').supported, false);
  assert.equal(sourcePlan('india-states-api').supported, false);
});

test('supported recipes retain source cadence and chemistry dependency isolation', () => {
  assert.equal(sourcePlan('currencies-api').strategy, 'cjs');
  assert.equal(sourcePlan('html-entities-api').strategy, 'build-js');
  assert.equal(sourcePlan('chemistry-formulas-api').strategy, 'python');
  assert.equal(dueOn('html-entities-api', new Date('2026-11-23T07:17:00Z')), true);
  assert.equal(dueOn('html-entities-api', new Date('2026-11-24T07:17:00Z')), false);
  assert.equal(dueOn('chemistry-formulas-api', new Date('2026-12-01T07:17:00Z')), true);
  assert.equal(dueOn('currencies-api', new Date('2027-01-01T07:17:00Z')), true);
  assert.equal(dueOn('currencies-api', new Date('2026-12-01T07:17:00Z')), false);
  assert.equal(dueOn('colors-api', new Date('2027-01-01T07:17:00Z')), false);
});

test('scraper partial writes then failure leave original tree byte-identical', async t => {
  const f = fixture(t, 'currencies-api', "fs.writeFileSync('api/v1/data.json','[]'); fs.writeFileSync('api/v1/new.json','{}'); process.exit(9);");
  const before = fs.readFileSync(join(f.dir, 'api/v1/data.json'));
  await assert.rejects(f.run, /exit|failed/i);
  assert.deepEqual(fs.readFileSync(join(f.dir, 'api/v1/data.json')), before);
  assert.equal(fs.existsSync(join(f.dir, 'api/v1/new.json')), false);
});

test('successful scraper cannot publish invalid JSON, schema failures or scaffold records', async t => {
  for (const output of ['not json', '[{"id":"USD"}]', '[{"id":"sample","name":"Placeholder record"}]', '[]']) {
    const f = fixture(t, 'currencies-api', `fs.writeFileSync('api/v1/data.json',${JSON.stringify(output)});`);
    const before = fs.readFileSync(join(f.dir, 'api/v1/data.json'));
    await assert.rejects(f.run);
    assert.deepEqual(fs.readFileSync(join(f.dir, 'api/v1/data.json')), before);
  }
});

test('validated success copies only generated outputs, reports exact changed paths and supports deletion', async t => {
  const f = fixture(t, 'currencies-api', "fs.writeFileSync('api/v1/data.json', '[{\"id\":\"USD\",\"code\":\"USD\",\"name\":\"US Dollar\"}]'); fs.rmSync('api/v1/obsolete.json'); fs.writeFileSync('api/v1/new.json','{}');");
  f.put('datasets/currencies-api/api/v1/obsolete.json', '{}');
  const result = await f.run();
  assert.equal(result.status, 'updated');
  assert.deepEqual(result.changedPaths.sort(), ['datasets/currencies-api/api/v1/data.json', 'datasets/currencies-api/api/v1/new.json', 'datasets/currencies-api/api/v1/obsolete.json']);
  assert.equal(JSON.parse(fs.readFileSync(join(f.dir, 'api/v1/data.json')))[0].name, 'US Dollar');
  assert.equal(fs.existsSync(join(f.dir, 'api/v1/obsolete.json')), false);
  assert.equal(fs.readFileSync(join(f.dir, 'README.md'), 'utf8'), 'Original instructions');
  assert.equal(fs.existsSync(join(f.dir, 'package-lock.json')), false);
});

test('generator edits to source code abort publication instead of weakening validation', async t => {
  const f = fixture(t, 'currencies-api', "fs.writeFileSync('README.md','changed'); fs.writeFileSync('api/v1/data.json','[{\"id\":\"EUR\",\"name\":\"Euro\"}]');");
  await assert.rejects(f.run, /outside|non.generated/i);
  assert.equal(fs.readFileSync(join(f.dir, 'README.md'), 'utf8'), 'Original instructions');
  assert.equal(JSON.parse(fs.readFileSync(join(f.dir, 'api/v1/data.json')))[0].id, 'USD');
});

test('dedicated builder requires count and mirror consistency before publication', async t => {
  const f = fixture(t, 'html-entities-api');
  const original = '{"count":1,"entities":[{"name":"&amp;","codepoints":[38],"character":"&","legacy":false}]}';
  f.put('datasets/html-entities-api/data/entities.json', original);
  f.put('datasets/html-entities-api/api/v1/entities.json', original);
  f.put('datasets/html-entities-api/scripts/build.js', "const fs=require('node:fs'); fs.writeFileSync('api/v1/entities.json', '{\"count\":100,\"entities\":[]}');");
  await assert.rejects(f.run, /count|empty|mirror/i);
  assert.equal(fs.readFileSync(join(f.dir, 'api/v1/entities.json'), 'utf8'), original);
});

test('selection rejects traversal before touching a dataset', async t => {
  const f = fixture(t);
  await assert.rejects(() => refreshSource({ root: f.root, name: '../currencies-api', tempRoot: f.root }), /source|allowlist/i);
});

test('validate-only does not execute scraper or change source data', async t => {
  const f = fixture(t, 'currencies-api', "throw new Error('must not execute');");
  const before = fs.readFileSync(join(f.dir, 'api/v1/data.json'));
  const result = await refreshSource({ root: f.root, name: 'currencies-api', validateOnly: true });
  assert.equal(result.status, 'validated');
  assert.equal(result.records, 1);
  assert.deepEqual(fs.readFileSync(join(f.dir, 'api/v1/data.json')), before);
});

test('dedicated builder success validates mirrors and does not require npm', async t => {
  const f = fixture(t, 'html-entities-api');
  const original = { count: 1, entities: [{ name: '&amp;', codepoints: [38], character: '&', legacy: false }] };
  const next = { ...original, generatedFrom: 'https://example.test/fixture' };
  f.put('datasets/html-entities-api/data/entities.json', JSON.stringify(original));
  f.put('datasets/html-entities-api/api/v1/entities.json', JSON.stringify(original));
  f.put('datasets/html-entities-api/scripts/build.js', `const fs=require('node:fs'); for(const p of ['data/entities.json','api/v1/entities.json']) fs.writeFileSync(p,${JSON.stringify(JSON.stringify(next))});`);
  const result = await f.run();
  assert.equal(result.status, 'updated');
  assert.deepEqual(JSON.parse(fs.readFileSync(join(f.dir, 'api/v1/entities.json'))), next);
  assert.equal(fs.existsSync(join(f.dir, 'package.json')), false);
});

test('upstream truncation and TLD fallback cannot pass as successful refreshes', async t => {
  const f = fixture(t, 'currencies-api', "fs.writeFileSync('api/v1/data.json','[{\"id\":\"USD\",\"name\":\"Dollar\"}]');");
  const original = '[{"id":"USD","name":"Dollar"},{"id":"EUR","name":"Euro"}]';
  f.put('datasets/currencies-api/api/v1/data.json', original);
  await assert.rejects(f.run, /count decreased/);
  assert.equal(fs.readFileSync(join(f.dir, 'api/v1/data.json'), 'utf8'), original);
  const tld = fixture(t, 'tlds-api');
  const data = '{"count":1,"records":[{"tld":"com","type":"Generic","decoded":null,"script":null}]}';
  tld.put('datasets/tlds-api/api/v1/tlds.json', data);
  tld.put('datasets/tlds-api/data/tlds.json', data);
  tld.put('datasets/tlds-api/scripts/build.js', "console.warn('Root DB unavailable (HTTP 503) — falling back to structural classification');");
  await assert.rejects(tld.run, /fallback/);
  assert.equal(fs.readFileSync(join(tld.dir, 'data/tlds.json'), 'utf8'), data);
});

test('a publication write failure rolls back already-applied generated files', async t => {
  const f = fixture(t, 'currencies-api', "fs.writeFileSync('api/v1/data.json','[{\"id\":\"EUR\",\"name\":\"Euro\"}]'); fs.writeFileSync('api/v1/new.json','{}');");
  const original = fs.readFileSync(join(f.dir, 'api/v1/data.json'));
  const rename = fs.renameSync;
  t.mock.method(fs, 'renameSync', function (from, to) {
    if (to === join(f.dir, 'api/v1/new.json')) throw new Error('simulated disk error');
    return rename(from, to);
  });
  await assert.rejects(f.run, /disk error/);
  assert.deepEqual(fs.readFileSync(join(f.dir, 'api/v1/data.json')), original);
  assert.equal(fs.existsSync(join(f.dir, 'api/v1/new.json')), false);
});

test('CLI rejects reports inside checkout before running a scraper', t => {
  const f = fixture(t, 'currencies-api', "fs.writeFileSync('api/v1/data.json','[{\"id\":\"EUR\",\"name\":\"Euro\"}]');");
  const original = fs.readFileSync(join(f.dir, 'api/v1/data.json'));
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('../scripts/refresh.mjs', import.meta.url)), '--root', f.root, '--source', 'currencies-api', '--report', join(f.dir, 'api/v1/data.json')], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /outside the checkout/);
  assert.deepEqual(fs.readFileSync(join(f.dir, 'api/v1/data.json')), original);
});

test('world airports validates the full dataset and rejects a divergent full-data mirror', async t => {
  const f = fixture(t, 'world-airports-api');
  const records = [
    { ident: 'VABB', name: 'Mumbai', type: 'large_airport', lat: 19.09, lon: 72.86, country: 'IN' },
    { ident: 'EGLL', name: 'Heathrow', type: 'large_airport', lat: 51.47, lon: -0.45, country: 'GB' },
  ];
  const full = JSON.stringify({ count: 2, records });
  f.put('datasets/world-airports-api/api/v1/airports.json', full);
  f.put('datasets/world-airports-api/data/airports.json', full);
  f.put('datasets/world-airports-api/api/v1/index.json', JSON.stringify({ count: 2, countries: [{ country: 'IN', count: 1 }, { country: 'GB', count: 1 }] }));
  f.put('datasets/world-airports-api/api/v1/airports/IN.json', JSON.stringify({ count: 1, records: [records[0]] }));
  f.put('datasets/world-airports-api/api/v1/airports/GB.json', JSON.stringify({ count: 1, records: [records[1]] }));
  f.put('datasets/world-airports-api/scripts/build.js', "throw new Error('validate-only must not fetch');");
  const result = await refreshSource({ root: f.root, name: 'world-airports-api', validateOnly: true });
  assert.equal(result.status, 'validated');
  assert.equal(result.records, 2);
  f.put('datasets/world-airports-api/data/airports.json', JSON.stringify({ count: 1, records: [records[0]] }));
  await assert.rejects(() => refreshSource({ root: f.root, name: 'world-airports-api', validateOnly: true }), /mirror differ/);
  assert.equal(fs.readFileSync(join(f.dir, 'api/v1/airports.json'), 'utf8'), full);
});
