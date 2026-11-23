# Periodic Table

All 118 elements with atomic number and mass, category, electron configuration, electronegativity, melting and boiling points, and discovery attribution.

No authentication. No server. No rate limit. The committed JSON is the database.

    curl https://chirag127.github.io/periodic-table-api/api/v1/data.json

## What you get

| Field | Example | Notes |
| --- | --- | --- |
| `atomicNumber` / `symbol` / `name` | `26` / `"Fe"` / `"Iron"` | Symbol is also the record `id`. Elements 1–118, no gaps. |
| `atomicMass` | `55.8452` | Standard atomic weight in u. |
| `category` | `"transition metal"` | Category string as published upstream; the 8 elements without a settled category keep upstream's hedged forms such as `"unknown, predicted to be noble gas"`. |
| `electronConfiguration` | `"1s2 2s2 2p6 3s2 3p6 4s2 3d6"` | Full configuration; `electronConfigurationSemantic` gives `"[Ar] 3d6 4s2"`. |
| `electronegativity` | `1.83` | Pauling scale. `null` for 18 elements that have no agreed value. |
| `meltingPoint` / `boilingPoint` | `1811` / `3134` | Kelvin. `null` for 8 and 14 elements respectively. |
| `discoveredBy` / `yearDiscovered` | `"5000 BC"` / `"Ancient"` | Upstream verbatim — see the honesty note under Limits. |

## Endpoints

| Endpoint | Description | Size |
| --- | --- | --- |
| `/api/v1/data.json` | All 118 elements, in atomic-number order | 75,311 bytes |
| `/api/v1/individual/{symbol}.json` | One element, e.g. `/api/v1/individual/Fe.json` | 480–671 bytes each |
| `/api/v1/search-index.json` | The same records keyed by symbol, for a single-fetch lookup | 82,687 bytes |
| `/api/v1/meta.json` | Record count, source, retrieval time | 613 bytes |

## Data source and accuracy

Element properties come from [Bowserinator/Periodic-Table-JSON](https://github.com/Bowserinator/Periodic-Table-JSON), which republishes
IUPAC element names and standard atomic weights and NIST ionisation and electronegativity values. `yearDiscovered` comes from the
[PubChem periodic table endpoint](https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/JSON), matched on atomic number, because the
first source carries no year. Both fetched on 2026-11-10.

The upstream file also ships element 119 (ununennium, no confirmed IUPAC name and no measured properties). It is excluded, so the file
stops at 118 and every atomic number 1–118 appears exactly once — the scraper fails the build if either is untrue.

## Limits, stated plainly

- The discovery fields are upstream verbatim and inconsistent by nature. `discoveredBy` holds a person for most elements but an era or a
  date for the old ones (`"5000 BC"` for iron, `"Ancient Egypt"` for one), and aluminium has `null`. `yearDiscovered` is a string: `"Ancient"`
  or a year like `"1766"`. Do not parse it as a number without handling the word.
- 18 elements have no electronegativity, 8 no melting point and 14 no boiling point. Those are `null`, not zero and not guessed.
- Predicted values are not flagged. Oganesson's `density` and `meltingPoint` come from prediction, and eight elements
  (109, 110, 111, 113, 115, 116, 117, 118) carry an "unknown, probably…" or "unknown, predicted…" category rather than pretending certainty.
- No isotopes, no electron affinity, no ionisation energy series, no crystal structure. This is one row per element, not a chemistry database.

## Contract

[openapi.yaml](./openapi.yaml) describes all four endpoints. The record type:

```ts
type Element = {
  id: string;            // "Fe"
  atomicNumber: number;  // 26
  symbol: string;        // "Fe"
  name: string;          // "Iron"
  atomicMass: number;    // 55.8452
  category: string;      // "transition metal"
  block: string;         // "d"
  group: number;         // 8
  period: number;        // 4
  phase: string;         // "Solid"
  density: number | null;         // 7.874 g/cm3
  meltingPoint: number | null;    // kelvin
  boilingPoint: number | null;    // kelvin
  electronConfiguration: string;
  electronConfigurationSemantic: string;
  electronegativity: number | null;
  shells: number[];      // [2, 8, 14, 2]
  cpkHex: string | null; // "e06633"
  discoveredBy: string | null;
  yearDiscovered: string | null;
};
```

## Licence

Code: MIT — see [LICENSE](./LICENSE). Data: the values are facts published by IUPAC and NIST, reproduced through the two sources above.
The upstream Periodic-Table-JSON repository carries no licence file, so attribution rather than a licence claim is what you get here;
check it before redistributing the file wholesale.

---

## About the author

**Chirag Singhal** — building free, open APIs and tools. Everything here is free, no
authentication, no rate limits, no telemetry. If it saves you time and you want to work
together, that is exactly what this is for.

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
