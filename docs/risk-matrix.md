# Risk matrix

Scoring: **Likelihood** (L) and **Impact** (I) are each rated 1–5. **Score = L × I**.
Impact is weighted towards money, security and compliance: anything that can lose or misreport user funds starts at 4.

| Score | Level    | Response                                                            |
| ----- | -------- | ------------------------------------------------------------------- |
| 15–25 | Critical | Must be tested and mitigated before release; a go/no-go item        |
| 8–14  | High     | Tested before release; residual risk explicitly accepted by product |
| 4–7   | Medium   | Covered by regression; monitored after release                      |
| 1–3   | Low      | Sampled / exploratory                                               |

## Part A – Mobile trading app release (Task 2)

| #   | Risk                                                                          | L   | I   | Score | Level    | Mitigation / test approach                                                                                      | Owner         |
| --- | ----------------------------------------------------------------------------- | --- | --- | ----- | -------- | --------------------------------------------------------------------------------------------------------------- | ------------- |
| R1  | Duplicate order or withdrawal on retry / double-tap (no idempotency)          | 4   | 5   | 20    | Critical | Idempotency keys; API tests that replay requests; chaos tests (network drop after submit); reconciliation alert | Backend + QA  |
| R2  | Balance or P&L shown incorrectly (rounding, precision, fees)                  | 3   | 5   | 15    | Critical | Ledger API tests with boundary values (8-dp, min size, fee tiers); client vs server value comparison            | Backend + QA  |
| R3  | Stale or wrong price shown at order confirmation                              | 3   | 5   | 15    | Critical | Quote expiry and slippage tests; "last updated" freshness check; feed-failure fault injection                   | Trading + QA  |
| R4  | Account takeover (session handling, missing 2FA on withdrawal)                | 3   | 5   | 15    | Critical | Security review/pentest; 2FA and session-expiry test cases; withdrawal allowlist and cool-down                  | Security      |
| R5  | Withdrawal debited but not sent (or sent twice)                               | 2   | 5   | 10    | High     | State-machine tests for each withdrawal status; reconciliation job; manual approval above a threshold at launch | Backend + Ops |
| R6  | Payment / KYC provider outage or rate limits on launch day                    | 3   | 4   | 12    | High     | Sandbox failure simulations; clear user messaging; provider limits confirmed; status page                       | Product + Ops |
| R7  | Crash on a common device/OS (older Android, small iPhone)                     | 3   | 4   | 12    | High     | Device-farm matrix by market share; crash-free-rate gate in staged rollout                                      | Mobile + QA   |
| R8  | App killed / backgrounded mid-transaction (3-D Secure, app switch)            | 3   | 4   | 12    | High     | Interruption test charter on both platforms; server is the source of truth for the final state                  | Mobile + QA   |
| R9  | Regression from late "ship fast" changes with no regression suite             | 4   | 3   | 12    | High     | Code freeze on non-critical work; smoke + API regression on every release-candidate build; feature flags        | Eng lead      |
| R10 | Regulatory / geo non-compliance (KYC gating, restricted regions, disclaimers) | 2   | 5   | 10    | High     | Compliance sign-off; geo-IP and document-country test cases                                                     | Compliance    |
| R11 | Launch-day load degrades order placement                                      | 2   | 4   | 8     | High     | Load test of order and price APIs at expected peak × 3; autoscaling; rate limits                                | Platform      |
| R12 | App store rejection / review delay                                            | 2   | 3   | 6     | Medium   | Pre-check against store guidelines (crypto policies); submit early; phased release                              | Mobile        |
| R13 | Push notifications wrong or missing (fills, price alerts)                     | 3   | 2   | 6     | Medium   | Notification test cases per event type; opt-in flows                                                            | Mobile + QA   |
| R14 | Localisation / RTL layout issues                                              | 3   | 2   | 6     | Medium   | Pseudo-localisation; RTL pass if Arabic is supported                                                            | Mobile        |
| R15 | Accessibility gaps (screen readers, font scaling)                             | 3   | 2   | 6     | Medium   | VoiceOver/TalkBack pass on core journeys; dynamic type                                                          | QA            |
| R16 | Cosmetic UI inconsistencies                                                   | 4   | 1   | 4     | Medium   | Visual review; fix after launch                                                                                 | Design        |

### Heat map (Part A)

|         | Impact 1 | Impact 2      | Impact 3 | Impact 4   | Impact 5   |
| ------- | -------- | ------------- | -------- | ---------- | ---------- |
| **L 4** | R16      |               | R9       |            | R1         |
| **L 3** |          | R13, R14, R15 |          | R6, R7, R8 | R2, R3, R4 |
| **L 2** |          |               | R12      | R11        | R5, R10    |

## Part B – mb.io public web (risks found while building Task 1)

| #   | Risk                                                                           | L   | I   | Score | Level    | Evidence / coverage |
| --- | ------------------------------------------------------------------------------ | --- | --- | ----- | -------- | ------------------- |
| W1  | One market-data 500 takes down the whole Explore page                          | 3   | 4   | 12    | High     | OBS-10 · NEG-04b    |
| W2  | Coin pages return HTTP 500 (SEO de-indexing, CDN/uptime noise)                 | 5   | 3   | 15    | Critical | OBS-02 · SPT-06     |
| W3  | Price table silently disappears on network/data error; infinite silent retries | 3   | 3   | 9     | High     | OBS-09 · NEG-04b    |
| W4  | Desktop Safari "Download the app" ends on an App Store 404 (lost installs)     | 4   | 2   | 8     | High     | OBS-05 · APP-03b    |
| W5  | Price ticks minutes old with no "last updated" indicator                       | 3   | 3   | 9     | High     | OBS-11 · API-02     |
| W6  | Raw i18n key on mobile coin page CTA                                           | 5   | 1   | 5     | Medium   | OBS-08 · SPT-07     |
| W7  | Gainers/Losers ranking unclear (not sorted by displayed change)                | 4   | 1   | 4     | Medium   | OBS-06 · SPT-04     |
| W8  | Empty `<title>` on 404                                                         | 5   | 1   | 5     | Medium   | OBS-07 · NEG-01c    |
