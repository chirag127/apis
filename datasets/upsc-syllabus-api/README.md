# UPSC Civil Services Syllabus

> UPSC CSE prelims and mains syllabus with optional subjects

**Category:** education · **Data:** UPSC public notification · **License:** CC-BY-4.0 · **Updates:** yearly

## API Endpoints

All endpoints are served as static JSON from GitHub Pages.

| Endpoint | Format |
|----------|--------|
| `/data/upsc.json` | JSON |

## Usage

```bash
curl https://chirag127.github.io/upsc-syllabus/data.json
```

```javascript
const res = await fetch('https://chirag127.github.io/upsc-syllabus/data.json');
const data = await res.json();
```

## Data

- Source: UPSC public notification
- License: CC-BY-4.0
- Last updated: `2026-08-25T03:10:21.936Z`

See `data/` for raw JSON and `data/schema.json` for the schema.

## Documentation

Visit the [interactive docs](https://chirag127.github.io/upsc-syllabus/) for the browsable API reference.

## Contributing

Issues and PRs welcome. Ensure `data/schema.json` validates all data files.

## License

CC-BY-4.0
