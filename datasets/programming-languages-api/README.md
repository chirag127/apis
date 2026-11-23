# Programming Languages

> Major programming languages with paradigms, typing, versions, and extensions

**Category:** dev-ref · **Data:** Public data · **License:** CC0-1.0 · **Updates:** quarterly

## API Endpoints

All endpoints are served as static JSON from GitHub Pages.

| Endpoint | Format |
|----------|--------|
| `/data/languages.json` | JSON |
| `/data/languages/{lang}.json` | JSON |

## Usage

```bash
curl https://chirag127.github.io/programming-languages/data.json
```

```javascript
const res = await fetch('https://chirag127.github.io/programming-languages/data.json');
const data = await res.json();
```

## Data

- Source: Public data
- License: CC0-1.0
- Last updated: `2026-08-25T03:10:21.594Z`

See `data/` for raw JSON and `data/schema.json` for the schema.

## Documentation

Visit the [interactive docs](https://chirag127.github.io/programming-languages/) for the browsable API reference.

## Contributing

Issues and PRs welcome. Ensure `data/schema.json` validates all data files.

## License

CC0-1.0
