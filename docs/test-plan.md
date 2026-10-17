# Test plan – mb.io public web (Task 1)

## 1. Purpose

Give the team fast, trustworthy feedback on the public, logged-out mb.io experience: navigation, live market data, marketing content and the app download funnel. A failure should mean something broke for users, not that the test hit a timing issue.

## 2. Scope

**In scope**

| Area                | What is covered                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------ |
| Navigation & layout | Header items, destinations, external/auth links, pinned header, desktop viewports                      |
| Spot market         | Section render, Hot/Gainers/Losers grouping, row data fields, price accuracy vs feed, coin detail page |
| Content             | Hero and promo banners (position and images), app download smart link per platform, Why MultiBank page |
| Negative / edge     | Invalid routes, broken links, mobile breakpoints, slow/failed/malformed market data                    |
| API (bonus)         | Public market-data contracts, price freshness, banner assets                                           |
| Visual (bonus)      | Header, footer, Why MultiBank hero, 404                                                                |

**Out of scope** (per the brief, or not reachable without an account)

- Anything behind login on `trade.mb.io`: registration, KYC, deposits, orders, wallets.
- Submitting any form (contact, newsletter); creating accounts.
- Load/performance and security testing. The suite deliberately stays a light, polite client of production.
- Native mobile apps (only the store redirect is checked).
- Non-English locales, beyond keeping assertions locale-agnostic.

## 3. Approach

| Level            | Tool / technique                                                       | Why                                                                                     |
| ---------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| UI functional    | Playwright + TypeScript, Page Object Model, custom fixtures            | Cross-browser engines out of the box, auto-waiting, traces                              |
| Data consistency | Capture the API response from the same page load, compare to the DOM   | Live prices and rankings change every second; hard-coded expected values would be flaky |
| Fault injection  | `page.route` to delay, abort, 500 or corrupt responses                 | Reproducible failure modes that cannot be produced on demand against production         |
| Contract (API)   | Playwright `request` fixture, no browser                               | Fast, and isolates data problems from UI problems                                       |
| Redirects        | Manual hop-by-hop follow with platform User-Agents                     | Smart links branch on UA and end in `intent://`, which a desktop browser can't load     |
| Visual           | `toHaveScreenshot` on static regions, live data out of frame or masked | Catches layout and styling regressions that functional assertions miss                  |

**Test design rules**

- Independent: every test opens its own page; no ordering dependencies; fully parallel.
- Deterministic: no fixed sleeps. Waits target a condition (element, response, settled rows). Third-party scripts (chat, analytics) are blocked. Cookie consent is handled by a locator handler.
- Data-driven: expected copy, nav items, viewports, routes and categories live in `data/*.json`.
- Known defects stay visible: `test.fail()` + annotation. When a defect is fixed, the "unexpected pass" prompts us to remove the marker.

## 4. Environments and configuration

| Item     | Value                                                                                              |
| -------- | -------------------------------------------------------------------------------------------------- |
| Target   | `https://mb.io/<LOCALE>` (production), default locale `en-AE`                                      |
| Browsers | Chromium, WebKit (desktop 1440×900); Pixel 7 (Chromium) and iPhone 13 (WebKit) emulation           |
| Config   | `config/env.ts`; every value can be overridden by an env var or `.env`                             |
| CI       | GitHub Actions: lint → browser matrix in parallel; nightly schedule; reports uploaded as artifacts |

## 5. Entry and exit criteria

**Entry:** site reachable; `npm ci` and `npx playwright install` succeed; lint and typecheck pass.

**Exit (for a release candidate):**

- All `@smoke` tests pass on Chromium and WebKit.
- No unexpected failures in `@regression`, `@mobile` or `@api`. Flaky tests are investigated, not just re-run.
- Each `@known-issue` has an owner and a ticket; any new failure is triaged within one working day.
- Visual diffs are reviewed and baselines updated in the same PR as the intended UI change.

## 6. Execution cadence

| Trigger             | Scope                                 | Target time |
| ------------------- | ------------------------------------- | ----------- |
| Local / pre-push    | `npm run test:smoke`                  | < 1 min     |
| Pull request        | Full matrix (all projects)            | < 5 min     |
| Nightly (scheduled) | Full matrix against production        | < 5 min     |
| Before a release    | Full matrix + manual exploratory pass | ~1 h        |

## 7. Deliverables

- HTML report, JSON results, JUnit XML (`reports/`), plus a Markdown summary per CI job.
- Monocart report (`reports/monocart/index.html`, open with `npm run report:monocart`): one searchable table covering every project, known-issue and observation annotations shown next to each test, and a pass-rate trend built from the previous run's `reports/monocart/index.json`. In CI it's uploaded as part of each project's `report-<project>` artifact.
- Traces and screenshots for failures (`test-results/`).
- Committed sample runs: `reports/sample/`. The Playwright HTML report and JUnit file come from a headless run. The Monocart report (`reports/sample/monocart/`, trace zips left out) and `summary-latest.md` come from a later headed run.
- This plan, the test-case catalogue (`test-cases.md`) and observations (OBS-xx).

## 8. Risks to the test effort

| Risk                                                                             | Mitigation                                                                          |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Live data changes between read and assert                                        | Compare against the response from the same load; tolerances for prices              |
| Geo/locale content differences on CI runners (OBS-12)                            | Locale pinned in config; locale-agnostic URL assertions                             |
| Hydration races (clicks before JS attaches handlers)                             | `open()` waits for `load`; menu open retries until the sheet appears                |
| Third-party stores / bot protection (App Store, hacken.io) block automation      | Bot-protected hosts reported, not failed; one CI retry for transient network errors |
| Production rate limiting                                                         | Low link-check concurrency; link check runs on one browser only                     |
| Visual baselines break when run headed (scrollbar shrinks width by 6 px, OBS-15) | Visual project run headless only; CI never runs headed                              |
| Slow page loads under heavy local parallelism (SPT-03b timeout, OBS-16)          | One CI retry; Monocart trend shows whether a test keeps failing                     |
