# Task 1 – Test cases

> Recon on 2026-10-17 from the UAE (locale `en-AE`), desktop Chrome plus mobile checks. `https://trade.multibank.io/` now redirects to `trade.mb.io/login` (a login wall), so the suite targets the public site `https://mb.io/<locale>` (see OBS-01). Nothing is logged into or submitted.

**Status column:** Automated = passing in the suite · Known issue = automated and expected to fail until the linked defect is fixed (`test.fail()`; Playwright reports "unexpected pass" once it is fixed) · Observation = automated; it records the finding and does not fail.

## Traceability

| Req           | Brief requirement                                               | Covered by                                        |
| ------------- | --------------------------------------------------------------- | ------------------------------------------------- |
| 1.1           | Top navigation renders with all expected items visible          | NAV-01                                            |
| 1.2           | Each navigation item links to the correct destination           | NAV-02                                            |
| 1.3           | Navigation behaves correctly at standard desktop viewport sizes | NAV-03                                            |
| 2.1           | Spot trading section renders and displays trading pairs         | SPT-01                                            |
| 2.2           | Trading pairs are correctly grouped into categories             | SPT-02, SPT-04                                    |
| 2.3           | Trading pair entries contain the expected data fields           | SPT-03, SPT-03b, SPT-05                           |
| 3.1           | Marketing banners render in the expected page region            | BAN-01a, BAN-01b                                  |
| 3.2           | App Store and Google Play download links resolve correctly      | APP-00 … APP-03b                                  |
| 3.3           | About Us > Why MultiBank renders all expected components        | WHY-01a … WHY-01d                                 |
| 4.1           | Invalid route handling                                          | NEG-01, NEG-01b, NEG-01c                          |
| 4.2           | Broken link detection across navigation links                   | NEG-02                                            |
| 4.3           | Viewport regression at a mobile breakpoint                      | NEG-03a … NEG-03d                                 |
| 4.4           | Content loading timeout handling                                | NEG-04a, NEG-04b, NEG-04c                         |
| Bonus: API    | Validate relevant API/network responses                         | API-01a, API-01b, API-02, API-03, SPT-02, SPT-03b |
| Bonus: Visual | Add visual regression checks                                    | VIS-01a … VIS-01d                                 |
| Bonus: Data   | Parameterise test data                                          | `data/*.json` drives every spec                   |
| Bonus: CI     | Integrate basic CI                                              | `.github/workflows/ci.yml`                        |

## Latest execution — 17 Oct 2026, 15:29 (local, macOS)

Source: Monocart report, committed at `reports/sample/monocart/index.html` (summary in `reports/sample/summary-latest.md`). This run was started with `--headed`.

| Total | Passed | Known issue (expected fail) | Failed | Flaky | Skipped |
| ----- | ------ | --------------------------- | ------ | ----- | ------- |
| 118   | 104    | 9                           | 4      | 0     | 1       |

By area:

| Area                    | Result                                                                                                                      |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Navigation & layout     | All pass: NAV-01, all 10 NAV-02 items, NAV-03 at 4 viewports (Chromium + WebKit)                                            |
| Spot market             | SPT-01, -02, -03, -04, -05 pass. **SPT-03b failed on Chromium** (passed on WebKit, see OBS-16). SPT-06, SPT-07 known issues |
| Banners / Why MultiBank | All pass                                                                                                                    |
| App links               | APP-00 … APP-03a pass. APP-03b known issue (OBS-05)                                                                         |
| Negative / edge         | All pass except the known issues NEG-01c (OBS-07) and NEG-04b HTTP 500 (OBS-10). NEG-02 skipped on WebKit by design         |
| API                     | All pass. API-02 raised OBS-11 (ETC price 12 min old)                                                                       |
| Visual                  | VIS-01d passes. **VIS-01a, VIS-01b, VIS-01c failed** because of headed mode (OBS-15)                                        |

All 4 failures were re-run headless straight afterwards and passed, so none of them points to a new defect on the site. The 9 known-issue tests still fail as expected, so OBS-02, -05, -07, -08 and -10 are still open.

## Navigation & Layout — `tests/navigation/nav.spec.ts`

| ID     | Title                                       | Pri | Tags        | Steps                                             | Expected                                                                                                                                             | Status    |
| ------ | ------------------------------------------- | --- | ----------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| NAV-01 | Top navigation shows all expected items     | P1  | @smoke      | Open the home page                                | Logo, Explore, Features, OTC Desk, Company, Support, Blog, $MBG (in that order), Sign in and Sign up visible                                         | Automated |
| NAV-02 | Each navigation item opens the correct page | P1  | @smoke      | Click each nav item (one test per item)           | URL path, `<title>` and H1 match `data/nav-items.json`; $MBG opens the token site in a new tab; Sign in/up point to `trade.mb.io`; logo returns home | Automated |
| NAV-03 | Navigation works at desktop sizes           | P2  | @regression | Open home at 1920, 1440, 1366 and 1280 px; scroll | Full nav in viewport, no hamburger, no sideways scroll; header stays pinned while scrolling                                                          | Automated |

## Trading - Spot Market — `tests/trading/spot-trading.spec.ts`

| ID      | Title                                                  | Pri | Tags                     | Steps                                            | Expected                                                                                                                                                     | Status                                      |
| ------- | ------------------------------------------------------ | --- | ------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| SPT-01  | Spot market section shows trading pairs                | P1  | @smoke                   | Open Explore                                     | 'Spot market' section, 'Today's top crypto prices' table and at least 5 rows are visible                                                                     | Automated                                   |
| SPT-02  | Trading pairs are grouped into Hot, Gainers and Losers | P1  | @regression              | Click each category tab                          | Each tab shows exactly that category's list, in order, from the `market/widget` response of the same page load                                               | Automated                                   |
| SPT-03  | Each trading pair shows the expected fields            | P1  | @regression              | Read every row in every tab                      | Icon (loaded, alt = symbol), symbol, name, price `$1,234.56`, 24h change `1.23%` with up/down styling, sparkline, link to `/explore/<SYMBOL>`; no duplicates | Automated                                   |
| SPT-03b | Displayed prices agree with the price feed             | P2  | @regression              | Capture `marketdata/prices` during load; compare | Each displayed price is within 2% of the feed price                                                                                                          | Automated · flaky once on Chromium (OBS-16) |
| SPT-04  | Gainers and Losers are ranked by 24h change            | P2  | @regression @known-issue | Read signed 24h change of every row              | Top gainer outperforms top loser (hard). Strict ordering is recorded only (OBS-06)                                                                           | Observation (OBS-06)                        |
| SPT-05  | Coin detail page opens from a row                      | P2  | @regression              | Click the BTC row                                | `/explore/BTC` shows price, Trade CTA to trade.mb.io, 6 chart timeframes and Similar Assets                                                                  | Automated                                   |
| SPT-06  | Coin detail page returns HTTP 200                      | P2  | @regression @known-issue | Load `/explore/BTC` and read the status          | 200 (currently 500)                                                                                                                                          | Known issue (OBS-02)                        |
| SPT-07  | No untranslated i18n keys on coin page (mobile)        | P3  | @mobile @known-issue     | Load `/explore/BTC` on a phone                   | No raw `namespace:key` strings visible (currently `common:sign-up-login`)                                                                                    | Known issue (OBS-08)                        |

## Content - Banners — `tests/content/banners.spec.ts`

| ID      | Title                                             | Pri | Tags        | Steps        | Expected                                                                                            | Status    |
| ------- | ------------------------------------------------- | --- | ----------- | ------------ | --------------------------------------------------------------------------------------------------- | --------- |
| BAN-01a | Home hero banner sits above the fold              | P2  | @regression | Open Home    | Hero heading and both CTAs visible; hero starts where the header ends, in the top half; images load | Automated |
| BAN-01b | Explore promo banners sit between title and table | P2  | @regression | Open Explore | 3 promo cards visible, below the H1 and above Spot market, aligned in one row; images load          | Automated |

## Content - App Links — `tests/content/app-links.spec.ts`

| ID      | Title                                        | Pri | Tags                          | Steps                                    | Expected                                                                           | Status               |
| ------- | -------------------------------------------- | --- | ----------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------- | -------------------- |
| APP-00  | Download CTA uses the smart link             | P1  | @regression                   | Inspect 'Download the app' on Home       | `href` = smart link, `target=_blank`, `rel=noopener`                               | Automated            |
| APP-01  | iPhone is sent to the App Store              | P1  | @regression @api              | Follow the smart link with an iPhone UA  | Chain hits `apps.apple.com/…id1592119946`; the AE listing returns 200 and is mb.io | Automated            |
| APP-02  | Android is sent to Google Play               | P1  | @regression @api              | Follow the smart link with an Android UA | `intent://` with `package=com.multibank.app`, Play fallback URL; Play listing 200  | Automated            |
| APP-03a | Desktop Chrome lands on a working store page | P2  | @regression @api              | Follow with a desktop Chrome UA          | Ends on Google Play with 200                                                       | Automated            |
| APP-03b | Desktop Safari lands on a working store page | P2  | @regression @api @known-issue | Follow with a desktop Safari UA          | Ends on a 200 page (currently App Store 404)                                       | Known issue (OBS-05) |

## Content - Why MultiBank — `tests/content/why-multibank.spec.ts`

| ID      | Title                                | Pri | Tags        | Steps                        | Expected                                                                                       | Status    |
| ------- | ------------------------------------ | --- | ----------- | ---------------------------- | ---------------------------------------------------------------------------------------------- | --------- |
| WHY-01a | Reached from the Company nav item    | P1  | @smoke      | Home → Company               | `/…/company`, H1 "Why MultiBank Group?"                                                        | Automated |
| WHY-01b | Hero heading, intro and stats        | P1  | @smoke      | Open Company                 | Title, H1, intro copy; each stat value paired with its label ($2 trillion / Annual turnover …) | Automated |
| WHY-01c | Value sections                       | P1  | @regression | Scroll the page              | Three H2 sections each followed by the expected body text                                      | Automated |
| WHY-01d | Strength cards and community section | P2  | @regression | Scroll to the lower sections | 3 strength cards with title + text and loaded images; Community & Media headings               | Automated |

## Negative / Edge — `tests/negative/*.spec.ts`

| ID      | Title                                       | Pri | Tags                     | Steps                                         | Expected                                                                        | Status                    |
| ------- | ------------------------------------------- | --- | ------------------------ | --------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------- |
| NEG-01  | Unknown URLs return a real 404 (3 variants) | P1  | @regression              | Open each path in `data/invalid-routes.json`  | HTTP 404, 'Page not found', 'Back to Homepage', header still present            | Automated                 |
| NEG-01b | 'Back to Homepage' works                    | P2  | @regression              | Click it                                      | Lands on the home page                                                          | Automated                 |
| NEG-01c | 404 page has a document title               | P3  | @regression @known-issue | Read `<title>`                                | Non-empty (currently empty)                                                     | Known issue (OBS-07)      |
| NEG-02  | No broken header/footer links               | P1  | @regression              | Collect every header + footer href; GET each  | All < 400 (bot-protected hosts reported, not failed); JSON link report attached | Automated (Chromium only) |
| NEG-03a | Hamburger menu at 375 / 412 px              | P1  | @mobile                  | Open home on a phone; open and close the menu | Desktop nav hidden; sheet lists all items; closes cleanly                       | Automated                 |
| NEG-03b | Mobile menu navigates                       | P1  | @mobile                  | Menu → Explore                                | Explore loads, sheet closed                                                     | Automated                 |
| NEG-03c | No horizontal overflow on key pages         | P1  | @mobile                  | Open Home, Explore, Company                   | `scrollWidth ≤ innerWidth`                                                      | Automated                 |
| NEG-03d | Spot market usable on mobile                | P2  | @mobile                  | Switch to Losers                              | Rows visible, table fits the screen                                             | Automated                 |
| NEG-04a | Slow market data (5 s delay)                | P2  | @regression              | Delay `market/widget`                         | Shell usable at once; table renders once data lands; no NaN/undefined/$0.00     | Automated                 |
| NEG-04b | Market data aborted / malformed             | P1  | @regression              | Abort or corrupt `market/widget`              | No crash, no garbage values; missing table recorded as OBS-09                   | Automated + observation   |
| NEG-04b | Market data HTTP 500                        | P1  | @regression @known-issue | Return 500 from `market/widget`               | Page survives (currently the whole page becomes "Oops, something went wrong!")  | Known issue (OBS-10)      |
| NEG-04c | Price feed down                             | P2  | @regression              | Abort `marketdata/prices`                     | No NaN or $0.00 prices                                                          | Automated                 |

## API (bonus) — `tests/api/market-data.spec.ts`

| ID      | Title                                     | Pri | Tags | Expected                                                                                                       | Status                  |
| ------- | ----------------------------------------- | --- | ---- | -------------------------------------------------------------------------------------------------------------- | ----------------------- |
| API-01a | Widget returns Hot / Gainers / Losers     | P2  | @api | 200 JSON, ids in order, each has items/highlighted, ≥5 unique items                                            | Automated               |
| API-01b | Every widget symbol is a known instrument | P2  | @api | Each symbol exists in `market/instruments` with a name and an https image                                      | Automated               |
| API-02  | Prices are positive and fresh             | P1  | @api | Every widget pair has a USD price > 0, younger than 60 min, formatted % = raw % × 100; >5 min flagged (OBS-11) | Automated + observation |
| API-03  | Marketing banner images load              | P3  | @api | Every banner `imageUrl` is https and returns 200 `image/*`                                                     | Automated               |

## Visual (bonus) — `tests/visual/visual.spec.ts`

| ID      | Title              | Pri | Tags    | Expected                                              | Status                                    |
| ------- | ------------------ | --- | ------- | ----------------------------------------------------- | ----------------------------------------- |
| VIS-01a | Header             | P3  | @visual | Matches baseline after fonts load and fade-ins finish | Automated · fails in headed mode (OBS-15) |
| VIS-01b | Footer             | P3  | @visual | Matches baseline                                      | Automated · fails in headed mode (OBS-15) |
| VIS-01c | Why MultiBank hero | P3  | @visual | Matches baseline                                      | Automated · fails in headed mode (OBS-15) |
| VIS-01d | 404 page           | P3  | @visual | Matches baseline (header masked)                      | Automated                                 |

## Key observations

| ID     | Category        | Severity | Finding                                                                                                                                                                                                   | Handling                                                                                                  | Status           |
| ------ | --------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------- |
| OBS-01 | Scope           | High     | `https://trade.multibank.io/` redirects to `https://trade.mb.io/login` (login wall). All public content in the brief lives on `https://mb.io/<locale>`.                                                   | Suite targets mb.io                                                                                       | Assumption       |
| OBS-02 | Defect          | High     | `/en-AE/explore/BTC` (and other coins) render normally but respond with HTTP 500.                                                                                                                         | Breaks SEO indexing, CDN caching and uptime monitors. SPT-06.                                             | Open             |
| OBS-05 | Defect          | Medium   | The desktop Safari route through the smart link goes via adjust → `apps.apple.com/app/id1592119946` (no storefront), which returns 404. The `/ae/` storefront works.                                      | Listing is geo-limited; the desktop fallback should be a web page or QR. APP-03b.                         | Open             |
| OBS-06 | Question        | Medium   | Gainers/Losers are not strictly sorted by the displayed 24h change, and Gainers can include falling coins on a down day.                                                                                  | Ask the PO what ranking is intended. SPT-04 records it until then.                                        | Open             |
| OBS-07 | Defect          | Low      | The 404 page renders with an empty `<title>` (unknown coin 404s get a coin-style title instead).                                                                                                          | Browser tab and history show a blank entry. NEG-01c.                                                      | Open             |
| OBS-08 | Defect          | Medium   | On mobile, the coin page's sticky CTA shows the raw i18n key `common:sign-up-login`.                                                                                                                      | Visible on every coin page on phones. SPT-07. Evidence: `reports/sample/evidence/`.                       | Open             |
| OBS-09 | UX / Resilience | Medium   | If `market/widget` fails (network error or bad JSON), the price table disappears with no message, and the client retries silently in a backoff loop indefinitely.                                         | Ask for an empty/error state with retry. Recorded by NEG-04b.                                             | Open             |
| OBS-10 | Defect          | High     | If `market/widget` returns HTTP 500, the entire Explore page is replaced by "Oops, something went wrong!" about 2 s later (no retry). One failed widget call takes down the whole page.                   | Error boundary should be scoped to the widget. NEG-04b (HTTP 500). Evidence: `reports/sample/evidence/`.  | Open             |
| OBS-11 | Data quality    | Low      | Some price ticks are minutes old (e.g. MBG 35 min during recon, ETC 12 min in the 17 Oct 15:29 run). Probably thin trading, but the UI shows no "last updated" time.                                      | API-02 hard-fails above 60 min, flags above 5 min.                                                        | Observation      |
| OBS-12 | Flakiness risk  | High     | Content is geo/locale-dependent: `/` redirects to `/en-AE` from the UAE; legal pages carry a `-gcc` suffix. US-based CI runners may get a different locale or content.                                    | Paths pinned with `LOCALE` (default `en-AE`); paths asserted with locale-agnostic patterns.               | Mitigated        |
| OBS-13 | Layout          | Low      | At exactly 1024 px (the desktop breakpoint) WebKit intermittently renders the tablet header (hamburger) instead of the desktop nav.                                                                       | Kept out of the deterministic desktop matrix (1280 px and up); worth a design decision on the boundary.   | Observation      |
| OBS-14 | Platform        | Info     | `core-api.mb.io/api/v1/public/configuration` returned 500 during recon page loads; an uncaught error (`reading 'initialised'`) is thrown on Explore when market data fails.                               | No visible impact found; raised for the dev team. Page errors are attached to every test report.          | Observation      |
| OBS-15 | Test setup      | Low      | VIS-01a/b/c fail when the suite runs with `--headed`: the visible browser reserves 6 px for a scrollbar, so screenshots come out 1434 px wide against 1440 px baselines. Headless runs pass.              | Not a site defect. Run visual tests headless only (CI already does); baselines stay at 1440 px.           | Known limitation |
| OBS-16 | Flakiness       | Low      | SPT-03b timed out once on Chromium (Explore H1 not visible within 15 s, then no `marketdata/prices` response) during a 9-worker headed run. It passed on WebKit in the same run and on a headless re-run. | Most likely a slow page load under heavy local load. Watch the Monocart trend; investigate if it repeats. | Watching         |

## Conventions for the suite

- Each test opens its own page; no shared state; no `waitForTimeout`.
- Expected values come from `data/*.json`; parameterised with `for…of` so each item is its own test.
- Live values (prices, %, ordering) are checked by format, direction class, or against the API response captured in the same page load.
- Paths are asserted locale-agnostically (`/[a-z]{2}-[A-Z]{2}/explore`); the locale is a config value (`LOCALE`, default `en-AE`).
- Tags: `@smoke`, `@regression`, `@mobile`, `@api`, `@visual`, `@known-issue`. Known defects use `test.fail()` with an annotation linking the OBS id; product questions use a non-failing `observation` annotation.
