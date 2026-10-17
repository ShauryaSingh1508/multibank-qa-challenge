# Sample execution report

Committed evidence from two full local runs on 17 Oct 2026 (macOS, Playwright 1.64.1).

| File                 | Run                  | Contents                                                                                           |
| -------------------- | -------------------- | -------------------------------------------------------------------------------------------------- |
| `html/`              | 10:05 UTC (headless) | Playwright HTML report: every test per project, steps, annotations, attachments, traces            |
| `summary-local.md`   | 10:05 UTC (headless) | Per-project totals, plus each known issue / observation raised by the run                          |
| `junit.xml`          | 10:05 UTC (headless) | JUnit results (what a CI dashboard would ingest)                                                   |
| `monocart/`          | 11:29 UTC (headed)   | Monocart report: all projects in one searchable table, annotations per test, pass-rate trend        |
| `summary-latest.md`  | 11:29 UTC (headed)   | Per-project totals for the Monocart run                                                            |
| `evidence/`          | –                    | Screenshots of defects found: OBS-10 (whole-page crash on a widget 500) and OBS-08 (raw i18n key) |

Results:

- **10:05 run (headless):** 117 passed, 0 failed, 1 skipped.
- **11:29 run (headed):** 113 passed, 4 failed, 1 skipped.
  - The 4 failures were VIS-01a, VIS-01b, VIS-01c (headed mode adds a 6 px scrollbar, see OBS-15) and SPT-03b on Chromium (one-off page-load timeout, see OBS-16).
  - All 4 passed when re-run headless.

Both counts treat `@known-issue` tests as passed, because they fail as expected. Each one's annotation names its OBS id in [docs/test-cases.md](../../docs/test-cases.md#key-observations).

To open the reports:

```bash
npx playwright show-report reports/sample/html
npx monocart show-report reports/sample/monocart/index.html
```

The Monocart copy leaves out the trace `.zip` files to keep the repo small. Screenshots and error details are still included.
