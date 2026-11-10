# World Currencies

Every currency in the ISO 4217 list one — 178 codes with alpha-3 code, numeric code, minor unit and the 277 territories that use them.

No authentication. No server. No rate limit. The committed JSON is the database.

    curl https://chirag127.github.io/currencies-api/api/v1/data.json

## What you get

| Field | Example | Notes |
| --- | --- | --- |
| `alpha3` | `"USD"` | ISO 4217 alphabetic code, also used as `id`. |
| `numeric` | `"840"` | ISO 4217 numeric code as a string, zero padded: the Albanian lek is `"008"`. |
| `name` | `"US Dollar"` | Currency name as registered, not a translated or shortened form. |
| `minorUnits` | `2` | Decimal digits in the minor unit. 13 codes carry `null` because the registry writes "N.A." — the precious metals, `XDR`, `XXX` and the testing codes. |
| `countries` | `["AMERICAN SAMOA", "ECUADOR", …]` | Territories the registry lists against the code, uppercase and article-first (`"NETHERLANDS (THE)"`). |

## Endpoints

| Endpoint | Description | Size |
| --- | --- | --- |
| `/api/v1/data.json` | All 178 currencies, in alpha-3 order | 31,913 bytes |
| `/api/v1/individual/{code}.json` | One currency, e.g. `/api/v1/individual/USD.json` | 126–791 bytes each |
| `/api/v1/search-index.json` | The same records keyed by code, for a single-fetch lookup | 36,933 bytes |
| `/api/v1/meta.json` | Record count, source, retrieval time | 578 bytes |

## Data source and accuracy

Source: ISO 4217 "list one — currency, fund and precious metal codes", published by SIX Group as the ISO 4217 registration authority at
`https://www.six-group.com/dam/download/financial-information/data-center/iso-currrency/lists/list-one.xml`.
The published list fetched on 2026-11-10 is dated 2026-09-17 and holds 280 territory rows, which collapse to 178 unique currencies.

Three rows name a territory with no currency — Antarctica, Palestine and South Georgia — and are skipped rather than invented.

The Debian `iso-codes` `iso_4217.json` was checked as a second source: it matches the alpha-3 and numeric codes but carries no minor unit,
which is why this dataset is built from the SIX XML instead.

`scraper/index.cjs` regenerates everything from that XML, so a currency added by ISO lands on the next run.

## Limits, stated plainly

- 178 codes is list one only. ISO 4217 list two (historic currencies) and list three (fund codes) are not included.
- No symbols, no exchange rates, no country ISO 3166 alpha-2 codes. ISO 4217 does not carry symbols, and rates change hourly, which this file does not attempt.
- `countries` includes registry placeholder rows such as `ZZ08_Gold` for the precious-metal entries, and 162 of the 178 codes are listed against a single territory.
- Names are English only, exactly as registered, so `"Lek"` will not tell you it is Albanian unless you follow `countries`.

## Contract

[openapi.yaml](./openapi.yaml) describes all four endpoints. The record type:

```ts
type Currency = {
  id: string;            // "USD"
  alpha3: string;        // "USD"
  numeric: string;       // "840"
  name: string;          // "US Dollar"
  minorUnits: number | null;  // 2
  countries: string[];   // ["AMERICAN SAMOA", "ECUADOR", ...]
};
```

## Licence

Code: MIT — see [LICENSE](./LICENSE). Data: reproduced from the ISO 4217 list one published by SIX Group; ISO 4217 itself is a paid ISO
standard, so treat the list publication as the source of record and check ISO's terms before redistributing commercially.

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
