# Test execution summary

Run started: 2026-10-17T10:05:00.187Z · Duration: 44s · Playwright 1.64.1

| Project | Passed | Known issue (expected fail) | Failed | Flaky | Skipped |
|---|---|---|---|---|---|
| chromium | 41 | 3 | 0 | 0 | 0 |
| webkit | 40 | 3 | 0 | 0 | 1 |
| api | 7 | 1 | 0 | 0 | 0 |
| mobile-chrome | 8 | 1 | 0 | 0 | 0 |
| mobile-safari | 8 | 1 | 0 | 0 | 0 |
| visual | 4 | 0 | 0 | 0 | 0 |

## Known issues and observations raised by the run

| Project | Test | Type | Detail |
|---|---|---|---|
| api | APP-03b desktop Safari visitors land on a working store page @regression @known-issue | known-issue | OBS-05: desktop Safari is sent to the storefront-less App Store URL, which returns 404 (see docs/test-cases.md) |
| chromium | NEG-01c 404 page has a document title @regression @known-issue | known-issue | OBS-07: 404 page renders with an empty <title> (see docs/test-cases.md) |
| webkit | NEG-01c 404 page has a document title @regression @known-issue | known-issue | OBS-07: 404 page renders with an empty <title> (see docs/test-cases.md) |
| chromium | NEG-04b market data aborted: page survives without crashing @regression | observation | OBS-09: widget aborted: price table removed with no error/empty state; 4 silent retries in 8s |
| chromium | NEG-04b market data malformed JSON: page survives without crashing @regression | observation | OBS-09: widget malformed JSON: price table removed with no error/empty state; 4 silent retries in 8s |
| chromium | NEG-04b market data HTTP 500: page survives without crashing @regression @known-issue | known-issue | OBS-10: a 500 from market/widget replaces the whole Explore page with an error screen (see docs/test-cases.md) |
| webkit | NEG-04b market data HTTP 500: page survives without crashing @regression @known-issue | known-issue | OBS-10: a 500 from market/widget replaces the whole Explore page with an error screen (see docs/test-cases.md) |
| chromium | SPT-04 Gainers and Losers are ranked by 24h change @regression @known-issue | observation | OBS-06: Gainers/Losers are not strictly sorted by the displayed 24h change |
| webkit | SPT-04 Gainers and Losers are ranked by 24h change @regression @known-issue | observation | OBS-06: Gainers/Losers are not strictly sorted by the displayed 24h change |
| chromium | SPT-06 coin detail page responds with HTTP 200 @regression @known-issue | known-issue | OBS-02: coin pages render but respond with HTTP 500 (see docs/test-cases.md) |
| webkit | SPT-06 coin detail page responds with HTTP 200 @regression @known-issue | known-issue | OBS-02: coin pages render but respond with HTTP 500 (see docs/test-cases.md) |
| mobile-chrome | SPT-07 coin detail page has no untranslated i18n keys @mobile @known-issue | known-issue | OBS-08: raw key "common:sign-up-login" rendered as a button label (see docs/test-cases.md) |
| mobile-safari | SPT-07 coin detail page has no untranslated i18n keys @mobile @known-issue | known-issue | OBS-08: raw key "common:sign-up-login" rendered as a button label (see docs/test-cases.md) |
| api | API-02 prices are positive and fresh for every widget pair | observation | OBS-11: prices older than 5 min: MBG (41 min), TRX (8 min) |
