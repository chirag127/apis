# Software Licenses

> Open-source licenses with terms, compatibility, and SPDX identifiers

**Category:** dev-ref · **Data:** SPDX / public docs · **License:** CC0-1.0 · **Updates:** yearly

## API Endpoints

All endpoints are served as static JSON from GitHub Pages.

| Endpoint | Format |
|----------|--------|
| `/data/licenses.json` | JSON |

## Usage

```bash
curl https://chirag127.github.io/software-licenses/data.json
```

```javascript
const res = await fetch('https://chirag127.github.io/software-licenses/data.json');
const data = await res.json();
```

## Data

- Source: SPDX / public docs
- License: CC0-1.0
- Last updated: `2026-08-25T03:10:21.797Z`

See `data/` for raw JSON and `data/schema.json` for the schema.

## Documentation

Visit the [interactive docs](https://chirag127.github.io/software-licenses/) for the browsable API reference.

## Contributing

Issues and PRs welcome. Ensure `data/schema.json` validates all data files.

## License

CC0-1.0
