# Unicode Blocks

All 353 Unicode blocks in Unicode 18.0.0 — 316,784 code points, from Basic Latin at U+0000..U+007F to Supplementary Private Use Area-B at U+100000..U+10FFFF — with start, end and block size.

No authentication. No server. No rate limit. The committed JSON is the database.

    curl https://chirag127.github.io/unicode-blocks-api/api/v1/data.json

## What you get

| Field | Example | Notes |
| --- | --- | --- |
| `name` | `"Basic Latin"` | Exactly as Blocks.txt writes it, hyphens and all. |
| `id` | `"basic-latin"` | Lower-case slug of the name. URL-safe: no spaces, no `&`. |
| `start` / `end` | `"U+0000"` / `"U+007F"` | Hexadecimal, as published. |
| `startCode` / `endCode` | `0` / `127` | The same values as integers, for arithmetic and range checks. |
| `size` | `128` | `endCode - startCode + 1`. |
| `range` | `"U+0000..U+007F"` | The line as Blocks.txt writes it, ready to print. |

## Endpoints

| Endpoint | Description | Size |
| --- | --- | --- |
| `/api/v1/data.json` | All 353 records, in code-point order | 73,850 bytes |
| `/api/v1/individual/{id}.json` | One record, e.g. `/api/v1/individual/basic-latin.json` | 158–254 bytes each |
| `/api/v1/search-index.json` | The same records keyed by `id`, for a single-fetch lookup | 87,936 bytes |
| `/api/v1/meta.json` | Record count, source, retrieval time | 517 bytes |

## Data source and accuracy

Unicode Character Database, `https://www.unicode.org/Public/UCD/latest/ucd/Blocks.txt`, fetched 2026-11-10. The file's own header identifies it as Blocks-18.0.0.txt, dated 2026-07-08. Every block line is parsed; none are skipped and none are added.

`id` is derived from `name` by lower-casing and replacing runs of non-alphanumerics with a hyphen, so it is stable for a given block name. `size` is arithmetic on the published range, not a separate source.

Licence: © Unicode, Inc. Blocks.txt is distributed under the [Unicode License v3](https://www.unicode.org/copyright.html), the terms the file header points at.

## Limits, stated plainly

- A block is an organisational range, not a script. The Arabic block is not the Arabic script — Scripts.txt is a different file and is not included.
- Not every code point inside a block is assigned. Many blocks have unassigned holes; that detail lives in UnicodeData.txt.
- No character names, no properties, no glyphs, no counts of assigned characters.
- 353 blocks cover 316,784 of the 1,114,112 code points in the code space. Everything else is `No_Block` and appears nowhere in this file.
- This is the Unicode 18.0.0 snapshot. Blocks are added in most Unicode releases, so the count will change.

## Contract

[openapi.yaml](./openapi.yaml) describes all four endpoints. The record type:

```ts
type UnicodeBlock = {
  id: string;        // "basic-latin"
  name: string;      // "Basic Latin"
  start: string;     // "U+0000"
  end: string;       // "U+007F"
  startCode: number; // 0
  endCode: number;   // 127
  size: number;      // 128
  range: string;     // "U+0000..U+007F"
};
```

## Licence

Code: MIT — see [LICENSE](./LICENSE). Data: © Unicode, Inc., distributed under the [Unicode License v3](https://www.unicode.org/copyright.html).

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
