# RNSP Issue Register

`../RNSP_Issue_Register.pdf` is the full-system audit (frontend · backend · i18n),
89 issues assigned across 5 owners with severity, location, fix, and live status.

## Owners
- **Kenny** — Backend API, Auth & Security *(all 24 fixed)*
- **Malvyn** — Database, Config, Realtime, Deploy & Dead-code
- **Levi** — Public Frontend
- **Alpha** — Admin / Team / Reporter / Auth UI
- **Brian** — Internationalisation & Accessibility

## Regenerating the PDF
`generate.mjs` holds the issue data + renders the PDF via headless Chromium.
It needs `playwright` on the path:

```bash
npm i playwright@1.61.1 && npx playwright install chromium
node generate.mjs   # writes ../RNSP_Issue_Register.pdf
```

Update an issue's `status` (`open` | `fixed` | `partial` | `deferred`) in the
data arrays and re-run to refresh the register.
