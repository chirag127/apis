# AGENTS.md — apis (the catalogue)

One-page GitHub Pages site that lists every free static JSON API in the portfolio and live-tests
each endpoint in the browser.

## How it works

`catalogue.js` is generated from `C:/ws/tmp/api-scan.json` (a mechanical scan of every API repo:
name, description, whether data exists). The page then fetches
`https://chirag127.github.io/<repo>/api/v1/data.json` for each entry and reports the real record
count. All under `chirag127.github.io/*` so fetch is same-origin and needs no CORS.

## Rules

- The live test is the source of truth for "has data". Never hardcode a status badge.
- Adding an API to the portfolio means adding it to `catalogue.js` and regenerating.
- The About/Hire block in the footer is mandatory (see the collection AGENTS.md `<!-- hire-me -->`).
- No build step. index.html + catalogue.js is the whole site.
