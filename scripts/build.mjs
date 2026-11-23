import fs from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { adaptContracts } from './contracts.mjs';
const require = createRequire(import.meta.url);
const { inspectData } = require('./catalogue-client.js');
const approved = JSON.parse(fs.readFileSync(new URL('./source-names.json', import.meta.url)));
const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const contacts = [['mailto:chirag@oriz.in', 'chirag@oriz.in'], ['https://github.com/chirag127', 'GitHub'], ['https://www.linkedin.com/in/chirag127/', 'LinkedIn'], ['https://x.com/singhal127', 'X'], ['https://www.youtube.com/@ChiragSinghal127', 'YouTube'], ['https://www.instagram.com/chiragsinghal127/', 'Instagram'], ['https://www.reddit.com/user/Far_Macaron_9910/', 'Reddit'], ['https://buymeacoffee.com/chirag127', 'Buy me a coffee']];
const footer = `<footer class="hire-me"><h3>Hire me</h3><p>Chirag Singhal — building free, open APIs and tools.</p><p>${contacts.map(([url, label]) => `<a href="${url}">${label}</a>`).join(' · ')}</p></footer>`;
const escape = text => String(text).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

export function rewriteLinks(text, names = approved) {
  for (const name of names) {
    if (!approved.includes(name)) throw new Error(`Unapproved source: ${name}`);
    const boundary = '(?=[/\\s"\'<>?#)]|$)';
    const alias = name.replace(/-api$/, '');
    text = text.replace(new RegExp(`https?://chirag127\\.github\\.io/${alias}${boundary}`, 'g'), `https://chirag127.github.io/apis/${name}`);
    text = text.replace(new RegExp(`https?://chirag127\\.github\\.io/${name}${boundary}`, 'g'), `https://chirag127.github.io/apis/${name}`);
    text = text.replace(new RegExp(`https://raw\\.githubusercontent\\.com/chirag127/${name}/(?:main|master)/`, 'g'), `https://chirag127.github.io/apis/${name}/`);
    text = text.replace(new RegExp(`https://github\\.com/chirag127/${name}/(blob|tree)/(?:main|master)/`, 'g'), `https://github.com/chirag127/apis/$1/main/datasets/${name}/`);
    text = text.replace(new RegExp(`https://github\\.com/chirag127/${name}${boundary}`, 'g'), `https://github.com/chirag127/apis/tree/main/datasets/${name}`);
  }
  return text;
}

function filesAt(root, prefix = '') {
  const files = [];
  for (const entry of fs.readdirSync(join(root, prefix), { withFileTypes: true })) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) throw new Error(`Symlink cannot be published: ${path}`);
    if (entry.isDirectory()) files.push(...filesAt(root, path));
    else if (entry.isFile()) files.push(path);
  }
  return files.sort();
}

function publicFile(path) {
  if (path.split('/').some(part => part.startsWith('.') || part === 'node_modules' || part === '__pycache__')) return false;
  const top = path.split('/')[0];
  if (path.includes('/')) return ['api', 'data', 'schemas', 'website', 'docs', 'assets', 'typings'].includes(top);
  return /\.(json|html|css|js|yaml|yml|png|svg|ico|txt|d\.ts)$/i.test(path) && !/^(package|package-lock|tsconfig|jsconfig)\./.test(path) || /^(LICENSE|NOTICE|COPYING|README\.md|SECURITY\.md)$/i.test(path);
}

function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (error) { throw new Error(`Invalid JSON ${file}: ${error.message}`); }
}

function primaryEndpoint(source, paths) {
  const candidates = ['api/v1/data.json', 'api/v1/states.json', 'api/v1/entities.json', 'api/v1/subdivisions.json', 'api/v1/countries.json', 'api/v1/ports.json', 'api/v1/tlds.json', 'api/v1/elements.json', 'api/v1/compounds.json', 'api/v1/quotes.json', 'api/v1/emoji.json', 'data/airports.json', 'data.json', 'api/v1/index.json', 'data/index.json'];
  const available = candidates.filter(path => paths.includes(path)).map(path => ({ path, ...inspectData(readJSON(join(source, path))) }));
  if (!available.length) throw new Error(`No primary JSON endpoint: ${source}`);
  const ranked = available.filter(item => item.status === 'live').sort((a, b) => b.records - a.records);
  return ranked[0] || available[0];
}

function publicHTML(text, name, endpoint, measured) {
  text = rewriteLinks(text);
  // Some source labels were emitted as URLs; retain attribution without dead navigation.
  text = text.replace(/<a\b[^>]*\bhref=(["'])Reference compilation\1[^>]*>([\s\S]*?)<\/a>/gi, '$2');
  if (name === 'india-states-api') text = text.replaceAll('/api/v1/search.json?q={query}', '/api/v1/search-index.json');
  // Legacy pages use API-root-relative fetches even when stored in docs/ or website/.
  text = text.replace(/(["'`])\/(api|schemas|data)\//g, `$1/apis/${name}/$2/`);
  text = text.replace(/<base\b[^>]*>/gi, '').replace(/<head([^>]*)>/i, `<head$1><base href="/apis/${name}/">`);
  // Long endpoint names must scroll inside their table on narrow screens.
  text = text.replace(/<\/head>/i, '<style>table{display:block;max-width:100%;overflow-x:auto}pre{max-width:100%;overflow-x:auto}.migration-notice{overflow-wrap:anywhere}</style></head>');
  const notice = `<aside class="migration-notice" style="padding:1rem;border:1px solid var(--border,currentColor);margin:1rem 0"><a href="/apis/">All APIs</a><p>${measured.status === 'stub' ? 'This snapshot contains scaffold records, not a complete dataset.' : measured.status === 'empty' ? 'This snapshot contains no records.' : 'Preserved source snapshot. Counts and dates in original documentation may be historical.'} <a href="/apis/${name}/${endpoint}">Read committed JSON</a>.</p></aside>`;
  text = text.replace(/<body([^>]*)>/i, `<body$1>${notice}`);
  if (!contacts.every(([url]) => text.includes(url))) {
    text = /<\/body>/i.test(text) ? text.replace(/<\/body>/i, `${footer}</body>`) : text + footer;
  }
  return text;
}

export function buildSite({ root = rootDirectory, expectedNames = approved } = {}) {
  root = resolve(root);
  const manifest = readJSON(join(root, 'migration/sources.json'));
  const sources = manifest.sources;
  if (manifest.owner !== 'chirag127' || manifest.destination !== 'apis' || !Array.isArray(sources) || sources.length !== expectedNames.length || new Set(sources.map(source => source.name)).size !== expectedNames.length || sources.some(source => !expectedNames.includes(source.name) || !approved.includes(source.name))) throw new Error('Invalid source manifest');
  const next = join(root, '_site.next');
  const site = join(root, '_site');
  const previous = join(root, '_site.previous');
  if (fs.existsSync(next) || fs.existsSync(previous)) throw new Error('Interrupted build exists; reconcile _site.next/_site.previous first');
  const catalogue = [];
  const outputs = [];
  const put = (path, bytes) => {
    const target = join(next, path);
    fs.mkdirSync(dirname(target), { recursive: true });
    fs.writeFileSync(target, bytes);
  };
  fs.mkdirSync(next);
  try {
    for (const { name } of sources) {
      const source = join(root, 'datasets', name);
      const paths = filesAt(source).filter(publicFile);
      for (const path of paths) if (path.endsWith('.json')) readJSON(join(source, path));
      const primary = primaryEndpoint(source, paths);
      const titleFile = paths.includes('openapi.json') ? readJSON(join(source, 'openapi.json')).info : null;
      const title = titleFile?.title || name.replace(/-api$/, '').replaceAll('-', ' ');
      const entry = { name, desc: name === 'nav-units-api' ? 'Non-SI units of measurement' : title, endpoint: primary.path, status: 'unknown', auto: false };
      catalogue.push(entry);
      for (const path of paths) {
        let bytes = fs.readFileSync(join(source, path));
        if (/\.(html|css|js|yaml|yml|md)$/i.test(path) || /^openapi\.json$/i.test(path)) {
          let text = rewriteLinks(bytes.toString('utf8'));
          if (path.endsWith('.html')) text = publicHTML(text, name, primary.path, primary);
          bytes = Buffer.from(text);
        }
        put(`${name}/${path}`, bytes);
      }
      for (const [filename, bytes] of Object.entries(adaptContracts(source, paths, name))) put(`${name}/${filename}`, bytes);
      // Match the original deploy recipe while retaining original root/docs/website paths.
      const deployed = paths.includes('website/index.html') ? 'website/index.html' : 'index.html';
      if (paths.includes(deployed)) {
        if (deployed.startsWith('website/')) for (const path of paths.filter(path => path.startsWith('website/') && path !== deployed)) {
          const alias = path.slice('website/'.length);
          if (!paths.includes(alias)) put(`${name}/${alias}`, fs.readFileSync(join(next, name, path)));
        }
        put(`${name}/index.html`, fs.readFileSync(join(next, name, deployed)));
      } else {
        put(`${name}/index.html`, publicHTML(`<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width"><title>${escape(title)}</title></head><body><h1>${escape(title)}</h1></body></html>`, name, primary.path, primary));
      }
    }
    put('index.html', fs.readFileSync(join(root, 'index.html')));
    put('scripts/catalogue-client.js', fs.readFileSync(join(root, 'scripts/catalogue-client.js')));
    if (fs.existsSync(join(root, 'app.js'))) put('app.js', fs.readFileSync(join(root, 'app.js')));
    put('catalogue.json', JSON.stringify(catalogue, null, 2) + '\n');
    put('catalogue.js', `window.__CATALOGUE__ = ${JSON.stringify(catalogue)};\n`);
    put('.nojekyll', '');
    for (const path of filesAt(next)) {
      const bytes = fs.readFileSync(join(next, path));
      outputs.push({ path, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
    }
    put('build-manifest.json', JSON.stringify({ sources: sources.length, files: outputs }, null, 2) + '\n');
    if (fs.existsSync(site)) fs.renameSync(site, previous);
    try { fs.renameSync(next, site); }
    catch (error) { if (fs.existsSync(previous)) fs.renameSync(previous, site); throw error; }
    fs.rmSync(previous, { recursive: true, force: true });
    return { sources: sources.length, files: outputs.length, bytes: outputs.reduce((sum, file) => sum + file.bytes, 0), output: relative(root, site) };
  } catch (error) {
    fs.rmSync(next, { recursive: true, force: true });
    throw error;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(buildSite()));
