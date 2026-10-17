import { test, expect } from '../../fixtures/api';
import { observation } from '../../utils/known-issue';
import trading from '../../data/trading-categories.json';

const MAX_PRICE_AGE_SEC = 60 * 60;
const STALE_PRICE_AGE_SEC = 5 * 60;

/** Contract checks on the public market-data endpoints the Explore page is built from. */
test.describe('API - market data @api', () => {
  test('API-01a widget returns the Hot / Gainers / Losers categories', async ({ marketApi }) => {
    const res = await marketApi.widget();
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('application/json');

    const categories = await res.json();
    expect(categories.map((c: { id: string }) => c.id)).toEqual(trading.categories.map((c) => c.id));
    for (const c of categories) {
      expect(c, `category ${c.id}`).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        items: expect.any(Array),
        highlighted: expect.any(Array),
      });
      expect(c.items.length).toBeGreaterThanOrEqual(trading.minRowsPerCategory);
      expect(new Set(c.items).size, `${c.id} has no duplicates`).toBe(c.items.length);
    }
  });

  test('API-01b every widget symbol is a known, tradeable instrument', async ({ marketApi }) => {
    const [widget, instruments] = await Promise.all([marketApi.widgetJson(), marketApi.instrumentsJson()]);
    const known = new Map(instruments.map((i) => [i.code, i]));
    const symbols = [...new Set(widget.flatMap((c) => c.items))];

    const unknown = symbols.filter((s) => !known.has(s));
    expect(unknown, 'symbols with no instrument record').toEqual([]);
    for (const s of symbols) {
      const inst = known.get(s)!;
      expect.soft(inst.displayName, `${s} displayName`).toBeTruthy();
      expect.soft(inst.image, `${s} image`).toMatch(/^https:\/\//);
    }
  });

  test('API-02 prices are positive and fresh for every widget pair', async ({ marketApi }, testInfo) => {
    const [widget, prices] = await Promise.all([marketApi.widgetJson(), marketApi.pricesJson('USD')]);
    const nowSec = Date.now() / 1000;
    const bySymbol = new Map(prices.map((p) => [p.base, p]));
    const stale: string[] = [];

    for (const symbol of new Set(widget.flatMap((c) => c.items))) {
      const tick = bySymbol.get(symbol);
      expect.soft(tick, `${symbol} has a USD price`).toBeDefined();
      if (!tick) continue;
      expect.soft(tick.quote).toBe('USD');
      expect.soft(tick.close, `${symbol} close > 0`).toBeGreaterThan(0);
      // A tick timestamp is the last trade, so thin markets (e.g. MBG) legitimately go quiet for a while.
      // Older than an hour means the feed is down: fail. Older than 5 minutes: flag for follow-up.
      const ageSec = nowSec - tick.timestamp;
      expect.soft(ageSec, `${symbol} age in seconds`).toBeLessThan(MAX_PRICE_AGE_SEC);
      if (ageSec > STALE_PRICE_AGE_SEC) stale.push(`${symbol} (${Math.round(ageSec / 60)} min)`);
      expect
        .soft(Number(tick.changePercentFormatted), `${symbol} formatted % matches raw`)
        .toBeCloseTo(tick.changePercent * 100, 1);
    }
    if (stale.length) observation(testInfo, 'OBS-11', `prices older than 5 min: ${stale.join(', ')}`);
  });

  test('API-03 marketing banners point at loadable images', async ({ marketApi, request }) => {
    const { marketing } = await marketApi.bannersJson();
    expect(marketing.length).toBeGreaterThan(0);
    for (const banner of marketing) {
      expect(banner.imageUrl).toMatch(/^https:\/\//);
      const img = await request.get(banner.imageUrl);
      expect.soft(img.status(), banner.imageUrl).toBe(200);
      expect.soft(img.headers()['content-type'], banner.imageUrl).toMatch(/^image\//);
    }
  });
});
