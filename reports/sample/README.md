# Sample execution report

Committed evidence from a full local run (macOS, Playwright 1.64.1).

| File                    | Contents                                                                                     |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| `html/`                 | Playwright HTML report: every test per project, steps, annotations, attachments, traces      |
| `summary-local.md`      | Per-project totals, plus each known issue / observation raised by the run                    |
| `junit.xml`             | JUnit results (what a CI dashboard would ingest)                                             |
| `evidence/`             | Screenshots of defects found: OBS-10 (whole-page crash on a widget 500) and OBS-08 (raw i18n key) |

Open the HTML report with:

```bash
npx playwright show-report reports/sample/html
```

Tests marked `@known-issue` show as passing ("expected to fail"). Their annotation names the OBS id in [docs/test-cases.md](../../docs/test-cases.md#key-observations).
Firefox results come from the CI matrix (see the README, Cross-browser evidence).
