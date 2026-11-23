# Free JSON APIs — one collection

A searchable collection of 70 static JSON APIs built by
[Chirag Singhal](https://github.com/chirag127).

No API key. Committed JSON is served by GitHub Pages. Browser checks distinguish
records, scaffolds, empty responses and fetch failures; they do not certify accuracy or freshness.

**Live:** https://chirag127.github.io/apis/

## What this is

Source snapshots, licences, contracts and generators live in `datasets/<source>/`.
`migration/sources.json` records original commits and file hashes. Original Git histories
are retained on `archive/<source>/main` branches; GitHub metadata is retained in
`migration/github-metadata.zip`. Existing scaffold data is preserved and labelled.

## Using an API

```bash
curl -L https://chirag127.github.io/apis/india-states-api/api/v1/states.json
```

```javascript
const res = await fetch("https://chirag127.github.io/apis/india-states-api/api/v1/states.json");
const states = await res.json();
```

Endpoints live under `https://chirag127.github.io/apis/<source>/`. File names vary;
use the live catalogue or generated `openapi.json`/`openapi.yaml` for each source.
The GitHub Pages hostname redirects to `https://gh.oriz.in/apis/`.
Old standalone repository URLs do not redirect after repository deletion.

## Build and verify

Use Node 22+ and Python 3.12+:

```sh
python -m pip install -r requirements-build.txt
npm test
npm run build
```

Deploy `_site/` only. Build preserves dataset bytes and adapts documentation and contracts
to consolidated paths. Static hosting cannot implement query-driven search; unsupported
contract operations are recorded under `x-migration` in generated contracts.

Root `Refresh datasets` workflow runs the 11 supported fetchers on their existing cadence.
Other 59 sources explicitly report unsupported refresh; they remain readable snapshots.
Failed or invalid refreshes preserve existing data. Inspect recipes without fetching:

```sh
node scripts/refresh.mjs --source all --plan
node scripts/refresh.mjs --source all --validate-only
```

## Licence

Collection code: MIT. Each dataset retains its original licence and attribution.

---

## About the author

**Chirag Singhal** — building free, open APIs and tools.

Source preservation and serving verification are recorded in the
[canonical portfolio notes](../../../../../docs/okf/api-portfolio/index.md).

- **Email — the fastest way to reach me:** [chirag@oriz.in](mailto:chirag@oriz.in)
- **GitHub:** [github.com/chirag127](https://github.com/chirag127)
- **LinkedIn:** [linkedin.com/in/chirag127](https://www.linkedin.com/in/chirag127/)
- **X:** [x.com/singhal127](https://x.com/singhal127)
- **YouTube:** [@ChiragSinghal127](https://www.youtube.com/@ChiragSinghal127)
- **Instagram:** [chiragsinghal127](https://www.instagram.com/chiragsinghal127/)
- **Reddit:** [Far_Macaron_9910](https://www.reddit.com/user/Far_Macaron_9910/)
- **Buy me a coffee:** [buymeacoffee.com/chirag127](https://buymeacoffee.com/chirag127)

I build developer tooling, data APIs and web platforms. Email me to discuss working together.
