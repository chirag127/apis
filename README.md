# USB Standards

> USB 2.0/3.x/4 with speeds, connector types, and power delivery

**Category:** tech · **Data:** USB-IF public · **License:** CC0-1.0 · **Updates:** manual

## API Endpoints

All endpoints are served as static JSON from GitHub Pages.

| Endpoint | Format |
|----------|--------|
| `/data/usb.json` | JSON |

## Usage

```bash
curl https://chirag127.github.io/usb-standards/data.json
```

```javascript
const res = await fetch('https://chirag127.github.io/usb-standards/data.json');
const data = await res.json();
```

## Data

- Source: USB-IF public
- License: CC0-1.0
- Last updated: `2026-08-25T03:10:22.655Z`

See `data/` for raw JSON and `data/schema.json` for the schema.

## Documentation

Visit the [interactive docs](https://chirag127.github.io/usb-standards/) for the browsable API reference.

## Contributing

Issues and PRs welcome. Ensure `data/schema.json` validates all data files.

## License

CC0-1.0
