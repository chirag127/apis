import fs from 'node:fs';
import { join, resolve, dirname, relative, sep, isAbsolute } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const approvedNames = JSON.parse(fs.readFileSync(new URL('./source-names.json', import.meta.url), 'utf8'));
if (!Array.isArray(approvedNames) || approvedNames.length !== 70 || new Set(approvedNames).size !== 70 || approvedNames.some(name => !/^[a-z0-9]+(?:-[a-z0-9]+)*-api$/.test(name))) throw new Error('Invalid approved source list');
const APPROVED = new Set(approvedNames);
const CJS = new Set(['currencies-api', 'http-status-api', 'periodic-table-api', 'emoji-api']);
const BUILDERS = {
  'html-entities-api': { file: 'entities', key: 'entities', fields: ['name', 'codepoints', 'character', 'legacy'], cadence: 'weekly' },
  'iso-3166-2-api': { file: 'subdivisions', key: 'records', fields: ['code', 'name', 'type', 'country'], cadence: 'monthly' },
  'phone-number-formats-api': { file: 'countries', dataFile: 'formats', key: 'records', fields: ['isoCountry', 'callingCode', 'digitsMin', 'digitsMax'], cadence: 'weekly' },
  'tcp-ports-api': { file: 'ports', key: 'records', fields: ['port', 'portRange', 'transport', 'name', 'description'], cadence: 'monthly' },
  'tlds-api': { file: 'tlds', key: 'records', fields: ['tld', 'type', 'decoded', 'script'], cadence: 'monthly' },
  'world-airports-api': { file: 'airports', key: 'records', fields: ['ident', 'name', 'type', 'lat', 'lon', 'country'], cadence: 'weekly' },
};
const IGNORED = new Set(['.git', 'node_modules', '__pycache__', '.pytest_cache', '.venv']);

export function sourcePlan(name) {
  if (!APPROVED.has(name)) throw new Error(`Source outside allowlist: ${name}`);
  if (CJS.has(name)) return { supported: true, strategy: 'cjs', cadence: 'quarterly', node: '>=20', outputs: ['api/', 'data/', 'data.json', 'scraper/fixtures/expected.json'] };
  if (BUILDERS[name]) return { supported: true, strategy: 'build-js', cadence: BUILDERS[name].cadence, node: '>=22', outputs: ['api/', 'data/'] };
  if (name === 'chemistry-formulas-api') return { supported: true, strategy: 'python', cadence: 'monthly', python: '3.12', outputs: ['api/', 'data/', 'schemas/'] };
  const reason = name === 'mime-types-api' ? 'No checked-in fetcher or builder'
    : name === 'india-states-api' ? 'Validation-only reference scraper; does not fetch current state data'
      : 'Validation-only scraper; no maintained fetcher (existing data may be scaffold)';
  return { supported: false, reason, cadence: null, outputs: [] };
}

export function dueOn(name, date = new Date()) {
  if (!Number.isFinite(date.getTime())) throw new Error('Invalid scheduling date');
  const plan = sourcePlan(name);
  if (!plan.supported) return false;
  if (plan.cadence === 'weekly') return date.getUTCDay() === 1;
  return date.getUTCDate() === 1 && (plan.cadence === 'monthly' || date.getUTCMonth() % 3 === 0);
}

export function loadSources(root) {
  const manifest = JSON.parse(fs.readFileSync(join(root, 'migration/sources.json'), 'utf8'));
  const names = manifest.sources?.map(source => source.name);
  if (manifest.owner !== 'chirag127' || manifest.destination !== 'apis' || !names || names.length !== APPROVED.size || new Set(names).size !== APPROVED.size || names.some(name => !APPROVED.has(name))) {
    throw new Error('Migration manifest must contain exactly the 70 approved sources');
  }
  return names;
}

function filesAt(root, prefix = '') {
  const files = new Map();
  for (const entry of fs.readdirSync(join(root, prefix), { withFileTypes: true })) {
    if (IGNORED.has(entry.name)) continue;
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) throw new Error(`Symlinks are not refresh inputs/outputs: ${path}`);
    if (entry.isDirectory()) for (const pair of filesAt(root, path)) files.set(...pair);
    else if (entry.isFile()) files.set(path, createHash('sha256').update(fs.readFileSync(join(root, path))).digest('hex'));
    else throw new Error(`Unsupported file type: ${path}`);
  }
  return files;
}

function changes(before, after) {
  return [...new Set([...before.keys(), ...after.keys()])].filter(path => before.get(path) !== after.get(path)).sort();
}

function generated(path, plan) {
  return path.endsWith('.json') && !path.split('/').some(part => part.startsWith('.')) && plan.outputs.some(output => output.endsWith('/') ? path.startsWith(output) : path === output);
}

function readJSON(path) {
  try { return JSON.parse(fs.readFileSync(path, 'utf8')); }
  catch (error) { throw new Error(`Invalid or missing JSON ${path}: ${error.message}`); }
}

function recordsAt(root, name) {
  const builder = BUILDERS[name];
  const document = readJSON(join(root, builder ? `api/v1/${builder.file}.json` : 'api/v1/data.json'));
  const records = builder ? document[builder.key] : document;
  if (!Array.isArray(records) || !records.length) throw new Error(`${name}: empty or invalid records`);
  if (builder && document.count !== records.length) throw new Error(`${name}: count does not match records`);
  return { document, records };
}

function validateOutput(root, name, baselineCount) {
  const plan = sourcePlan(name);
  const inventory = filesAt(root);
  for (const path of inventory.keys()) if (generated(path, plan)) readJSON(join(root, path));
  const { document, records } = recordsAt(root, name);
  // An unattended refresh cannot distinguish upstream truncation from legitimate removal.
  if (records.length < baselineCount) throw new Error(`${name}: record count decreased; review source removal before publishing`);
  const builder = BUILDERS[name];
  const schemaFile = join(root, 'schemas/data.json');
  const required = builder?.fields || (fs.existsSync(schemaFile) ? readJSON(schemaFile).items?.required : []) || [];
  for (const record of records) {
    if (!record || typeof record !== 'object' || Array.isArray(record) || required.some(field => !(field in record))) throw new Error(`${name}: required record fields missing`);
    if (record.placeholder === true || record.scaffold === true || /^(sample|placeholder|todo|example)([-_ ]|$)/i.test(String(record.id || '')) || /\b(placeholder record|scaffold|TODO:|replace me)\b/i.test(JSON.stringify(record))) throw new Error(`${name}: scaffold records cannot be refreshed`);
  }
  if (builder) {
    const mirror = readJSON(join(root, `data/${builder.dataFile || builder.file}.json`));
    if (JSON.stringify(mirror) !== JSON.stringify(document)) throw new Error(`${name}: primary JSON and data mirror differ`);
  } else if (plan.strategy === 'cjs') {
    for (const mirror of ['data.json', 'data/index.json']) {
      if (fs.existsSync(join(root, mirror)) && JSON.stringify(readJSON(join(root, mirror))) !== JSON.stringify(document)) throw new Error(`${name}: primary JSON and ${mirror} mirror differ`);
    }
  }
  return records.length;
}

function command(executable, args, cwd, timeout = 600_000, env = process.env, rejectOutput) {
  return new Promise((resolveCommand, reject) => {
    const child = spawn(executable, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'], shell: false, timeout });
    let output = '', outputFailure = false, spawnError;
    // Keep failure context bounded; do not echo environment or download bodies into CI logs.
    const capture = data => {
      output = (output + data.toString()).slice(-4000);
      if (rejectOutput?.test(output)) outputFailure = true;
    };
    child.stdout.on('data', capture);
    child.stderr.on('data', capture);
    child.on('error', error => { spawnError = error; });
    child.on('close', (code, signal) => {
      if (spawnError) reject(spawnError);
      else if (outputFailure) reject(new Error('Source used degraded fallback data; refresh refused'));
      else if (code === 0) resolveCommand(output);
      else reject(new Error(`${executable} ${args.join(' ')} failed (exit ${code}, signal ${signal}): ${output}`));
    });
  });
}

async function pipeline(work, name, temp) {
  const plan = sourcePlan(name);
  const env = { ...process.env, TMPDIR: temp, TMP: temp, TEMP: temp, PYTHONDONTWRITEBYTECODE: '1', PIP_DISABLE_PIP_VERSION_CHECK: '1', PIP_NO_CACHE_DIR: '1' };
  const node = path => command(process.execPath, [path], work, 600_000, env);
  if (plan.strategy === 'python') {
    const python = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
    const venv = join(temp, 'venv');
    await command(python, ['-m', 'venv', venv], work, 120_000, env);
    const isolatedPython = join(venv, process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
    await command(isolatedPython, ['-m', 'pip', 'install', '-r', 'requirements.txt'], work, 600_000, env);
    for (const args of [['scraper/fetch.py'], ['scripts/build_api.py'], ['-m', 'pytest', '-q', '-p', 'no:cacheprovider'], ['scripts/validate.py']]) await command(isolatedPython, args, work, 1_200_000, env);
  } else if (plan.strategy === 'build-js') {
    // The preserved TLD builder silently substitutes guessed types when IANA's root DB fails.
    await command(process.execPath, ['scripts/build.js'], work, 600_000, env, name === 'tlds-api' ? /Root DB unavailable|falling back to structural classification/i : undefined);
  } else {
    // These four audited fetchers already generate individual files, search indexes and rich metadata.
    // Legacy generic generators would overwrite that metadata and reintroduce false freshness.
    await node('scraper/index.cjs');
    await node('scripts/validate.cjs');
    await node('tests/validate-schema.test.cjs');
  }
}

function publishChanges(source, work, before, after, changed, temp) {
  if (changes(before, filesAt(source)).length) throw new Error('Dataset changed during refresh; refusing concurrent overwrite');
  const backup = join(temp, 'backup');
  fs.mkdirSync(backup);
  for (const path of changed) if (before.has(path)) {
    fs.mkdirSync(dirname(join(backup, path)), { recursive: true });
    fs.copyFileSync(join(source, path), join(backup, path));
  }
  const applied = [];
  try {
    for (const path of changed) {
      const target = join(source, path);
      applied.push(path);
      if (!after.has(path)) fs.unlinkSync(target);
      else {
        fs.mkdirSync(dirname(target), { recursive: true });
        const pending = `${target}.refresh-${randomUUID()}`;
        try { fs.copyFileSync(join(work, path), pending); fs.renameSync(pending, target); }
        finally { fs.rmSync(pending, { force: true }); }
      }
    }
  } catch (error) {
    for (const path of applied.reverse()) {
      if (before.has(path)) fs.copyFileSync(join(backup, path), join(source, path));
      else fs.rmSync(join(source, path), { force: true });
    }
    throw error;
  }
}

export async function refreshSource({ root, name, tempRoot = process.env.API_REFRESH_TEMP || tmpdir(), validateOnly = false }) {
  sourcePlan(name);
  if (!loadSources(root).includes(name)) throw new Error('Source absent from manifest');
  const plan = sourcePlan(name);
  if (!plan.supported) return { name, status: 'unsupported', reason: plan.reason, changedPaths: [] };
  const source = join(fs.realpathSync(root), 'datasets', name);
  if (relative(source, fs.realpathSync(source)) !== '') throw new Error('Dataset path must not redirect outside datasets');
  const before = filesAt(source);
  const baselineCount = recordsAt(source, name).records.length;
  if (validateOnly) {
    const records = validateOutput(source, name, baselineCount);
    return { name, status: 'validated', records, changedPaths: [] };
  }
  const temp = fs.mkdtempSync(join(resolve(tempRoot), 'apis-refresh-'));
  try {
    const work = join(temp, name);
    fs.mkdirSync(work);
    for (const path of before.keys()) {
      fs.mkdirSync(dirname(join(work, path)), { recursive: true });
      fs.copyFileSync(join(source, path), join(work, path));
    }
    await pipeline(work, name, temp);
    const after = filesAt(work);
    const changed = changes(before, after);
    if (changed.some(path => !generated(path, plan))) throw new Error('Generator modified files outside approved generated outputs');
    const records = validateOutput(work, name, baselineCount);
    publishChanges(source, work, before, after, changed, temp);
    return { name, status: changed.length ? 'updated' : 'unchanged', records, changedPaths: changed.map(path => `datasets/${name}/${path}`) };
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
}

async function main() {
  const { values } = parseArgs({ options: { source: { type: 'string', default: 'due' }, root: { type: 'string' }, report: { type: 'string' }, pathspec: { type: 'string' }, plan: { type: 'boolean' }, 'validate-only': { type: 'boolean' } } });
  const root = resolve(values.root || join(dirname(fileURLToPath(import.meta.url)), '..'));
  const outputs = [values.report, values.pathspec].filter(Boolean).map(file => resolve(file));
  if (new Set(outputs).size !== outputs.length) throw new Error('Report and pathspec must be separate files');
  for (const file of outputs) {
    const canonical = join(fs.realpathSync(dirname(file)), file.slice(dirname(file).length + 1));
    const rel = relative(fs.realpathSync(root), canonical);
    if (!isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${sep}`)) throw new Error('Reports/pathspecs must be outside the checkout');
    if (fs.existsSync(file) && fs.lstatSync(file).isSymbolicLink()) throw new Error('Report/pathspec cannot be a symlink');
  }
  const all = loadSources(root);
  const selected = values.source === 'all' ? all : values.source === 'due' ? all.filter(name => dueOn(name)) : [values.source];
  for (const name of selected) sourcePlan(name);
  if (values.plan) { console.log(JSON.stringify(selected.map(name => ({ name, ...sourcePlan(name) })), null, 2)); return; }
  const results = [];
  for (const name of selected) {
    try { results.push(await refreshSource({ root, name, validateOnly: values['validate-only'] })); }
    catch (error) { results.push({ name, status: 'failed', reason: error.message, changedPaths: [] }); }
  }
  const report = { results, changedPaths: results.flatMap(result => result.changedPaths), failed: results.filter(result => result.status === 'failed').length };
  console.log(JSON.stringify(report, null, 2));
  for (const [file, content] of [[values.report, JSON.stringify(report, null, 2) + '\n'], [values.pathspec, report.changedPaths.map(path => `${path}\0`).join('')]]) {
    if (!file) continue;
    fs.writeFileSync(file, content);
  }
  if (report.failed) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode = 1; });
