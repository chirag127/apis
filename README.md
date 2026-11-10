# HTML Entities API

All 2,231 named character references from the WHATWG HTML Standard, with decimal and hex codepoints, the rendered character, and a legacy flag — served as free static JSON.

No authentication. No server. No rate limit. The committed JSON is the database. Data is
refreshed automatically by GitHub Actions from the WHATWG HTML Standard.

    curl https://chirag127.github.io/html-entities-api/api/v1/entities.json

## What you get

| Field | Example | Notes |
|---|---|---|
| `name` | `"&amp;"` | The reference exactly as written in the spec, including `&` and the trailing `;` when present |
| `codepoints` | `[38]` | Decimal Unicode codepoints, one per character — multi-codepoint for sequences like `&NotEqualTilde;` → `[8770, 824]` |
| `codepointsHex` | `["0x0026"]` | The same codepoints as 4-digit uppercase hex |
| `character` | `"&"` | The rendered character or sequence |
| `legacy` | `false` | `true` when the reference has no trailing semicolon (tolerated in HTML attributes, not valid in XHTML/XML) |

## Endpoints

| Endpoint | Description | Size |
|---|---|---|
| `GET /api/v1/entities.json` | All 2,231 entities | ~410 KB |
| `GET /api/v1/entities/index.json` | Name → `{codepoints, legacy}` map for all 2,231 references | ~90 KB |
| `GET /api/v1/characters/{codepoint}.json` | One character per file, keyed by decimal codepoint — e.g. `GET /api/v1/characters/38.json` returns `&`, with every entity name that maps to it (4 here: `&AMP`, `&AMP;`, `&amp`, `&amp;`) | 1,511 files |
| `GET /data/entities.json` | Same data as above (source of truth for the repo) | ~410 KB |

There is no per-entity file: `&AMP;` and `&amp;` would collide on case-insensitive filesystems, so
lookups are served through the index or the per-character files.

## How it stays fresh

The `update.yml` workflow runs weekly, fetches https://html.spec.whatwg.org/entities.json,
regenerates the JSON and commits only when the data actually changed. GitHub Pages serves the
result. No server to run.

## Data source and accuracy

The [WHATWG HTML Standard](https://html.spec.whatwg.org/multipage/syntax.html#character-references)
publishes `entities.json` as the authoritative list of every named character reference browsers
must support. It covers both the legacy (no-semicolon) and full (semicolon) forms, 106 and 2,125
of them respectively. It does not include numeric references (`&#38;`, `&#x26;`) — those are
computable from the codepoint itself and deliberately not listed.

## Limits, stated plainly

- The full dataset is ~410 KB — fine for a one-off fetch, but use the per-character endpoints if you need one lookup at a time.
- No per-entity file: case-insensitive filesystems make `&AMP;.json` and `&amp;.json` collide, so lookups go through the index or the character files.
- The entity list is extremely stable — the weekly workflow may go many runs without a commit.
- The data is generated from the spec at build time; the commit history is the only change log.

## Licence

Data: the WHATWG HTML Standard entity list (WHATWG), reproduced as-is. Code: MIT.

---

## About the author

**Chirag Singhal** — building free, open APIs and tools. Everything here is free, no
authentication, no rate limits, no telemetry. If it saves you time and you want to work
together, that is exactly what this is for.

- **Email — the fastest way to reach me:** [chirag@oriz.in](mailto:chirag@oriz.in)
- **GitHub:** [github.com/chirag127](https://github.com/chirag127)
- **LinkedIn:** [linkedin.com/in/chirag127](https://www.linkedin.com/in/chirag127/)
- **X:** [x.com/singhal127](https://x.com/singhal127)
- **YouTube:** [@ChiragSinghal127](https://www.youtube.com/@ChiragSinghal127)
- **Instagram:** [chiragsinghal127](https://www.instagram.com/chiragsinghal127/)
- **Reddit:** [Far_Macaron_9910](https://www.reddit.com/user/Far_Macaron_9910/)
- **Buy me a coffee:** [buymeacoffee.com/chirag127](https://buymeacoffee.com/chirag127)

**Hiring?** I build developer tooling, data APIs and web platforms. Email me — I reply to
everything.
