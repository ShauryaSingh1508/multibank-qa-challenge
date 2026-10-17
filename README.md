# MultiBank (mb.io) – QA Automation Challenge

A Playwright + TypeScript framework that tests the public mb.io web experience (Task 1), plus written QA strategy documents for a mobile trading app launch (Task 2).

```bash
npm ci && npm test
```

That single command installs dependencies and browsers, then runs the whole suite: Chromium, Firefox, WebKit, mobile Chrome, mobile Safari, API and visual projects. Requires Node 20+.

| Quick links                                              |                                                       |
| -------------------------------------------------------- | ----------------------------------------------------- |
| [Test cases & findings](docs/test-cases.md)              | Every test, traceability to the brief, OBS-xx defects |
| [Test plan](docs/test-plan.md)                           | Scope, approach, entry/exit criteria, cadence         |
| [Task 2 – QA strategy](docs/qa-strategy.md)              | Answers to the five questions                         |
| [Risk matrix](docs/risk-matrix.md)                       | Mobile launch risks + risks found on mb.io            |
| [Release readiness checklist](docs/release-checklist.md) | Go/no-go checklist with blockers                      |
| [Sample execution report](reports/sample/)               | HTML report, JUnit, summary, evidence screenshots     |

---

## Assumptions

1. **Target URL.** `https://trade.multibank.io/` now redirects to `https://trade.mb.io/login`, which is a login wall. Every public feature the brief names (navigation, spot market, banners, app links, Why MultiBank) lives on the marketing site **`https://mb.io/<locale>`**, so that is the system under test. The redirect itself is noted as OBS-01.
2. **"About Us > Why MultiBank"** is the page behind the **Company** nav item (`/company`, H1 "Why MultiBank Group?").
3. **"Spot trading section"** is the **Spot market** block on **Explore**, with the Hot / Gainers / Losers tabs as the categories.
4. **Locale.** Content is geo-dependent (`/` redirects to `/en-AE` from the UAE). The suite pins `LOCALE=en-AE` and asserts URLs with locale-agnostic patterns.
5. **No account actions.** Sign in / Sign up are verified by their link targets only; no form is ever submitted.
6. Expected copy reflects the live site on 2026-10-17 and lives in `data/*.json`, so a content change means a one-line data update.

## Results at a glance

Latest local run (macOS, Playwright 1.64.1): **117 passed, 0 failed, 0 flaky** across chromium, webkit, mobile-chrome, mobile-safari, api and visual. Known-defect tests are counted as passing because they fail as expected. Details are in [`reports/sample/`](reports/sample/).

Building the suite surfaced **real defects** on production, each pinned by an automated test:

| ID     | Severity | Finding                                                                                                               |
| ------ | -------- | --------------------------------------------------------------------------------------------------------------------- |
| OBS-10 | High     | A single HTTP 500 from the market-data widget replaces the **entire Explore page** with "Oops, something went wrong!" |
| OBS-02 | High     | Coin detail pages (`/explore/BTC` …) render fine but respond with **HTTP 500**                                        |
| OBS-09 | Medium   | If market data fails, the price table disappears with no message and the client retries silently forever              |
| OBS-05 | Medium   | "Download the app" from desktop Safari ends on an **App Store 404**                                                   |
| OBS-08 | Medium   | Mobile coin page shows the raw i18n key `common:sign-up-login`                                                        |
| OBS-06 | Question | Gainers / Losers are not sorted by the 24h change they display                                                        |
| OBS-07 | Low      | 404 page has an empty `<title>`                                                                                       |

Full list with handling: [docs/test-cases.md#key-observations](docs/test-cases.md#key-observations).

## Running subsets

| Command                                          | What it runs                                       |
| ------------------------------------------------ | -------------------------------------------------- |
| `npm test`                                       | Everything (all 7 projects)                        |
| `npm run test:smoke`                             | `@smoke` on Chromium (< 10 s)                      |
| `npm run test:cross-browser`                     | Desktop suite on Chromium, Firefox and WebKit      |
| `npm run test:chromium` / `:firefox` / `:webkit` | One desktop engine                                 |
| `npm run test:mobile`                            | `@mobile` on Pixel 7 and iPhone 13 emulation       |
| `npm run test:api`                               | `@api` (no browser)                                |
| `npm run test:visual`                            | Visual regression (`:update` to refresh baselines) |
| `npm run report`                                 | Open the last HTML report                          |
| `npm run report:summary`                         | Print a Markdown summary of the last run           |
| `npm run lint` / `typecheck` / `format:check`    | Static checks (run in CI before tests)             |

Any Playwright flag works too, e.g. `npx playwright test -g "SPT-02" --headed --project=webkit`.

**Configuration** (`config/env.ts`; override via env vars or a `.env` file, see `.env.example`): `BASE_URL`, `LOCALE`, `CORE_API_URL`, `MARKET_DATA_API_URL`, `APP_SMART_LINK`.

## Project structure

```
├── config/env.ts            Environment values + locale-aware path helpers
├── playwright.config.ts     Projects (browsers/devices), reporters, timeouts, tag routing
├── pages/                   Page Object Model
│   ├── BasePage.ts          open(), readiness, overflow + broken-image helpers, header/footer
│   ├── components/          NavBar (desktop nav + mobile sheet), Footer
│   ├── HomePage.ts  SpotTradingPage.ts  CoinDetailPage.ts  WhyMultiBankPage.ts  NotFoundPage.ts
├── api/                     MarketApi client + response types (API-layer "page object")
├── fixtures/
│   ├── test.ts              UI fixtures: page objects injected, 3rd-party blocking, consent handler, page-error capture
│   └── api.ts               Browserless fixtures for @api specs
├── data/                    Test data: nav items, viewports, categories, page copy, routes, app links
├── utils/                   link-checker, redirect follower, network capture, formatters, knownIssue()
├── tests/
│   ├── navigation/          nav.spec.ts
│   ├── trading/             spot-trading.spec.ts
│   ├── content/             banners, app-links, why-multibank
│   ├── negative/            invalid-route, broken-links, mobile-viewport, timeout
│   ├── api/                 market-data.spec.ts       (bonus)
│   └── visual/              visual.spec.ts + baselines (bonus)
├── scripts/                 summarize-results.mjs (JSON report → Markdown)
├── docs/                    test plan, test cases, risk matrix, release checklist, QA strategy
├── reports/sample/          Committed sample run
└── .github/workflows/ci.yml Lint → browser matrix → artifacts; nightly schedule
```

## Framework design decisions

**Playwright + TypeScript.** One runner covers Chromium, Firefox and WebKit, device emulation, API requests, network interception, screenshots and traces. That means a single tool for UI, API, fault injection and visual checks. TypeScript catches page-object misuse at compile time.

**Page Object Model, kept thin.** Page objects expose locators and intent-level actions (`selectCategory`, `openMobileMenu`, `readRows`). **Assertions stay in specs**, so a failure points at the requirement, not at a helper. The shared header and footer are components composed into `BasePage`, not inherited copies. The API client (`api/MarketApi.ts`) is the same idea for the service layer.

**Fixtures for wiring.** Specs ask for `homePage` or `spotTradingPage` and get a ready instance. Auto-fixtures handle cross-cutting concerns once: blocking chat/analytics scripts (noise and overlays), dismissing cookie consent with a locator handler (no racy one-off click), and attaching uncaught page errors to the report.

**Locators.** Role- and text-based first (`getByRole('navigation', { name: 'Main' })`, `getByRole('button', { name: 'Gainers' })`), which is also an accessibility signal. Where the app has no accessible hooks, stable structural attributes are used (`td[id$="_price-td"]`, `tr[data-index]`), never the utility-class soup.

**Assertions that survive live data.** Prices and rankings change every second, so specs never hard-code them. Instead:

- **Same-load API comparison:** the spec captures the `market/widget` / `prices` responses the page itself fetched, then asserts the table matches them (category membership and order, price within 2%).
- **Format + direction:** every row is checked for `$1,234.56`, `1.23%`, and an up/down style. Malformed values fail with the exact row named (`Gainers > SAND: sparkline`), using soft assertions so one run reports every bad cell.
- **Positional checks for "expected region":** banner bounding boxes are asserted relative to the header, page title and spot section.

**Determinism.** No `waitForTimeout` (lint-enforced). Waits are on conditions: element visible, response received, rows settled (icons and sparklines rendered). `open()` waits for `load` so clicks don't land before hydration. The hamburger open retries until the sheet appears, because a click that lands before React attaches its handler is silently dropped. A breakpoint-boundary width (1024 px) that rendered non-deterministically in WebKit was moved out of the matrix and logged (OBS-13) instead of being retried into green.

**Known defects stay visible but don't block.** `knownIssue(testInfo, 'OBS-02', …)` asserts the correct behaviour and marks the test `test.fail()`. The run stays green, the report lists the defect, and when developers fix it Playwright reports an _unexpected pass_, the cue to remove the marker. Product questions (e.g. ranking order) use a non-failing `observation` annotation instead.

**Edge cases that reflect real failures.** Fault injection covers a slow feed, an aborted request, malformed JSON and HTTP 500, and checks for a crash or garbage (`NaN`, `undefined`, `$0.00`) rather than only "page loads". The smart-link checks follow redirects hop by hop with iPhone, Android, desktop Chrome and desktop Safari User-Agents, because the Android hop ends in `intent://`, which no desktop browser can load.

**Tags route tests to projects.** `@mobile` runs only on the device projects, `@api` only on the browserless project, and `@visual` only on the Chromium visual project. A new spec only needs the right tag to run in the right place.

**Scaling the framework.** Adding a page means one page-object file plus a fixture line. Adding coverage for a new nav item, viewport, invalid route or Why MultiBank section is a JSON edit. Pointing at staging or another locale is an env var.

## Cross-browser evidence

- `reports/sample/html/index.html`: HTML report of the full local run (Chromium, WebKit, mobile Chrome, mobile Safari, API, visual). Open it with `npx playwright show-report reports/sample/html`.
- `reports/sample/summary-local.md`: per-project totals and every known issue or observation raised.
- **Firefox:** the Firefox build bundled with Playwright 1.64 fails to start on the author's machine (macOS 27) (`Could not find profile folder`, a local environment issue that happens before any test code runs). Firefox runs in the CI matrix on Ubuntu; see the `e2e (firefox)` job and its `report-firefox` artifact on the Actions tab.
- CI uploads one HTML report per project as an artifact and writes a Markdown summary to each job page.

## Visual baselines

Baselines live next to the spec (`tests/visual/__screenshots__/visual/`) and were generated on macOS. Font rendering differs between operating systems, so the CI visual job runs in the official Playwright Docker image and is informational (`continue-on-error`) until Linux baselines are committed (`npm run test:visual:update` inside that image). Only static regions are captured: header, footer, Why MultiBank hero and 404. Fonts and fade-in animations are allowed to finish first.

## Adding a test

1. Put expected values in `data/<area>.json`.
2. If the page is new, add `pages/<Name>Page.ts` extending `BasePage` (locators + actions only) and register it in `fixtures/test.ts`.
3. Write `tests/<area>/<name>.spec.ts` importing `test, expect` from `fixtures/test` (or `fixtures/api` for HTTP-only tests). Give it an ID and tags (`@smoke` / `@regression` / `@mobile` / `@api` / `@visual`).
4. Add a row to `docs/test-cases.md`.
5. Run `npm run lint && npm run typecheck` before pushing.

## Ethics and safety

The suite only reads public pages and public JSON endpoints. It never logs in, never submits a form, keeps link-check concurrency low, runs the link check on one browser only, and blocks analytics so test traffic doesn't pollute marketing data.
