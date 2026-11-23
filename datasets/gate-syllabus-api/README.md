# GATE Syllabus

> GATE exam syllabus across all papers with topic weightage

**Category:** education · **Data:** IIT public notification · **License:** CC-BY-4.0 · **Updates:** yearly

## API Endpoints

All endpoints are served as static JSON from GitHub Pages.

| Endpoint | Format |
|----------|--------|
| `/data/gate.json` | JSON |

## Usage

```bash
curl https://chirag127.github.io/gate-syllabus/data.json
```

```javascript
const res = await fetch('https://chirag127.github.io/gate-syllabus/data.json');
const data = await res.json();
```

## Data

- Source: IIT public notification
- License: CC-BY-4.0
- Last updated: `2026-08-25T03:10:21.915Z`

See `data/` for raw JSON and `data/schema.json` for the schema.

## Documentation

Visit the [interactive docs](https://chirag127.github.io/gate-syllabus/) for the browsable API reference.

## Contributing

Issues and PRs welcome. Ensure `data/schema.json` validates all data files.

## License

CC-BY-4.0
