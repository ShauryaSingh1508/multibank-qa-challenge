import { test, expect } from '../../fixtures/test';
import { MarketEndpoints } from '../../api/MarketApi';
import { knownIssue, observation } from '../../utils/known-issue';

/**
 * Network failure modes for the market data the Explore page depends on, simulated with route
 * interception so they are reproducible. The contract under test: the page shell keeps working
 * and never shows garbage values (NaN, undefined, $0.00) when data is slow or missing.
 */
/** How long to keep watching for a late crash after the failed request; HTTP 500 crashes in ~2-3s. */
const CRASH_WINDOW_MS = 8_000;
const GARBAGE = /\bNaN\b|\bundefined\b|\bnull\b|\$0\.00\b|Infinity/;

test.describe('Negative - content loading failure handling', () => {
  test('NEG-04a slow market data still renders the table once it arrives @regression', async ({
    page,
    spotTradingPage,
  }) => {
    await page.route(`**${MarketEndpoints.widget}*`, async (route) => {
      await new Promise((r) => setTimeout(r, 5_000));
      await route.continue();
    });
    await spotTradingPage.open();
    // The shell is usable before data lands.
    await expect(spotTradingPage.heading).toBeVisible();
    await expect(spotTradingPage.header.mainNav).toBeVisible();
    // Then the delayed data renders correctly.
    await expect(spotTradingPage.rows.first()).toBeVisible({ timeout: 20_000 });
    await expect(spotTradingPage.spotSection).not.toContainText(GARBAGE);
  });

  for (const failure of [
    { name: 'aborted', fulfil: null, knownIssue: null },
    { name: 'malformed JSON', fulfil: { status: 200, body: '{"items": [' }, knownIssue: null },
    {
      name: 'HTTP 500',
      fulfil: { status: 500, body: '{"error":"internal"}' },
      knownIssue: {
        id: 'OBS-10',
        summary: 'a 500 from market/widget replaces the whole Explore page with an error screen',
      },
    },
  ]) {
    test(`NEG-04b market data ${failure.name}: page survives without crashing @regression${
      failure.knownIssue ? ' @known-issue' : ''
    }`, async ({ page, spotTradingPage }, testInfo) => {
      if (failure.knownIssue) knownIssue(testInfo, failure.knownIssue.id, failure.knownIssue.summary);

      let hits = 0;
      const firstHit = new Promise<void>((resolve) =>
        page.route(`**${MarketEndpoints.widget}*`, (route) => {
          hits++;
          resolve();
          return failure.fulfil
            ? route.fulfill({ ...failure.fulfil, contentType: 'application/json' })
            : route.abort();
        }),
      );
      await spotTradingPage.open();
      await firstHit;

      // The app fails late (after its own error handling runs), so watch a bounded window for the
      // crash screen rather than asserting once immediately.
      const crashed = await spotTradingPage.errorScreen
        .waitFor({ state: 'visible', timeout: CRASH_WINDOW_MS })
        .then(() => true)
        .catch(() => false);
      expect(crashed, 'page fell over to the global error screen').toBe(false);

      await expect(spotTradingPage.heading).toBeVisible();
      await expect(spotTradingPage.spotSection).toBeVisible();
      await expect(spotTradingPage.spotSection).not.toContainText(GARBAGE);

      if ((await spotTradingPage.rows.count()) === 0) {
        observation(
          testInfo,
          'OBS-09',
          `widget ${failure.name}: price table removed with no error/empty state; ${hits} silent retries in ${CRASH_WINDOW_MS / 1000}s`,
        );
      }
    });
  }

  test('NEG-04c prices feed failure does not show NaN or zero prices @regression', async ({
    page,
    spotTradingPage,
  }) => {
    await page.route(`**${MarketEndpoints.prices}*`, (route) => route.abort());
    await spotTradingPage.open();
    await expect(spotTradingPage.heading).toBeVisible();
    await expect(spotTradingPage.spotSection).not.toContainText(GARBAGE);
  });
});
