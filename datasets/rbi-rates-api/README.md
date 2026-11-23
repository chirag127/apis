# RBI Policy Rates

> Current and historical RBI repo rate, reverse repo, CRR, SLR, and SDF

**Category:** finance · **Data:** rbi.org.in · **License:** CC-BY-4.0 · **Updates:** monthly

## API Endpoints

All endpoints are served as static JSON from GitHub Pages.

| Endpoint | Format |
|----------|--------|
| `/data/rates/current.json` | JSON |
| `/data/rates/history.json` | JSON |

## Usage

```bash
curl https://chirag127.github.io/rbi-rates/data.json
```

```javascript
const res = await fetch('https://chirag127.github.io/rbi-rates/data.json');
const data = await res.json();
```

## Data

- Source: rbi.org.in
- License: CC-BY-4.0
- Last updated: `2026-08-25T03:04:42.617Z`

See `data/` for raw JSON and `data/schema.json` for the schema.

## Documentation

Visit the [interactive docs](https://chirag127.github.io/rbi-rates/) for the browsable API reference.

## Contributing

Issues and PRs welcome. Ensure `data/schema.json` validates all data files.

## License

CC-BY-4.0
