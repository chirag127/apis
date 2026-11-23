# apis

Read [canonical portfolio notes](../../../../../docs/okf/api-portfolio/index.md),
[API policy](../../../../../docs/okf/agent-policies/static-json-apis.md), and
[public-project policy](../../../../../docs/okf/agent-policies/public-project.md).

- `datasets/<source>/` preserves each imported repository, including its licence,
  contracts, generators and original guidance. Never hand-edit generated data.
- `migration/sources.json` records original commits, refs and file hashes. It is an
  immutable import receipt, not a claim that later refreshed bytes remain identical.
- Node 22 or newer; Python 3.12 or newer with `python -m pip install -r requirements-build.txt`.
  Run `npm test` and `npm run build`.
- Build writes `_site/`. Deploy only this output. Source-relative public paths live
  at `/apis/<source>/`; generated HTML/contracts adapt retired URLs.
- Root workflows own Pages and supported data refreshes. Nested original workflows
  are retained history, not runnable workflows for this monorepo.
- Browser fetch results determine status. Scaffold and metadata-only responses must
  never appear as verified data. Successful fetch does not establish freshness.
- Keep one canonical contact block on every generated page. Preserve source bytes
  and source attribution; make serving-only adaptations in build code.
