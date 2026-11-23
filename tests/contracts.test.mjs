import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { adaptJSONContract, adaptContracts, parseYAMLContract } from '../scripts/contracts.mjs';

const operation = { get: { responses: { '200': { description: 'Original response', content: { 'application/json': { schema: { $ref: '#/components/schemas/Record' } } } } } } };
function document(paths) {
  return { openapi: '3.1.0', info: { title: 'Colors', version: '1', license: { name: 'CC-BY-4.0' } }, servers: [{ url: 'https://chirag127.github.io/colors' }], paths, components: { schemas: { Record: { type: 'object', properties: { name: { type: 'string' } } } } } };
}
const adapt = (input, paths) => adaptJSONContract(input, { name: 'colors-api', paths });

test('normalizes server and concrete .json paths without modifying source or schemas', () => {
  const source = document({ '/data/colors': operation, '/data.json': operation, '/missing': operation });
  const before = structuredClone(source);
  const result = adapt(source, ['data/colors.json', 'data.json']);
  assert.deepEqual(source, before);
  assert.deepEqual(result.info, before.info);
  assert.deepEqual(result.components, before.components);
  assert.deepEqual(result.servers, [{ url: 'https://chirag127.github.io/apis/colors-api' }]);
  assert.deepEqual(Object.keys(result.paths).sort(), ['/data.json', '/data/colors.json']);
  assert.deepEqual(result.paths['/data/colors.json'], operation);
  assert.deepEqual(result['x-migration'].rewrittenPaths, [{ from: '/data/colors', to: '/data/colors.json' }]);
  assert.deepEqual(result['x-migration'].omittedPaths, [{ path: '/missing', reason: 'No matching published JSON file' }]);
});

test('template without extension uses .json witness and retains parameters', () => {
  const item = { ...operation, parameters: [{ name: 'country', in: 'path', required: true, schema: { type: 'string', pattern: '^[A-Z]{2}$' } }] };
  const result = adapt(document({ '/api/v1/subdivisions/{country}': item, '/missing/{id}.json': operation }), ['api/v1/subdivisions/IN.json']);
  assert.deepEqual(result.paths['/api/v1/subdivisions/{country}.json'], item);
  assert.equal(Object.keys(result.paths).length, 1);
  assert.deepEqual(result['x-migration'].templateMatches, [{ path: '/api/v1/subdivisions/{country}.json', file: 'api/v1/subdivisions/IN.json' }]);
});

test('template matching escapes regex literals and never spans directories', () => {
  const result = adapt(document({ '/v1.0/{id}.json': operation, '/deep/{id}.json': operation }), ['v1x0/a.json', 'deep/nested/a.json']);
  assert.deepEqual(result.paths, {});
  assert.equal(result['x-migration'].omittedPaths.length, 2);
});

test('explicit path wins collisions over an extensionless alias', () => {
  const exact = { get: { summary: 'Exact contract', responses: { '200': { description: 'OK' } } } };
  const result = adapt(document({ '/data/colors': operation, '/data/colors.json': exact }), ['data/colors.json']);
  assert.deepEqual(result.paths['/data/colors.json'], exact);
  assert.match(result['x-migration'].omittedPaths[0].reason, /collision/i);
});

test('rejects traversal and URL syntax even if caller supplies those file names', () => {
  assert.throws(() => adaptJSONContract(document({}), { name: '../colors-api', paths: [] }), /name/i);
  for (const path of ['../data.json', '/data.json', 'x\\data.json', 'x/%2e%2e/data.json', 'x/data.json?q=1']) {
    assert.throws(() => adapt(document({}), [path]), /path/i);
  }
  const result = adapt(document({ '/../data.json': operation, '/data.json?x=1': operation }), ['data.json']);
  assert.deepEqual(result.paths, {});
});

test('removes retired path/operation server overrides and unsupported write operations', () => {
  const result = adapt(document({ '/data.json': { servers: [{ url: 'https://retired.test' }], get: { ...operation.get, servers: [{ url: 'https://retired.test/v1' }] }, post: operation.get } }), ['data.json']);
  assert.deepEqual(result.paths['/data.json'].servers, result.servers);
  assert.deepEqual(result.paths['/data.json'].get.servers, result.servers);
  assert.ok(!result.paths['/data.json'].post);
  assert.deepEqual(result['x-migration'].omittedOperations, [{ path: '/data.json', method: 'post', reason: 'Static JSON supports GET and HEAD only' }]);
});

test('preserves path extensions and reports unresolved path references', () => {
  const result = adapt(document({ 'x-origin': { name: 'Original' }, '/data.json': { $ref: '#/components/pathItems/Data' } }), ['data.json']);
  assert.deepEqual(result.paths['x-origin'], { name: 'Original' });
  assert.match(result['x-migration'].omittedPaths[0].reason, /reference/i);
});

test('omits query-dependent search semantics even when a static JSON file exists', () => {
  const source = document({ '/api/v1/search.json': { get: { ...operation.get, summary: 'Prefix search', parameters: [{ name: 'q', in: 'query', required: true, schema: { type: 'string' } }] }, head: operation.get } });
  const before = structuredClone(source);
  const result = adapt(source, ['api/v1/search.json']);
  assert.ok(!result.paths['/api/v1/search.json'].get);
  assert.deepEqual(result.paths['/api/v1/search.json'].head, operation.get);
  assert.deepEqual(result['x-migration'].omittedOperations, [{ path: '/api/v1/search.json', method: 'get', reason: 'Static JSON does not implement query parameters', parameters: ['q'] }]);
  assert.deepEqual(source, before);
});

test('path-level query references omit dependent operations while preserving component schemas', () => {
  const source = document({ '/data.json': { parameters: [{ $ref: '#/components/parameters/Query' }], get: operation.get } });
  source.components.parameters = { Query: { name: 'q', in: 'query', schema: { type: 'string' } } };
  const result = adapt(source, ['data.json']);
  assert.deepEqual(result.paths, {});
  assert.deepEqual(result.components, source.components);
  assert.deepEqual(result['x-migration'].omittedOperations[0].parameters, ['q']);
});

test('canonical YAML decodes Unicode identically across platform locales', () => {
  const result = parseYAMLContract('openapi: 3.1.0\ninfo:\n  title: Karnātaka — Ω\n  version: "1"\npaths: {}\n');
  assert.equal(result.info.title, 'Karnātaka — Ω');
});

function fixture(t) {
  const parent = process.env.API_TEST_TMP || tmpdir();
  mkdirSync(parent, { recursive: true });
  const sourceRoot = mkdtempSync(join(parent, 'contracts-'));
  t.after(() => rmSync(sourceRoot, { recursive: true, force: true }));
  return { sourceRoot, put: (name, contents) => writeFileSync(join(sourceRoot, name), contents) };
}

const yaml = `openapi: 3.1.0
info:
  title: Canonical YAML
  version: '1'
  description: >-
    First line
    second line.
  license: {name: CC-BY-4.0}
servers:
  - url: https://chirag127.github.io/colors-api
paths:
  /data/colors:
    get:
      responses:
        '200':
          description: Original response
          content:
            application/json:
              schema: {$ref: '#/components/schemas/Record'}
components:
  schemas:
    Record:
      type: object
      properties:
        flag: {type: string, enum: [yes, no, null], example: 'yes'}
        date: {type: string, example: 2026-11-23}
        active: {type: boolean, example: true}
`;

test('canonical YAML wins over stale JSON; both generated formats match and source bytes survive', t => {
  const f = fixture(t);
  f.put('openapi.yaml', yaml);
  f.put('openapi.json', JSON.stringify(document({ '/stale': operation })));
  const before = readFileSync(join(f.sourceRoot, 'openapi.yaml'));
  const result = adaptContracts(f.sourceRoot, ['data/colors.json'], 'colors-api');
  const doc = JSON.parse(result['openapi.json']);
  assert.equal(doc['x-migration'].sourceContract, 'openapi.yaml');
  assert.deepEqual(result['openapi.json'], result['openapi.yaml']);
  assert.deepEqual(parseYAMLContract(result['openapi.yaml']), doc);
  assert.equal(doc.info.title, 'Canonical YAML');
  assert.equal(doc.info.description, 'First line second line.');
  assert.deepEqual(doc.components.schemas.Record.properties.flag.enum, ['yes', 'no', null]);
  assert.equal(doc.components.schemas.Record.properties.date.example, '2026-11-23');
  assert.equal(doc.components.schemas.Record.properties.active.example, true);
  assert.deepEqual(readFileSync(join(f.sourceRoot, 'openapi.yaml')), before);
  assert.deepEqual(doc['x-migration'].rewrittenPaths, [{ from: '/data/colors', to: '/data/colors.json' }]);
});

test('JSON-only source generates both formats without YAML parser', t => {
  const f = fixture(t);
  f.put('openapi.json', JSON.stringify(document({ '/data.json': operation })));
  const result = adaptContracts(f.sourceRoot, ['data.json'], 'colors-api');
  const doc = JSON.parse(result['openapi.json']);
  assert.equal(doc['x-migration'].sourceContract, 'openapi.json');
  assert.deepEqual(result['openapi.json'], result['openapi.yaml']);
  assert.deepEqual(doc.components, document({}).components);
});

test('invalid or duplicate-key canonical YAML fails instead of falling back to stale JSON', t => {
  const f = fixture(t);
  f.put('openapi.json', JSON.stringify(document({ '/data.json': operation })));
  for (const bad of ['info: [unterminated', 'openapi: 3.1.0\ninfo: {}\ninfo: {}\npaths: {}']) {
    f.put('openapi.yaml', bad);
    assert.throws(() => adaptContracts(f.sourceRoot, ['data.json'], 'colors-api'), /YAML|duplicate/i);
  }
});

test('no source contract or invalid OpenAPI fails without inventing a contract', t => {
  const f = fixture(t);
  assert.throws(() => adaptContracts(f.sourceRoot, ['data.json'], 'colors-api'), /contract/i);
  assert.throws(() => adapt({ swagger: '2.0', info: {}, paths: {} }, []), /OpenAPI/i);
});
