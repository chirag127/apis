# Famous Quotes

> Public-domain quotes from historical figures

**Category:** general · **Data:** Public domain texts · **License:** CC0-1.0 · **Updates:** quarterly

## API Endpoints

All endpoints are served as static JSON from GitHub Pages.

| Endpoint | Format |
|----------|--------|
| `/data/quotes.json` | JSON |

## Usage

```bash
curl https://chirag127.github.io/quotes/data.json
```

```javascript
const res = await fetch('https://chirag127.github.io/quotes/data.json');
const data = await res.json();
```

## Data

- Source: Public domain texts
- License: CC0-1.0
- Last updated: `2026-08-25T03:10:22.553Z`

See `data/` for raw JSON and `data/schema.json` for the schema.

## Documentation

Visit the [interactive docs](https://chirag127.github.io/quotes/) for the browsable API reference.

## Contributing

Issues and PRs welcome. Ensure `data/schema.json` validates all data files.

## License

CC0-1.0
