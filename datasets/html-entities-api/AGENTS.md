This repo is a free static-JSON API for the named character references of the WHATWG HTML Standard
(2,231 entries, 106 legacy no-semicolon forms). `scripts/build.js` fetches
https://html.spec.whatwg.org/entities.json and regenerates `data/entities.json` plus the
`api/v1/` lookup tree; the build is deterministic (byte-identical output for unchanged source), and
`.github/workflows/update.yml` runs it weekly and commits only when the data changed. GitHub Pages
serves the result at https://chirag127.github.io/html-entities-api/. Never edit the JSON under
`data/` or `api/v1/` by hand — regenerate with the script.
