import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

// Canonical YAML has schemas absent from legacy JSON; do not silently fall back.
const yamlReader = String.raw`
import json, re, sys, yaml
from yaml.constructor import ConstructorError
class Loader(yaml.SafeLoader):
    pass
# OpenAPI uses YAML 1.2: yes/no and dates must not become booleans/datetimes.
Loader.yaml_implicit_resolvers = {
    key: [(tag, pattern) for tag, pattern in values
          if tag not in {'tag:yaml.org,2002:bool', 'tag:yaml.org,2002:timestamp',
                         'tag:yaml.org,2002:int', 'tag:yaml.org,2002:float'}]
    for key, values in Loader.yaml_implicit_resolvers.items()
}
Loader.add_implicit_resolver('tag:yaml.org,2002:bool', re.compile(r'^(?:true|True|TRUE|false|False|FALSE)$'), list('tTfF'))
Loader.add_implicit_resolver('tag:yaml.org,2002:int', re.compile(r'^[-+]?(?:0o[0-7]+|0x[0-9a-fA-F]+|[0-9]+)$'), list('-+0123456789'))
Loader.add_implicit_resolver('tag:yaml.org,2002:float', re.compile(r'^[-+]?(?:(?:[0-9]+\.[0-9]*|\.[0-9]+)(?:[eE][-+]?[0-9]+)?|[0-9]+[eE][-+]?[0-9]+|\.(?:inf|Inf|INF|nan|NaN|NAN))$'), list('-+0123456789.'))
def integer(loader, node):
    value = loader.construct_scalar(node)
    return int(value, 0 if value.lstrip('-+').startswith(('0o', '0x')) else 10)
Loader.add_constructor('tag:yaml.org,2002:int', integer)
def mapping(loader, node):
    result = {}
    for key_node, value_node in node.value:
        key = loader.construct_object(key_node, deep=True)
        if not isinstance(key, str):
            raise ConstructorError(None, None, 'OpenAPI mapping keys must be strings', key_node.start_mark)
        if key in result:
            raise ConstructorError(None, None, 'duplicate key: ' + key, key_node.start_mark)
        result[key] = loader.construct_object(value_node, deep=True)
    return result
Loader.add_constructor('tag:yaml.org,2002:map', mapping)
text = sys.stdin.buffer.read().decode('utf-8')
if any(isinstance(token, yaml.tokens.AliasToken) for token in yaml.scan(text)):
    raise ValueError('YAML aliases are not supported in generated contracts')
print(json.dumps(yaml.load(text, Loader=Loader), ensure_ascii=True, allow_nan=False))
`;

export function parseYAMLContract(text) {
  const input = String(text);
  // Generated JSON is valid YAML and needs no Python parser on subsequent reads.
  try { return JSON.parse(input); } catch { /* Original YAML needs its maintained parser. */ }
  const python = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
  const result = spawnSync(python, ['-I', '-B', '-c', yamlReader], {
    input, encoding: 'utf8', timeout: 15000, maxBuffer: 16 * 1024 * 1024, windowsHide: true,
  });
  if (result.error || result.status !== 0) throw new Error(`Cannot parse canonical YAML (Python with PyYAML required): ${result.error?.message || result.stderr.trim()}`);
  return JSON.parse(result.stdout);
}

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const safePath = path => typeof path === 'string' && path.length > 0 &&
  !/[\\%?#:\u0000-\u0020]/.test(path) && !path.startsWith('/') &&
  path.split('/').every(part => part !== '' && part !== '.' && part !== '..');
const regexEscape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const methods = ['get', 'head', 'post', 'put', 'patch', 'delete', 'options', 'trace'];

function parameterValue(parameter, document) {
  const seen = new Set();
  while (object(parameter) && parameter.$ref) {
    const ref = parameter.$ref;
    if (typeof ref !== 'string' || !ref.startsWith('#/') || seen.has(ref)) return null;
    seen.add(ref);
    parameter = ref.slice(2).split('/').map(part => part.replace(/~1/g, '/').replace(/~0/g, '~')).reduce((value, key) => object(value) && Object.hasOwn(value, key) ? value[key] : null, document);
  }
  return object(parameter) ? parameter : null;
}

function pathMatch(path, files) {
  if (!path.startsWith('/') || !safePath(path.slice(1))) return null;
  const parts = path.slice(1).split(/(\{[^{}\/]+\})/g);
  if (parts.some((part, index) => index % 2 === 0 && /[{}]/.test(part))) return null;
  const template = parts.length > 1;
  // An extensionless template must not swallow the literal .json suffix as its ID.
  const candidates = /\.json$/i.test(path) ? [path] : [path + '.json'];
  for (const candidate of candidates) {
    if (!template && files.has(candidate.slice(1))) return { path: candidate };
    if (template) {
      const pattern = new RegExp('^' + candidate.slice(1).split(/(\{[^{}\/]+\})/g).map((part, index) => index % 2 ? '[^/]+' : regexEscape(part)).join('') + '$');
      for (const file of files) if (pattern.test(file)) return { path: candidate, file };
    }
  }
  return null;
}

export function adaptJSONContract(document, { name, paths }) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*-api$/.test(name)) throw new Error('Invalid source name');
  if (!Array.isArray(paths) || paths.some(path => !safePath(path))) throw new Error('Invalid public path');
  if (!object(document) || typeof document.openapi !== 'string' || !/^3\.\d+\.\d+/.test(document.openapi) || !object(document.info) || !object(document.paths)) throw new Error('Invalid OpenAPI 3 contract');
  const result = structuredClone(document);
  const files = new Set(paths.filter(path => /\.json$/i.test(path)).sort());
  const servers = [{ url: `https://chirag127.github.io/apis/${name}` }];
  const adaptations = { originalServers: result.servers || [], rewrittenPaths: [], omittedPaths: [], omittedOperations: [], templateMatches: [] };
  if (Object.hasOwn(result, 'x-migration')) adaptations.inherited = result['x-migration'];
  result.servers = servers;
  const kept = {};
  const occupied = new Set();
  // A documented exact .json path owns its schema when an alias collides with it.
  const entries = Object.entries(result.paths).sort(([a], [b]) => Number(!/\.json$/i.test(a)) - Number(!/\.json$/i.test(b)));
  for (const [path, item] of entries) {
    if (path.startsWith('x-')) { Object.defineProperty(kept, path, { value: item, enumerable: true, writable: true, configurable: true }); continue; }
    let reason;
    const match = pathMatch(path, files);
    if (!match) reason = 'No matching published JSON file';
    else if (!object(item)) reason = 'Invalid path item';
    else if (item.$ref) reason = 'Unresolved path item reference';
    else if (occupied.has(match.path.replace(/\{[^{}\/]+\}/g, '{}'))) reason = 'Path collision with another documented endpoint';
    if (reason) { adaptations.omittedPaths.push({ path, reason }); continue; }
    for (const method of methods) {
      if (!Object.hasOwn(item, method)) continue;
      if (!['get', 'head'].includes(method)) {
        adaptations.omittedOperations.push({ path, method, reason: 'Static JSON supports GET and HEAD only' });
        delete item[method];
      } else {
        const operation = item[method];
        const parameters = [...(item.parameters || []), ...(operation?.parameters || [])].map(parameter => parameterValue(parameter, result));
        const queries = parameters.filter(parameter => parameter?.in === 'query');
        if (!object(operation) || parameters.some(parameter => !parameter) || queries.length) {
          adaptations.omittedOperations.push({ path, method, reason: queries.length ? 'Static JSON does not implement query parameters' : 'Invalid operation or unresolved parameter reference', ...(queries.length ? { parameters: [...new Set(queries.map(parameter => parameter.name))] } : {}) });
          delete item[method];
        } else if (operation.servers) operation.servers = structuredClone(servers);
      }
    }
    if (!item.get && !item.head) { adaptations.omittedPaths.push({ path, reason: 'No documented static read operation' }); continue; }
    if (item.servers) item.servers = structuredClone(servers);
    kept[match.path] = item;
    occupied.add(match.path.replace(/\{[^{}\/]+\}/g, '{}'));
    if (match.path !== path) adaptations.rewrittenPaths.push({ from: path, to: match.path });
    if (match.file) adaptations.templateMatches.push({ path: match.path, file: match.file });
  }
  result.paths = kept;
  result['x-migration'] = adaptations;
  return result;
}

export function adaptContracts(sourceRoot, publicPaths, name) {
  const sourceContract = ['openapi.yaml', 'openapi.yml', 'openapi.json'].find(file => existsSync(join(sourceRoot, file)));
  if (!sourceContract) throw new Error(`No source OpenAPI contract: ${name}`);
  const original = readFileSync(join(sourceRoot, sourceContract), 'utf8');
  const document = adaptJSONContract(sourceContract.endsWith('.json') ? JSON.parse(original) : parseYAMLContract(original), { name, paths: publicPaths });
  document['x-migration'].sourceContract = sourceContract;
  const text = JSON.stringify(document, null, 2) + '\n';
  return { 'openapi.json': Buffer.from(text), 'openapi.yaml': Buffer.from(text) };
}
