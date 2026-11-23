import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { buildSite, rewriteLinks } from '../scripts/build.mjs';
const require = createRequire(import.meta.url);
const { inspectData, endpointURL, filterEntries } = require('../scripts/catalogue-client.js');
const names = JSON.parse(readFileSync(new URL('../scripts/source-names.json', import.meta.url)));

function fixture(t, selected = ['colors-api']) {
  const root = mkdtempSync(join(process.env.API_TEST_TMP || tmpdir(), 'apis-site-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const put = (path, text) => { mkdirSync(join(root, path, '..'), { recursive: true }); writeFileSync(join(root, path), text); };
  put('index.html', '<html><script src="catalogue.js"></script></html>');
  put('scripts/catalogue-client.js', '/* public client */');
  for (const name of selected) {
    put(`datasets/${name}/api/v1/data.json`, '[{"id":"one","name":"Verified fixture"}]\n');
    put(`datasets/${name}/website/index.html`, '<html><head></head><body><a href="schemas/data.json">schema</a></body></html>');
    put(`datasets/${name}/schemas/data.json`, '{"type":"array"}\n');
    put(`datasets/${name}/openapi.yaml`, JSON.stringify({ openapi: '3.1.0', info: { title: 'Fixture data', version: '1' }, servers: [{ url: `https://chirag127.github.io/${name}` }], paths: { '/api/v1/data.json': { get: { responses: { '200': { description: 'JSON records' } } } } } }));
  }
  put('migration/sources.json', JSON.stringify({ owner: 'chirag127', destination: 'apis', sources: selected.map(name => ({ name, commit: 'a'.repeat(40), files: [] })) }));
  return { root, put, build: () => buildSite({ root, expectedNames: selected }) };
}

test('metadata keys and claimed counts never masquerade as records', () => {
  assert.deepEqual(inspectData({ count: 999, version: '1', source: 'IANA' }), { status: 'unknown', records: 0 });
  assert.deepEqual(inspectData({ count: 99, records: [{ id: 'a' }] }), { status: 'live', records: 1 });
  assert.deepEqual(inspectData([]), { status: 'empty', records: 0 });
  assert.deepEqual(inspectData([{ id: 'sample', name: 'Placeholder record' }]), { status: 'stub', records: 1 });
  assert.deepEqual(inspectData({ records: [{ id: 'real' }, { placeholder: true }] }), { status: 'stub', records: 2 });
});

test('pilot fixtures and awaiting-source rates never appear as live datasets', () => {
  for (const status of ['pilot-fixture', 'awaiting-source-refresh']) {
    assert.deepEqual(inspectData([{ id: 'repo', value: null, status }]), { status: 'stub', records: 1 });
  }
});

test('legacy alias documentation targets only its exact consolidated source', () => {
  assert.equal(rewriteLinks('https://chirag127.github.io/colors/data.json https://chirag127.github.io/colors-extra/data.json', ['colors-api']), 'https://chirag127.github.io/apis/colors-api/data.json https://chirag127.github.io/colors-extra/data.json');
});

test('filters use measured status and combine search with category', () => {
  const entries = [{ name: 'india-states-api', desc: 'States', status: 'live' }, { name: 'http-status-api', desc: 'HTTP codes', status: 'unknown' }, { name: 'colors-api', status: 'stub' }];
  assert.deepEqual(filterEntries(entries, 'live', ''), [entries[0]]);
  assert.deepEqual(filterEntries(entries, 'stub', ''), [entries[2]]);
  assert.deepEqual(filterEntries(entries, 'india', 'states'), [entries[0]]);
  assert.deepEqual(filterEntries(entries, 'all', 'no match'), []);
});

test('endpoint resolution stays under the deployment base and rejects escaping paths', () => {
  assert.equal(endpointURL({ name: 'india-states-api', endpoint: 'api/v1/states.json' }, 'https://example.test/apis/'), 'https://example.test/apis/india-states-api/api/v1/states.json');
  assert.equal(endpointURL({ name: 'colors-api', endpoint: 'data.json' }, 'https://example.test/preview/'), 'https://example.test/preview/colors-api/data.json');
  assert.throws(() => endpointURL({ name: '../secret', endpoint: 'data.json' }, 'https://example.test/apis/'));
  assert.throws(() => endpointURL({ name: 'colors-api', endpoint: '../../outside.json' }, 'https://example.test/apis/'));
});

test('rewrites only exact approved old repositories and remains idempotent', () => {
  const input = 'https://chirag127.github.io/colors-api/api/v1/data.json https://raw.githubusercontent.com/chirag127/colors-api/main/data.json https://github.com/chirag127/colors-api/blob/main/README.md https://github.com/chirag127/colors-api https://github.com/other/colors-api https://chirag127.github.io/colors-api-extra/';
  const expected = 'https://chirag127.github.io/apis/colors-api/api/v1/data.json https://chirag127.github.io/apis/colors-api/data.json https://github.com/chirag127/apis/blob/main/datasets/colors-api/README.md https://github.com/chirag127/apis/tree/main/datasets/colors-api https://github.com/other/colors-api https://chirag127.github.io/colors-api-extra/';
  assert.equal(rewriteLinks(input, ['colors-api']), expected);
  assert.equal(rewriteLinks(expected, ['colors-api']), expected);
  const command = rewriteLinks('curl -s https://chirag127.github.io/colors-api/api/v1/data.json');
  assert.equal(new URL(command.split(' ').at(-1)).pathname, '/apis/colors-api/api/v1/data.json');
});

test('build serves legacy roots, schemas and assets without changing dataset bytes', t => {
  const f = fixture(t);
  const bytes = '{ "url": "https://chirag127.github.io/colors-api/data.json", "records": [{"id":"x"}] }\n';
  f.put('datasets/colors-api/data.json', bytes);
  f.put('datasets/colors-api/website/app.css', 'body { color: red; }');
  f.put('datasets/colors-api/website/index.html', '<html><head><link href="app.css" rel="stylesheet"></head><body><script>fetch("api/v1/data.json")</script></body></html>');
  f.put('datasets/colors-api/tests/secret.txt', 'never publish');
  f.put('datasets/colors-api/.env', 'never publish');
  f.put('datasets/colors-api/.github/workflows/update.yml', 'never publish');
  const report = f.build();
  assert.equal(report.sources, 1);
  assert.equal(readFileSync(join(f.root, '_site/colors-api/data.json'), 'utf8'), bytes);
  assert.equal(readFileSync(join(f.root, 'datasets/colors-api/data.json'), 'utf8'), bytes);
  assert.ok(existsSync(join(f.root, '_site/colors-api/app.css')));
  assert.ok(existsSync(join(f.root, '_site/colors-api/schemas/data.json')));
  assert.ok(!existsSync(join(f.root, '_site/colors-api/tests')));
  assert.ok(!existsSync(join(f.root, '_site/colors-api/.env')));
  assert.ok(!existsSync(join(f.root, '_site/colors-api/.github')));
  assert.match(readFileSync(join(f.root, '_site/colors-api/openapi.yaml'), 'utf8'), /\/apis\/colors-api/);
  const contract = JSON.parse(readFileSync(join(f.root, '_site/colors-api/openapi.json')));
  assert.equal(contract.servers[0].url, 'https://chirag127.github.io/apis/colors-api');
  assert.ok(contract.paths['/api/v1/data.json'].get);
  assert.equal(readFileSync(join(f.root, '_site/colors-api/openapi.yaml'), 'utf8'), JSON.stringify(contract, null, 2) + '\n');
});

test('build includes exactly the approved 70 datasets and resolves special primary endpoints', t => {
  const f = fixture(t, names);
  rmSync(join(f.root, 'datasets/india-states-api/api/v1/data.json'));
  f.put('datasets/india-states-api/api/v1/states.json', '[{"code":"IN-AP"}]');
  rmSync(join(f.root, 'datasets/tlds-api/api/v1/data.json'));
  f.put('datasets/tlds-api/api/v1/tlds.json', '{"records":[{"tld":"com"}],"count":1}');
  const report = f.build();
  const catalogue = JSON.parse(readFileSync(join(f.root, '_site/catalogue.json')));
  assert.equal(report.sources, 70);
  assert.deepEqual(catalogue.map(x => x.name).sort(), [...names].sort());
  assert.equal(catalogue.find(x => x.name === 'india-states-api').endpoint, 'api/v1/states.json');
  assert.equal(catalogue.find(x => x.name === 'tlds-api').endpoint, 'api/v1/tlds.json');
  assert.ok(catalogue.every(x => x.status === 'unknown' && x.auto === false));
});

test('invalid source JSON and an unapproved manifest cannot replace last-good build', t => {
  const f = fixture(t);
  f.put('_site/last-good.txt', 'keep');
  f.put('datasets/colors-api/api/v1/data.json', 'not json');
  assert.throws(f.build, /JSON/);
  assert.equal(readFileSync(join(f.root, '_site/last-good.txt'), 'utf8'), 'keep');
  f.put('migration/sources.json', JSON.stringify({ sources: [{ name: '../escape' }] }));
  assert.throws(f.build, /manifest|source/i);
});

test('nested documentation resolves API fetches at source root and keeps attribution', t => {
  const f = fixture(t);
  f.put('datasets/colors-api/docs/index.html', '<html><head></head><body><footer>Data attribution: Example Registry</footer><script>fetch("api/v1/data.json")</script></body></html>');
  f.build();
  const html = readFileSync(join(f.root, '_site/colors-api/docs/index.html'), 'utf8');
  assert.match(html, /<base href="\/apis\/colors-api\/">/);
  assert.match(html, /Data attribution: Example Registry/);
  assert.equal((html.match(/mailto:chirag@oriz.in/g) || []).length, 1);
});

test('India States documentation offers static search index instead of query API', t => {
  const f = fixture(t, ['india-states-api']);
  f.put('datasets/india-states-api/api/v1/search-index.json', '{}');
  f.put('datasets/india-states-api/website/index.html', '<html><head></head><body><code>/api/v1/search.json?q={query}</code><p>Search by name or capital (client-side via search-index.json)</p></body></html>');
  f.build();
  const html = readFileSync(join(f.root, '_site/india-states-api/index.html'), 'utf8');
  assert.ok(!html.includes('search.json?q='));
  assert.ok(html.includes('/api/v1/search-index.json'));
  assert.ok(html.includes('client-side'));
});

test('source labels remain attribution text instead of broken navigation', t => {
  const f = fixture(t);
  f.put('datasets/colors-api/website/index.html', '<html><head></head><body><a href="Reference compilation">Reference compilation</a><a href="schemas/data.json">Schema</a></body></html>');
  f.build();
  const html = readFileSync(join(f.root, '_site/colors-api/index.html'), 'utf8');
  assert.ok(html.includes('Reference compilation'));
  assert.ok(!html.includes('href="Reference compilation"'));
  assert.ok(html.includes('href="schemas/data.json"'));
});
