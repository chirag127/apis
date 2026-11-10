#!/usr/bin/env node
// Regenerates data/ and api/v1/ from the WHATWG HTML Standard entity list.
// No timestamp in the output: every run with unchanged source data must
// produce byte-identical files, or "commit only if changed" never settles.
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const SOURCE_URL = 'https://html.spec.whatwg.org/entities.json';
const ROOT = path.join(__dirname, '..');

// 4-digit uppercase hex keeps 0x0026-style sorting stable and matches the spec's own tables.
const toHex = (cp) => '0x' + cp.toString(16).toUpperCase().padStart(4, '0');

async function main() {
  const res = await fetch(SOURCE_URL);
  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status} ${res.statusText} for ${SOURCE_URL}`);
  }
  const source = await res.json();

  // legacy = named reference without the trailing semicolon; tolerated in
  // attribute values by HTML parsers but not in XHTML/XML.
  const entities = Object.entries(source).map(([name, { codepoints, characters }]) => ({
    name,
    codepoints,
    codepointsHex: codepoints.map(toHex),
    character: characters,
    legacy: !name.endsWith(';'),
  }));

  const index = {};
  for (const e of entities) {
    index[e.name] = { codepoints: e.codepoints, legacy: e.legacy };
  }

  // Per-character files are keyed by the decimal codepoint set, not the entity
  // name: the spec contains case pairs like &AMP; and &amp; that collide when
  // used as filenames on case-insensitive filesystems (macOS/Windows checkouts).
  const byCharacter = new Map();
  for (const e of entities) {
    const key = e.codepoints.join('-');
    if (!byCharacter.has(key)) {
      byCharacter.set(key, {
        codepoints: e.codepoints,
        codepointsHex: e.codepointsHex,
        character: e.character,
        names: [],
      });
    }
    byCharacter.get(key).names.push({ name: e.name, legacy: e.legacy });
  }

  const write = (rel, data) => {
    const file = path.join(ROOT, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  };

  const document = { generatedFrom: SOURCE_URL, count: entities.length, entities };
  write('data/entities.json', document);
  write('api/v1/entities.json', document);
  write('api/v1/entities/index.json', { generatedFrom: SOURCE_URL, count: entities.length, index });
  for (const [key, record] of byCharacter) {
    write(`api/v1/characters/${key}.json`, { generatedFrom: SOURCE_URL, ...record });
  }

  console.log(
    `entities: ${entities.length} written; ` +
    `legacy (no semicolon): ${entities.filter((e) => e.legacy).length}; ` +
    `distinct characters: ${byCharacter.size}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
