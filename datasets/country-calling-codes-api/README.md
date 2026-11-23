# Country Calling Codes

254 entries from Google's libphonenumber metadata — 245 countries and territories with an ISO 3166-1 code plus 9 non-geographical codes (+800, +808, +870, +878, +881, +882, +883, +888, +979) — each with its calling code, trunk prefix, international prefix and a valid example number.

No authentication. No server. No rate limit. The committed JSON is the database.

    curl https://chirag127.github.io/country-calling-codes-api/api/v1/data.json

## What you get

| Field | Example | Notes |
| --- | --- | --- |
| `id` | `"DE"` | ISO 3166-1 alpha-2, or `001-800` for a global service so every id stays unique. |
| `iso2` | `"DE"` | Always ISO 3166-1. `"001"` for the nine non-geographical codes. |
| `name` | `"Germany"` | English short name from CLDR. libphonenumber keeps names in comments only, so they are joined in. |
| `callingCode` / `callingCodeRoot` | `"+49"` / `"49"` | With the plus, and digits only. |
| `internationalPrefix` | `"00"` | Dialled before a foreign number. `null` for the nine non-geographical codes, which have no inside-the-country context. |
| `nationalPrefix` | `"0"` | Trunk prefix. Set for 144 of 254; the US and Canada use `1`. |
| `exampleNumber` | `"30123456"` | A valid national number, digits only. `exampleNumberKind` says whether it is a `fixedLine`, `mobile` or other type. |
| `mobileNumberPortableRegion` | `true` | From the metadata attribute of the same name. |

## Endpoints

| Endpoint | Description | Size |
| --- | --- | --- |
| `/api/v1/data.json` | All 254 records, in calling-code order | 100,604 bytes |
| `/api/v1/individual/{id}.json` | One record, e.g. `/api/v1/individual/DE.json` | 339–3,465 bytes each |
| `/api/v1/search-index.json` | The same records keyed by `id`, for a single-fetch lookup | 109,301 bytes |
| `/api/v1/meta.json` | Record count, source, retrieval time | 626 bytes |

## Data source and accuracy

Google libphonenumber `resources/PhoneNumberMetadata.xml`, `https://raw.githubusercontent.com/google/libphonenumber/master/resources/PhoneNumberMetadata.xml`, fetched 2026-11-10; the file's last commit was 2026-11-04. All 254 `<territory>` elements are included — 245 with an ISO 3166-1 code and 9 with the `001` region code, which are published here as `001-<calling code>` so ids stay unique.

The XML declares country codes, prefixes and example numbers but keeps country names in comments, so names are taken from CLDR `en` territory names (`unicode-org/cldr-json`). Every one of the 254 territories resolved a name; none were guessed.

Licences: libphonenumber is Apache 2.0 (© Google). CLDR is distributed under the Unicode License v3.

## Limits, stated plainly

- No number formatting rules, no area-code ranges, no length constraints. libphonenumber's XML carries them; this dataset deliberately does not.
- `exampleNumber` is national and unformatted. `+49 30 123456` is `callingCode` + `exampleNumber`; the spacing in between is a formatting decision made by patterns that are not here.
- `+1` covers 25 entries (the US, Canada and 23 Caribbean territories) and `+7` covers 2. Grouping by calling code alone will merge countries.
- `nationalPrefix: null` means the metadata does not declare one. It does not mean "dial nothing".
- The metadata is a snapshot. Numbering plans change, and libphonenumber is the authority — not this file.

## Contract

[openapi.yaml](./openapi.yaml) describes all four endpoints. The record type:

```ts
type CallingCode = {
  id: string;                  // "DE" | "001-800"
  iso2: string;                // "DE" | "001"
  name: string;                // "Germany"
  callingCode: string;         // "+49"
  callingCodeRoot: string;     // "49"
  internationalPrefix: string | null;
  preferredInternationalPrefix: string | null;
  nationalPrefix: string | null;
  nationalPrefixForParsing: string | null;
  exampleNumber: string | null;
  exampleNumberKind: string | null;  // "fixedLine", "mobile", ...
  mobileNumberPortableRegion: boolean;
};
```

## Licence

Code: MIT — see [LICENSE](./LICENSE). Data: libphonenumber, Apache 2.0, © Google; country names from CLDR, Unicode License v3.

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
