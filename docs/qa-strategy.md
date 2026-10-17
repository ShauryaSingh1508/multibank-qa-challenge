# Task 2 – QA strategy and thinking

**Scenario:** day one as the first QA engineer at a fintech startup. An iOS and Android trading app goes public in two weeks. There is no test suite, no QA documentation, the team has been shipping fast, and real user funds are involved.

Related documents: [risk matrix](risk-matrix.md) · [release readiness checklist](release-checklist.md)

---

## 1. Where do you start?

I don't start by writing automation. With two weeks left, any test code written now protects the release after this one, not this one. The first job is to find out where the money can go wrong, and to make that visible to the people deciding whether to ship.

**Days 1–2: understand and map risk**

- Talk to engineering, product, compliance and support (if needed to understand the flows). I ask each the same three questions: what worries you, what has broken before, and is there anything not tested yet?
- Map every flow that moves or shows money: sign-up and KYC, deposit (card and bank), buy/sell (market and limit), the order book and portfolio balance, withdrawal, and transaction history. Then add the flows that protect it: login, 2FA, session timeout, device change, password reset.
- Read the architecture at a whiteboard level: which numbers are calculated on the client and which on the server, where prices come from, how orders reach the matching engine or liquidity provider, and what happens when a call times out halfway.
- Check what already exists: unit tests, staging data, feature flags, crash reporting, logs, monitoring, and the ability to roll back or turn a feature off.

**Days 2–3: produce a short, honest artefact**

A one-page risk matrix (likelihood × impact, with impact weighted heavily by money and compliance). It ends with a clear list: "these 10 things must be verified before launch; these are known gaps we are accepting." That list is what I bring to the go/no-go conversation.

**Days 3–10: test the critical paths by hand, then start the safety net**

Structured exploratory testing of the top risks on real iOS and Android devices, against a staging environment with a sandbox payment provider and test liquidity. In parallel I set up the minimum process: a bug template, severity definitions tied to money impact, and a triage slot every day.

**Days 10–14: release readiness**

Run the release checklist, complete a full regression pass on the release candidate build, and agree on the go/no-go criteria and the rollback plan.

## 2. How would you approach testing this app?

Risk-based, layered, and focused on correctness of money over cosmetic polish.

**Prioritisation:** P0 = can lose, duplicate or misreport money, or breaks regulation. P1 = blocks a core journey. P2 = degraded experience. P3 = cosmetic. P0 and P1 get exhaustive coverage before launch; P2 and P3 get sampled.

**What I'd test, and how**

| Layer                      | Focus                                                                                                                                                                                                                                              |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ledger / money correctness | Balance = deposits − withdrawals ± fills − fees, every time. Rounding and precision (8-dp crypto vs 2-dp fiat). Fee calculation. No negative balances. Idempotency (a double-tap or retried request must not place two orders or two withdrawals). |
| Order lifecycle            | Market/limit, partial fills, cancel, cancel-after-fill race, insufficient funds, min/max size, price moving between quote and confirm (slippage and quote expiry).                                                                                 |
| Resilience                 | Network drop mid-order, app killed mid-transaction, backgrounding during 3-D Secure, slow or stale price feed, server 5xx. The user must always end up with a clear final state and never "maybe placed".                                          |
| Security & auth            | Session expiry, 2FA, jailbreak/root handling, screenshots of sensitive screens, deep-link abuse, insecure storage of tokens, IDOR on account and order IDs (with the security team or a pentest).                                                  |
| Platform & device          | A matrix of the top devices and OS versions by market share in the target regions (both OSs, small screens, older Android). Dark mode, font scaling, notch/safe area, RTL if Arabic is supported.                                                  |
| Compliance & content       | KYC gating, geo-restrictions, risk disclaimers, terms acceptance, correct regulatory wording per region.                                                                                                                                           |
| Observability              | Crashes and errors are actually reported (Crashlytics/Sentry), and support can trace a user's transaction.                                                                                                                                         |

**Automation strategy** (built from week 1, owned jointly with other QA team)

- API tests first: most money logic lives server-side, and API tests are fast, stable and cover the ledger rules. This is where I get the most protection per hour.
- Contract tests between app and backend so a renamed field can't silently produce a `NaN` balance.
- A thin layer of mobile E2E (Maestro or Appium/Detox) for the few journeys that must never break: sign up, deposit, buy, sell, withdraw. Kept small, because E2E suites that try to cover everything become slow and flaky.
- Unit tests stay with developers. I review coverage on money-related code.

## 3. What does QA look like inside a sprint?

QA acts as a continuous activity across the sprint, it's not a phase at the end of it.

| Stage                             | What QA does                                                                                                                                                                                                                       |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backlog refinement                | Challenge the ticket: what are the acceptance criteria, what does failure look like, what about edge cases (zero, max, network loss, concurrent action)? Flag the money/compliance impact. Size the testing effort with the story. |
| Ticket "ready"                    | Acceptance criteria are written as testable examples (Given/When/Then). Test data and environment needs are known. Any feature flag is defined.                                                                                    |
| During development                | Pair with the developer on the test approach. They write the unit tests; we agree which API/E2E checks are added. QA prepares test data and starts the exploratory charter.                                                        |
| Pull request                      | CI runs unit, API and smoke tests. QA reviews the test changes for money-related PRs. Nothing merges red.                                                                                                                          |
| Ready for test (staging)          | Verify the acceptance criteria, then exploratory testing around them (time-boxed charter), on both platforms. Bugs are logged with steps, expected/actual result, build, device, logs and severity.                                |
| Done                              | Acceptance criteria verified, automated checks merged, no open P0/P1, docs/release notes updated, behind a flag if risky.                                                                                                          |
| End of sprint / release candidate | Full regression on the release candidate build (automated + targeted manual), release checklist, go/no-go with product and engineering.                                                                                            |
| After release                     | Monitor crash-free rate, error rates and support tickets for 24–48 h. Every escaped bug gets a regression test and a short "why did we miss it?"                                                                                   |

## 4. What does your ideal regression suite look like?

- **Pyramid-shaped:** many unit tests, a solid API/contract layer, and a small, reliable set of end-to-end journeys. Most regression value comes from the API layer.
- **Tiered by speed:**
  - Smoke (< 5 min, every PR): app launches, login, prices load, buy flow up to confirm, balance renders.
  - Core regression (< 30 min, every merge to main and every release candidate): all P0/P1 journeys on one iOS and one Android device, plus the full API suite.
  - Extended (nightly): device/OS matrix on a device farm, localisation, accessibility, visual checks, resilience scenarios.
- **Deterministic:** owned test data (seeded accounts, sandbox payments, mocked or controllable prices), independent tests, no sleeps. A flaky test is quarantined and fixed, never left to "just re-run".
- **Risk-traceable:** every test maps to a risk or requirement, and every escaped bug adds a test. Tests that have never caught anything and cost time get retired.
- **Readable results:** one report for both platforms, traces/videos on failure, and failures routed to the owning team.
- **Paired with manual exploratory testing** each release on what changed. Automation confirms what we know; exploration finds what we don't.

**Non-functional tests are part of the suite too.** A trading app can be functionally correct and still fail on launch day because it's slow, falls over under traffic, or behaves badly on a weak connection. I'd cover three areas:

- **Load and high traffic with k6.** I'd write k6 scripts for the endpoints that matter most on a busy day: login, price feed (including the WebSocket stream), order placement, portfolio balance and withdrawal requests. I'd run them against staging, never production, using these test types:
  - Load: expected peak traffic, to check we meet normal targets.
  - Stress: around 3× peak, to find where things start to break.
  - Spike: a sudden jump in traffic, like a launch push notification or a big market move.
  - Soak: a few hours of steady traffic, to catch memory leaks and connection-pool exhaustion.

  Each script has k6 `thresholds` (for example p95 order placement under 500 ms and error rate under 0.1%), so a slow build fails the run instead of someone having to read a graph. A short load test runs nightly in CI. The full stress, spike and soak runs happen before every release and after any big backend change. Under load I also check that money logic still holds: no duplicate orders, and balances still reconcile.

- **Network failure testing.** I'd test on bad networks on purpose, not just office Wi-Fi:
  - Throttled 3G, high latency and packet loss, using network link conditioners on devices and a proxy like Charles or Proxyman.
  - Losing the connection completely mid-order, and switching between Wi-Fi and mobile data.
  - Backend dependencies timing out or returning 5xx, simulated with a tool like Toxiproxy in staging.

  The pass criteria are always the same: the user sees a clear final state, retries don't create duplicate orders or withdrawals, and stale prices are labelled instead of shown as live.

The Task 1 framework in this repo is a small-scale example of these principles: page objects, data-driven tests, API-backed assertions, fault injection, tags for tiers, and a CI matrix.

## 5. What would keep you up at night?

1. **Money correctness under failure.** A buy that times out on the client but succeeds on the server, the user taps again, and now they own twice the position. Or a withdrawal that is debited but never sent. Idempotency and reconciliation are what I would test hardest, and what I would most want monitored in production.
2. **Stale or wrong prices.** If a quote shown to the user is stale while the market moves, users trade on bad information. That is a financial loss and a regulatory problem. (Task 1 already found a feed failure that blanks a whole page and price ticks that are many minutes old, so this is a real risk.)
3. **Security of accounts and funds.** Account takeover via weak session handling, missing 2FA on withdrawal, or exposed tokens. One incident here ends trust in a new exchange.
4. **"Shipping fast" with no safety net.** No regression suite means any fix in the last two weeks can break something we tested last week. I'd push for a code freeze on non-critical changes in the final days, and feature flags for anything risky.
5. **Day-one load and third-party dependencies.** Launch traffic, KYC provider limits, payment provider outages, app store review delays. Each needs a fallback and a status message, not a spinner.
6. **No way to see or undo problems.** If we can't detect a problem (monitoring/alerts) or stop it (kill switch, rollback, staged rollout), a small bug becomes a large one. I'd treat staged rollout (e.g. 5% → 25% → 100%), a server-side kill switch for trading and withdrawals, and on-call cover as launch blockers.

If I could only get one thing agreed before launch, it would be a reconciliation check that compares user balances against the ledger and alerts on any mismatch. Testing reduces risk; reconciliation tells you when testing missed something.
