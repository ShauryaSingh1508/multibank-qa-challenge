# Release readiness checklist – mobile trading app v1.0

Use this checklist for the go/no-go meeting. Every item is **Yes**, **No** or **N/A with a named owner accepting the risk**. Items marked ⛔ are blockers: a "No" on any of them means no release.

## 1. Quality gates

- [ ] ⛔ Zero open P0 (money/security/compliance) defects; every open P1 has a documented workaround and an owner-approved waiver
- [ ] ⛔ Smoke and core regression pass on the **release-candidate build** (not a dev build) on iOS and Android
- [ ] ⛔ All Critical risks in the [risk matrix](risk-matrix.md) tested, with evidence linked
- [ ] API/contract suite green against staging, using the same backend version that is going to production
- [ ] Device matrix run (top devices/OS versions by target market share); crash-free sessions ≥ 99.5% in beta
- [ ] Exploratory charters completed for every feature changed since the last full pass
- [ ] No flaky tests hidden by retries in the release run (retries reviewed)

## 2. Money correctness

- [ ] ⛔ Buy/sell (market and limit, partial fill, cancel) verified end to end with sandbox liquidity
- [ ] ⛔ Deposit → trade → withdraw round trip reconciles to the cent/satoshi, including fees
- [ ] ⛔ Idempotency verified: double-tap, retry after timeout and app-kill mid-submit create exactly one order/withdrawal
- [ ] ⛔ Reconciliation job (ledger vs balances vs provider) running with alerting
- [ ] Precision and rounding verified for every supported asset (min size, max size, decimals)
- [ ] Quote expiry / slippage protection verified when the price moves between quote and confirm

## 3. Security and compliance

- [ ] ⛔ Penetration test or security review completed; no open high/critical findings
- [ ] ⛔ 2FA enforced on login and withdrawal; session timeout and device change behave as specified
- [ ] ⛔ KYC gating: unverified users cannot deposit, trade or withdraw beyond the allowed limits
- [ ] ⛔ Geo-restrictions enforced for blocked jurisdictions
- [ ] Sensitive data not stored in plain text on the device; screenshots blocked on sensitive screens (if required)
- [ ] Legal copy (risk warnings, T&Cs, privacy policy) approved by compliance for each launch region

## 4. Operational readiness

- [ ] ⛔ Staged rollout configured (e.g. 5% → 25% → 100%) with crash and error thresholds for halting
- [ ] ⛔ Server-side kill switches for trading, deposits and withdrawals tested in staging
- [ ] ⛔ Rollback/hotfix path rehearsed (backend rollback; app fix via expedited review; forced-update mechanism works)
- [ ] Monitoring dashboards and alerts live: API error rate and latency, order failure rate, price-feed freshness, payment-provider errors, crash rate
- [ ] On-call rota for launch week (engineering, ops, QA), with an escalation path to compliance
- [ ] Load test at ≥ 3× expected peak on login, price and order endpoints
- [ ] Third-party limits confirmed (KYC, payments, SMS/OTP, push)

## 5. Store and product

- [ ] Store listings, screenshots, age rating and crypto-policy declarations approved (App Store and Google Play)
- [ ] Release notes written; support team briefed, with an FAQ and known issues list
- [ ] Analytics events verified for key funnel steps (sign-up, KYC, first deposit, first trade)
- [ ] Accessibility pass on core journeys (VoiceOver/TalkBack, dynamic type)
- [ ] Localisation verified for every launch language (and RTL if applicable)

## 6. Sign-off

| Role                 | Name | Decision (Go / No-go) | Date | Notes |
| -------------------- | ---- | --------------------- | ---- | ----- |
| QA                   |      |                       |      |       |
| Engineering lead     |      |                       |      |       |
| Product owner        |      |                       |      |       |
| Security             |      |                       |      |       |
| Compliance           |      |                       |      |       |
| Operations / on-call |      |                       |      |       |

**Accepted risks** (list each with its risk-matrix id, owner and review date):

1. …
