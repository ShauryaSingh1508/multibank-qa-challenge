# Release checklist: mobile trading app v1.0

This is the list I'd bring to the go/no-go meeting. Go through it item by item and answer each one with Yes, No, or N/A. An N/A only counts if someone is named as owning the risk of skipping it.

Some items are marked ⛔. Those are blockers: if any of them is a No, we don't ship, no matter how good the rest looks.

## 1. Testing and quality

- [ ] ⛔ There are no open P0 bugs (anything touching money, security or compliance). Every open P1 has a workaround written down and a waiver signed off by its owner.
- [ ] ⛔ Smoke and core regression tests pass on the actual release-candidate build, not a dev build, on both iOS and Android.
- [ ] ⛔ Every Critical risk in the [risk matrix](risk-matrix.md) has been tested, and the evidence is linked.
- [ ] The API and contract tests pass against staging, running the same backend version we're about to put in production.
- [ ] We've run the app on the most popular devices and OS versions in our target markets, and beta shows at least 99.5% crash-free sessions.
- [ ] Every feature that changed since the last full test pass has had an exploratory testing session.
- [ ] Someone has looked at the retries in the release run, so a flaky test can't sneak through just because it passed on its second try.

## 2. Getting the money right

- [ ] ⛔ Buying and selling work end to end with sandbox liquidity. That means market and limit orders, partial fills and cancellations.
- [ ] ⛔ A full deposit, trade and withdrawal adds up exactly, to the cent (or satoshi), fees included.
- [ ] ⛔ Doing the same thing twice by accident only creates one order or withdrawal. This covers a double-tap, a retry after a timeout, and the app being killed halfway through submitting.
- [ ] ⛔ The reconciliation job is running and alerting. It compares our ledger, user balances and the payment provider's records.
- [ ] Rounding and precision are correct for every asset we support: minimum size, maximum size and number of decimals.
- [ ] If the price moves between showing a quote and the user confirming, quote expiry and slippage protection kick in as expected.

## 3. Security and compliance

- [ ] ⛔ A penetration test or security review is done, with no high or critical findings still open.
- [ ] ⛔ 2FA is required for login and for withdrawals. Session timeouts and logging in on a new device behave the way the spec says.
- [ ] ⛔ Users who haven't passed KYC can't deposit, trade or withdraw beyond the limits they're allowed.
- [ ] ⛔ Users in blocked countries can't use the app.
- [ ] Sensitive data isn't stored in plain text on the phone. If required, screenshots are blocked on sensitive screens.
- [ ] Compliance has approved the legal text (risk warnings, terms and privacy policy) for every region we're launching in.

## 4. Launch operations

- [ ] ⛔ The rollout is staged (for example 5%, then 25%, then 100%), with crash and error limits that pause it automatically.
- [ ] ⛔ We can switch off trading, deposits and withdrawals from the server, and we've tested this in staging.
- [ ] ⛔ We've practised rolling back and hotfixing: rolling back the backend, getting an app fix through expedited store review, and forcing users onto a new version.
- [ ] Dashboards and alerts are live for API errors and latency, failed orders, how fresh prices are, payment provider errors and the crash rate.
- [ ] There's an on-call rota for launch week covering engineering, ops and QA, with a clear way to escalate to compliance.
- [ ] Login, price and order endpoints have been load tested at three times the peak traffic we expect, or more.
- [ ] We've confirmed the usage limits for our third-party providers (KYC, payments, SMS/OTP and push notifications).

## 5. App stores and product

- [ ] Both stores (App Store and Google Play) have approved the listing, screenshots, age rating and crypto policy declarations.
- [ ] Release notes are written, and the support team has been briefed and given an FAQ plus a list of known issues.
- [ ] Analytics events fire correctly at each key step: sign-up, KYC, first deposit and first trade.
- [ ] The main journeys have had an accessibility check with VoiceOver/TalkBack and large text sizes.
- [ ] Translations are checked for every launch language, including right-to-left layouts if we support any RTL languages.

## 6. Sign-off

Each person below gives a Go or No-go. If anyone says No-go, add the reason in the notes.

| Role                 | Name | Decision (Go / No-go) | Date | Notes |
| -------------------- | ---- | --------------------- | ---- | ----- |
| QA                   |      |                       |      |       |
| Engineering lead     |      |                       |      |       |
| Product owner        |      |                       |      |       |
| Security             |      |                       |      |       |
| Compliance           |      |                       |      |       |
| Operations / on-call |      |                       |      |       |
