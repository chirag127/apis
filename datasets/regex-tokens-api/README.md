# Regex Tokens

> Common regex patterns and tokens with descriptions

**Category:** dev-ref · **Data:** Reference compilation · **License:** CC0-1.0 · **Updates:** manual

## API Endpoints

All endpoints are served as static JSON from GitHub Pages.

| Endpoint | Format |
|----------|--------|
| `/data/tokens.json` | JSON |
| `/data/patterns.json` | JSON |

## Usage

```bash
curl https://chirag127.github.io/regex-tokens/data.json
```

```javascript
const res = await fetch('https://chirag127.github.io/regex-tokens/data.json');
const data = await res.json();
```

## Data

- Source: Reference compilation
- License: CC0-1.0
- Last updated: `2026-08-25T03:10:21.814Z`

See `data/` for raw JSON and `data/schema.json` for the schema.

## Documentation

Visit the [interactive docs](https://chirag127.github.io/regex-tokens/) for the browsable API reference.

## Contributing

Issues and PRs welcome. Ensure `data/schema.json` validates all data files.

## License

CC0-1.0
