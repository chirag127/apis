# Software Licences

Every licence on the SPDX License List — 740 identifiers from `0BSD` to `ZPL-2.1`, 32 of them retired — with the OSI-approved and FSF-libre flags, the canonical reference URL and the URL of the full licence text.

No authentication. No server. No rate limit. The committed JSON is the database.

    curl https://chirag127.github.io/software-licenses-api/api/v1/data.json

## What you get

| Field | Example | Notes |
| --- | --- | --- |
| `id` | `"Apache-2.0"` | The SPDX identifier. Stable, and the key every other tool quotes. |
| `name` | `"Apache License 2.0"` | Full name exactly as the SPDX list writes it. |
| `deprecated` | `false` | `true` for the 32 retired identifiers (`AGPL-1.0`, `GPL-2.0`, `Nunit`, …). They still resolve. |
| `osiApproved` | `true` | 154 of 740. |
| `fsfLibre` | `false` | 127 of 740. SPDX omits `isFsfLibre` unless it is true, so `false` means *not recorded as FSF-libre*. |
| `reference` | `"https://spdx.org/licenses/Apache-2.0.html"` | The canonical SPDX page. |
| `textUrl` | `"…/text/Apache-2.0.txt"` | Plain-text licence. `null` for the 32 retired ids: the current `text/` directory has no file for them, which was checked rather than assumed. |
| `seeAlso` | `["https://www.apache.org/licenses/LICENSE-2.0"]` | Upstream URLs SPDX records. |

## Endpoints

| Endpoint | Description | Size |
| --- | --- | --- |
| `/api/v1/data.json` | All 740 records, in identifier order | 390,763 bytes |
| `/api/v1/individual/{id}.json` | One record, e.g. `/api/v1/individual/MIT.json` | 342–1,048 bytes each |
| `/api/v1/search-index.json` | The same records keyed by `id`, for a single-fetch lookup | 423,430 bytes |
| `/api/v1/meta.json` | Record count, source, retrieval time | 580 bytes |

## Data source and accuracy

The list is the SPDX License List JSON, `https://raw.githubusercontent.com/spdx/license-list-data/main/json/licenses.json`, list version `8791eda` released 2026-10-28, fetched 2026-11-10. Every field is copied; nothing is inferred.

`textUrl` is built only for identifiers whose file actually appears in the repository's `text/` directory — 708 of 740. The 32 retired identifiers (`AGPL-1.0`, `BSD-2-Clause-FreeBSD`, `GPL-2.0`, …) have no current text file, so the field is `null` instead of a URL that would 404.

The SPDX License List is maintained by the SPDX Project (Linux Foundation). The data repository carries no licence file of its own; each licence's text at `textUrl` is under that licence's own terms.

## Limits, stated plainly

- No compatibility matrix and no advice. The list tells you an identifier exists, not what the licence permits, requires or forbids.
- `fsfLibre: false` is not a statement that a licence is non-free. SPDX records the flag only when it is true.
- The 32 deprecated identifiers have `textUrl: null`. Their text lives in older releases of the SPDX list, not the current one.
- Licence *exceptions* (`Classpath-exception-2.0`, `LLVM-exception`, …) are a separate SPDX list and are not here.

## Contract

[openapi.yaml](./openapi.yaml) describes all four endpoints. The record type:

```ts
type SpdxLicense = {
  id: string;                 // "Apache-2.0"
  name: string;               // "Apache License 2.0"
  deprecated: boolean;
  osiApproved: boolean;
  fsfLibre: boolean;          // false = not recorded by SPDX, not "non-free"
  referenceNumber: number | null;
  reference: string;
  detailsUrl: string;
  textUrl: string | null;     // null for the 32 retired identifiers
  seeAlso: string[];
};
```

## Licence

Code: CC0 1.0 — see [LICENSE](./LICENSE). Data: the SPDX License List, maintained by the SPDX Project; each licence text at `textUrl` remains under that licence's own terms.

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
