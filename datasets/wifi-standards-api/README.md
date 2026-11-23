# Wi-Fi Standards

> 802.11 standards from legacy to Wi-Fi 7 with speeds and frequencies

**Category:** tech · **Data:** IEEE public · **License:** CC0-1.0 · **Updates:** manual

## API Endpoints

All endpoints are served as static JSON from GitHub Pages.

| Endpoint | Format |
|----------|--------|
| `/data/wifi.json` | JSON |

## Usage

```bash
curl https://chirag127.github.io/wifi-standards/data.json
```

```javascript
const res = await fetch('https://chirag127.github.io/wifi-standards/data.json');
const data = await res.json();
```

## Data

- Source: IEEE public
- License: CC0-1.0
- Last updated: `2026-08-25T03:10:22.672Z`

See `data/` for raw JSON and `data/schema.json` for the schema.

## Documentation

Visit the [interactive docs](https://chirag127.github.io/wifi-standards/) for the browsable API reference.

## Contributing

Issues and PRs welcome. Ensure `data/schema.json` validates all data files.

## License

CC0-1.0
