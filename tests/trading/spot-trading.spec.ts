import { test, expect } from '../../fixtures/test';
import { MarketEndpoints } from '../../api/MarketApi';
import type { PriceTick, WidgetCategory } from '../../api/types';
import { JsonRecorder, waitForJson } from '../../utils/network';
import { isSorted, parsePercent, parsePrice, percentDiff } from '../../utils/format';
import { knownIssue, observation } from '../../utils/known-issue';
import trading from '../../data/trading-categories.json';

const formats = {
  symbol: new RegExp(trading.formats.symbol),
  price: new RegExp(trading.formats.price),
  change: new RegExp(trading.formats.change),
};

test.describe('Trading - spot market', () => {
  /**
   * The category data the page itself fetched. The page requests it more than once (hydration +
   * refresh), so the most recent body is what the table shows.
   */
  let widgetRecorder: JsonRecorder<WidgetCategory[]>;
  const widget = () => widgetRecorder.latest!;
  const categoryItems = (id: string) => widget().find((c) => c.id === id)!.items;

  test.beforeEach(async ({ spotTradingPage, page }) => {
    widgetRecorder = new JsonRecorder(page, MarketEndpoints.widget);
    await spotTradingPage.open();
    await spotTradingPage.waitForRows();
    await expect.poll(() => widgetRecorder.count, { message: 'widget API was called' }).toBeGreaterThan(0);
  });

  test('SPT-01 spot market section renders and lists trading pairs @smoke', async ({ spotTradingPage }) => {
    await expect(spotTradingPage.spotSection).toBeVisible();
    await expect(spotTradingPage.tableHeading).toBeVisible();
    await expect(spotTradingPage.table).toBeVisible();
    expect(await spotTradingPage.rows.count()).toBeGreaterThanOrEqual(trading.minRowsPerCategory);
  });

  test('SPT-02 trading pairs are grouped into Hot, Gainers and Losers @regression', async ({
    spotTradingPage,
  }) => {
    // The tab set the UI offers must match the categories the API serves.
    expect(widget().map((c) => c.id)).toEqual(trading.categories.map((c) => c.id));

    const rendered: Record<string, string[]> = {};
    for (const category of trading.categories) {
      await test.step(`${category.label} tab shows the ${category.id} category`, async () => {
        await expect(spotTradingPage.categoryTab(category.label)).toBeVisible();
        await spotTradingPage.selectCategory(category.label);

        // Rows re-render after the click; poll until the table shows this category's list (in API order).
        await expect
          .poll(
            async () => {
              const symbols = await spotTradingPage.visibleSymbols();
              const expected = categoryItems(category.id);
              return (
                symbols.length >= trading.minRowsPerCategory && symbols.every((s, i) => s === expected[i])
              );
            },
            { message: `rows should match the "${category.id}" list from the API` },
          )
          .toBe(true);
        rendered[category.id] = await spotTradingPage.visibleSymbols();
      });
    }

    // Grouping is meaningful only if the categories actually differ.
    expect(rendered.gainers).not.toEqual(rendered.losers);
    expect(rendered.gainers[0]).not.toBe(rendered.losers[0]);
  });

  test('SPT-03 every trading pair row contains the expected data fields @regression', async ({
    spotTradingPage,
  }) => {
    for (const category of trading.categories) {
      await test.step(`${category.label} rows`, async () => {
        await spotTradingPage.selectCategory(category.label);
        await spotTradingPage.waitForRowsSettled(categoryItems(category.id)[0]);
        const rows = await spotTradingPage.readRows();
        expect(rows.length).toBeGreaterThanOrEqual(trading.minRowsPerCategory);

        for (const row of rows) {
          const where = `${category.label} > ${row.symbol || '(blank)'}`;
          expect.soft(row.symbol, `${where}: symbol`).toMatch(formats.symbol);
          expect.soft(row.name, `${where}: name`).not.toBe('');
          expect.soft(row.iconAlt, `${where}: icon alt`).toBe(row.symbol);
          expect.soft(row.iconLoaded, `${where}: icon loaded`).toBe(true);
          expect.soft(row.price, `${where}: price format`).toMatch(formats.price);
          expect.soft(row.change, `${where}: 24h change format`).toMatch(formats.change);
          expect.soft(row.direction, `${where}: change direction`).not.toBe('unknown');
          expect.soft(row.hasChart, `${where}: sparkline`).toBe(true);
          expect.soft(row.href, `${where}: detail link`).toMatch(new RegExp(`/explore/${row.symbol}$`));
        }
        expect(new Set(rows.map((r) => r.symbol)).size, 'no duplicate pairs in a category').toBe(rows.length);
      });
    }
  });

  test('SPT-03b displayed prices agree with the market data feed @regression', async ({
    spotTradingPage,
    page,
  }) => {
    // Re-load with the prices response captured, then compare the table to the feed it was built from.
    const pricesResponse = waitForJson<PriceTick[]>(page, `${MarketEndpoints.prices}?quote=USD`);
    await spotTradingPage.open();
    const prices = await pricesResponse;
    await spotTradingPage.waitForRows();

    const rows = await spotTradingPage.readRows();
    const checked: string[] = [];
    for (const row of rows) {
      const tick = prices.find((p) => p.base === row.symbol);
      if (!tick || tick.close < 1) continue; // sub-dollar prices are rounded to 2dp in the UI
      // Tolerance absorbs live ticks that arrive between the API call and the read.
      expect
        .soft(percentDiff(parsePrice(row.price), tick.close), `${row.symbol} price vs feed`)
        .toBeLessThan(trading.priceTolerancePercent);
      checked.push(row.symbol);
    }
    expect(checked.length, 'at least a few pairs could be cross-checked').toBeGreaterThanOrEqual(3);
  });

  test('SPT-04 Gainers and Losers are ranked by 24h change @regression @known-issue', async ({
    spotTradingPage,
  }, testInfo) => {
    const signed = async (id: string, label: string) => {
      await spotTradingPage.selectCategory(label);
      await expect.poll(async () => (await spotTradingPage.visibleSymbols())[0]).toBe(categoryItems(id)[0]);
      return (await spotTradingPage.readRows()).map(
        (r) => (r.direction === 'down' ? -1 : 1) * parsePercent(r.change),
      );
    };

    const gainers = await signed('gainers', 'Gainers');
    const losers = await signed('losers', 'Losers');
    await testInfo.attach('ranking', {
      body: JSON.stringify({ gainers, losers }, null, 2),
      contentType: 'application/json',
    });

    // Hard rule regardless of the intended ranking: the top gainer must out-perform the top loser.
    expect(gainers[0]).toBeGreaterThan(losers[0]);

    // Strict ordering is pending a product decision (OBS-06), so it is recorded, not failed.
    if (!isSorted(gainers, 'desc') || !isSorted(losers, 'asc')) {
      observation(testInfo, 'OBS-06', 'Gainers/Losers are not strictly sorted by the displayed 24h change');
    }
  });

  test('SPT-05 a pair row opens its coin detail page @regression', async ({
    spotTradingPage,
    coinDetailPage,
    page,
  }) => {
    const symbol = trading.sampleCoin;
    await spotTradingPage.rowFor(symbol).getByRole('link').click();

    await expect(page).toHaveURL(new RegExp(`/explore/${symbol}$`));
    await coinDetailPage.waitUntilReady();
    await expect(coinDetailPage.price).toHaveText(/^[\d,]+\.\d{2,}$/);
    await expect(coinDetailPage.tradeButton).toHaveAttribute('href', /trade\.mb\.io/);
    await expect(coinDetailPage.chartTimeframes).toHaveCount(6);
    await expect(coinDetailPage.similarAssetsHeading).toBeVisible();
  });
});

test.describe('Trading - coin detail page health', () => {
  test('SPT-06 coin detail page responds with HTTP 200 @regression @known-issue', async ({
    coinDetailPage,
  }, testInfo) => {
    knownIssue(testInfo, 'OBS-02', 'coin pages render but respond with HTTP 500');
    const response = await coinDetailPage.forSymbol(trading.sampleCoin).open();
    expect(response?.status()).toBe(200);
  });

  // The raw key sits in the mobile sticky CTA bar, which is hidden at desktop widths.
  test('SPT-07 coin detail page has no untranslated i18n keys @mobile @known-issue', async ({
    coinDetailPage,
    page,
  }, testInfo) => {
    knownIssue(testInfo, 'OBS-08', 'raw key "common:sign-up-login" rendered as a button label');
    await coinDetailPage.forSymbol(trading.sampleCoin).open();
    await expect(page.locator('body')).not.toContainText(/\b[a-z]+:[a-z]+(-[a-z]+)+\b/, {
      useInnerText: true,
    });
  });
});
