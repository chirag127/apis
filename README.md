# Free JSON APIs — catalogue

A searchable, live-tested catalogue of every free static JSON API built by
[Chirag Singhal](https://github.com/chirag127).

No authentication. No server. No rate limit. No telemetry. The committed JSON is the database,
GitHub Pages serves it, and GitHub Actions keeps it fresh where the data changes.

**Live:** https://chirag127.github.io/apis/

## What this is

Every API in the catalogue is a separate repository with an OpenAPI contract and JSON Schema.
This page fetches each one live in your browser and shows the real record count — so you can see
at a glance which APIs have real data and which are still scaffolds. No fake status badges.

## Using an API

```bash
curl https://chirag127.github.io/india-states-api/api/v1/states.json
```

```javascript
const res = await fetch("https://chirag127.github.io/india-states-api/api/v1/states.json");
const states = await res.json();
```

Every API follows the same shape: `https://chirag127.github.io/<repo>/api/v1/data.json` for the
whole dataset, plus per-record endpoints where it makes sense.

## Licence

MIT.

---

## About the author

**Chirag Singhal** — building free, open APIs and tools. Everything here is free: no
authentication, no rate limits, no telemetry, no upsell. The point is to give developers data
that should never have needed a credit card.

Each API is a repository with an OpenAPI contract, a JSON Schema, and where the data changes, a
GitHub Actions workflow that refreshes it. If one of these saves you an afternoon and you want to
work together, that is exactly what this page is for.

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
