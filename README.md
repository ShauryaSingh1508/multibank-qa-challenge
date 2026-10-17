# MultiBank (mb.io) QA Automation Challenge

My submission has two parts:

- **[Task 1: Test automation](#task-1-test-automation).** A Playwright + TypeScript suite for the public mb.io site. Everything from Setup onwards is about this.
- **[Task 2: QA strategy](#task-2-qa-strategy).** How I'd handle QA as the first QA engineer, two weeks before a mobile trading app launches.

## Task 2: QA strategy

This is a written task, so there's no code. The scenario: it's my first day as the only QA at a fintech startup, the iOS and Android trading app goes live in two weeks, there are no tests, and real money is involved.

My answers are in **[docs/qa-strategy.md](docs/qa-strategy.md)**, one section per question:

1. **Where do you start?** Not with automation. I spend the first days mapping where money can go wrong, put it in a risk matrix, and bring a clear "must verify / accepted gaps" list to the go/no-go.
2. **How would you approach testing this app?** Risk-based, with money correctness first: ledger, order lifecycle, resilience, security, devices and compliance. API tests come before a small set of mobile E2E tests.
3. **What does QA look like inside a sprint?** QA is involved at every stage, from refining the ticket through to watching production after release, not just a testing phase at the end.
4. **What does your ideal regression suite look like?** A pyramid in tiers (smoke, core, nightly), deterministic and traceable to risks. It also covers non-functional testing: k6 load, stress, spike and soak tests, app performance budgets, and network failure testing.
5. **What would keep you up at night?** Duplicate orders or withdrawals when something fails, stale prices, account takeover, shipping with no safety net, launch-day load, and having no way to spot or undo a problem. If I could get only one thing before launch, it would be a reconciliation check on balances.

Two documents go with it:

- **[Risk matrix](docs/risk-matrix.md):** launch risks scored by likelihood × impact, plus the real risks I found on mb.io in Task 1.
- **[Release checklist](docs/release-checklist.md):** the go/no-go list, with blockers marked.

## Task 1: Test automation

```bash
npm ci && npm test
```

Needs Node 20+. `npm test` installs the browsers and runs all 6 projects.

## Setup

1. **Node.** 20 or newer (I used 22). Check with `node -v`.

2. **Clone and install.**

   ```bash
   git clone https://github.com/ShauryaSingh1508/multibank-qa-challenge.git
   cd multibank-qa-challenge
   npm ci
   ```

3. **Browsers.**

   ```bash
   npx playwright install chromium webkit
   ```

4. **(Optional) Settings.** By default it tests https://mb.io in `en-AE`, so I usually skip this. To test staging or another locale, `cp .env.example .env` and change `BASE_URL` or `LOCALE`. Expected text in `data/*.json` is English, so another language needs its own copy there.

5. **Check it works.**

   ```bash
   npm run test:smoke                              # under 10 seconds
   npm run test:smoke -- --headed                  # watch the browser
   npm run test:smoke -- --headed --workers=1      # one window at a time
   ```

   `-- --headed` works on any `npm run test:*` command. When I want one worker locally all the time, I change `workers: env.isCI ? 2 : undefined` to `workers: env.isCI ? 2 : 1` in `playwright.config.ts`.

6. **Results.**

   ```bash
   npm run report            # Playwright HTML report
   npm run report:monocart   # Monocart report (the one I use)
   ```

   Monocart puts every project in one searchable table, shows the known-issue notes next to each test and keeps a pass-rate trend. The file is `reports/monocart/index.html` (`npx monocart show-report reports/monocart/index.html` opens it too).

Other docs:

- [Test cases and findings](docs/test-cases.md)
- [Test plan](docs/test-plan.md)
- [Sample runs](reports/sample/)

## Assumptions I made

1. `trade.multibank.io` now redirects to a login page (`trade.mb.io/login`). Everything the brief mentions is on `mb.io/<locale>`, so I tested that (OBS-01).
2. "About Us > Why MultiBank" = the Company page (`/company`).
3. "Spot trading section" = the Spot market block on Explore, with Hot / Gainers / Losers as categories.
4. The site picks a locale by location. I pinned `en-AE` and kept URL checks locale-agnostic.
5. No accounts, no form submits. Sign in / Sign up are checked by where they link.
6. Expected text is from the live site on 17 Oct 2026, kept in `data/*.json`.

## Results

Two full local runs on 17 Oct 2026 (macOS, Playwright 1.64.1). Known-defect tests count as passed since they're expected to fail.

- **Headless:** 117 passed, 0 failed, 1 skipped.
- **Headed** (the Monocart one): 113 passed, 4 failed, 1 skipped. Three visual tests failed because headed mode adds a 6px scrollbar (OBS-15), and SPT-03b timed out once on a slow load (OBS-16). All four passed when re-run headless, so none are site bugs.

Reports are in [`reports/sample/`](reports/sample/).

Real bugs I found on production, each tracked by a test:

| ID     | Severity | What happens                                                          |
| ------ | -------- | --------------------------------------------------------------------- |
| OBS-10 | High     | One 500 from the market-data widget takes down the whole Explore page |
| OBS-02 | High     | Coin pages like `/explore/BTC` look fine but return HTTP 500          |
| OBS-09 | Medium   | If market data fails, the price table just vanishes with no message   |
| OBS-05 | Medium   | "Download the app" on desktop Safari lands on an App Store 404        |
| OBS-08 | Medium   | Mobile coin page shows the raw key `common:sign-up-login` on a button |
| OBS-06 | Question | Gainers/Losers aren't sorted by their 24h change. Might be on purpose |
| OBS-07 | Low      | 404 page has an empty `<title>`                                       |

Full list in [docs/test-cases.md](docs/test-cases.md#key-observations).

## Running the tests

| Command                                       | What it does                               |
| --------------------------------------------- | ------------------------------------------ |
| `npm test`                                    | Everything                                 |
| `npm run test:smoke`                          | `@smoke` on Chromium                       |
| `npm run test:cross-browser`                  | Desktop tests on Chromium and WebKit       |
| `npm run test:chromium` / `:webkit`           | One browser                                |
| `npm run test:mobile`                         | Pixel 7 and iPhone 13 emulation            |
| `npm run test:api`                            | API tests, no browser                      |
| `npm run test:visual`                         | Screenshots (`:update` to reset baselines) |
| `npm run report` / `report:monocart`          | Open a report                              |
| `npm run report:summary`                      | Markdown summary of the last run           |
| `npm run lint` / `typecheck` / `format:check` | Static checks                              |

Any Playwright flag works, e.g. `npx playwright test -g "SPT-02" --headed` or `npx playwright test --ui`.

## Project layout

```
├── config/env.ts            Env values, locale helpers
├── playwright.config.ts     Projects, reporters, tag routing
├── pages/                   Page objects (+ components/ for nav and footer)
├── api/                     MarketApi client
├── fixtures/                test.ts (UI), api.ts (browserless)
├── data/                    Test data as JSON
├── utils/                   Link checker, redirects, network, knownIssue()
├── tests/                   navigation, trading, content, negative, api, visual
├── scripts/                 summarize-results.mjs
├── docs/                    Test plan, cases, risks, checklist, strategy
├── reports/sample/          Committed sample runs
└── .github/workflows/ci.yml CI: lint, browser matrix, nightly
```

## How the framework is built, and why

**Playwright + TypeScript.** One tool for browsers, mobile emulation, API calls, mocking and screenshots.

**Thin page objects.** Locators and actions only. Assertions stay in the specs so a failure points at the requirement.

**Fixtures.** Tests ask for `homePage` etc. and get one ready. Auto-fixtures block chat/analytics, close the cookie banner and attach page errors.

**Locators.** Roles and text first, stable attributes (`tr[data-index]`) when there's nothing else. No CSS utility classes.

**Live data.** Prices change constantly, so I compared the table against the API response from the same page load, check formats (`$1,234.56`, `1.23%`) with soft assertions, and check banner positions relative to the page.

**Stability.** No `waitForTimeout` (lint blocks it). Waits are on real conditions. The 1024px WebKit layout was flaky, so I logged it (OBS-13) instead of retrying it green.

**Known bugs.** `knownIssue()` marks a test as expected to fail. The run stays green, the bug stays in the report, and Playwright tells me when it's fixed. Product questions get a non-failing `observation`.

**Negative tests.** Slow feed, aborted request, bad JSON and a 500, checking for crashes or junk like `NaN`. App links are followed hop by hop with different user agents.

**Tags.** `@mobile`, `@api` and `@visual` decide which project a test runs in.

**Easy to extend.** To test a new page, I will create one page-object file for it and add one line in `fixtures/test.ts` so tests can use it. For a lot of changes I don't need to write any code at all. If the site adds a menu item, I add it to `data/nav-items.json`. To test another screen size, I add it to `data/viewports.json`. To check another broken URL, I add it to `data/invalid-routes.json`. The tests read these files and create a test for each entry automatically.

## Cross-browser results

- `reports/sample/html/`: Playwright report from the headless run (`npx playwright show-report reports/sample/html`).
- `reports/sample/monocart/`: Monocart report from the headed run.
- `summary-local.md` and `summary-latest.md` in the same folder have the per-project totals.
- CI uploads both reports per project and writes a summary to the job page.

## Visual baselines

Baselines are in `tests/visual/__screenshots__/visual/`, taken on macOS. Only static parts are captured: header, footer, Why MultiBank hero, 404.

## Adding a test

1. Expected values go in `data/<area>.json`.
2. New page? Add `pages/<Name>Page.ts` and register it in `fixtures/test.ts`.
3. Write `tests/<area>/<name>.spec.ts` with an ID and tags.
4. Add a row to `docs/test-cases.md`.
5. `npm run lint && npm run typecheck`.

## A note on safety

Public pages and endpoints only. No logins, no forms, low link-check concurrency, and analytics blocked so test traffic stays out of MultiBank's data.
