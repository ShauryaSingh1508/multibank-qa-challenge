import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import banners from '../data/banners.json';
import trading from '../data/trading-categories.json';

export type ChangeDirection = 'up' | 'down' | 'unknown';

/** One rendered row of the spot market table, read in a single DOM pass so live values are consistent. */
export interface SpotPairRow {
  symbol: string;
  name: string;
  price: string;
  change: string;
  direction: ChangeDirection;
  iconAlt: string;
  iconLoaded: boolean;
  href: string;
  hasChart: boolean;
}

/** The Explore page: promo banners plus the "Spot market" table with Hot / Gainers / Losers tabs. */
export class SpotTradingPage extends BasePage {
  protected readonly path = '/explore';
  readonly heading: Locator;
  readonly promoStrip: Locator;
  readonly spotSection: Locator;
  readonly tableHeading: Locator;
  readonly table: Locator;
  readonly rows: Locator;
  /** The app-wide error boundary that replaces the page when rendering throws. */
  readonly errorScreen: Locator;
  readonly readyMarker: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { level: 1, name: banners.explore.heading });
    this.promoStrip = page.locator('section').filter({ has: this.heading });
    this.spotSection = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { level: 2, name: trading.sectionHeading }) });
    this.tableHeading = this.spotSection.getByRole('heading', { name: trading.tableHeading });
    this.table = this.spotSection.locator('table');
    // The table is virtualised and adds spacer rows; real rows carry `data-index`.
    this.rows = this.table.locator('tbody tr[data-index]');
    this.errorScreen = page.getByRole('heading', { name: /something went wrong/i });
    this.readyMarker = this.heading;
  }

  promoCard(text: string): Locator {
    return this.promoStrip.getByText(text, { exact: true });
  }

  categoryTab(label: string): Locator {
    return this.spotSection.getByRole('button', { name: label, exact: true });
  }

  async selectCategory(label: string): Promise<void> {
    await this.categoryTab(label).click();
  }

  rowFor(symbol: string): Locator {
    return this.rows.filter({ has: this.page.locator(`a[href$="/explore/${symbol}"]`) });
  }

  async waitForRows(): Promise<void> {
    await this.rows.first().waitFor({ state: 'visible' });
  }

  /**
   * Waits until the table shows `firstSymbol` at the top and every row's icon and sparkline have
   * rendered. Returns false instead of throwing on timeout so the caller's per-field assertions
   * report exactly which rows are incomplete.
   */
  async waitForRowsSettled(firstSymbol: string, timeout = 10_000): Promise<boolean> {
    await this.table.scrollIntoViewIfNeeded();
    return this.page
      .waitForFunction(
        ({ first }) => {
          const rows = [...document.querySelectorAll('table tbody tr[data-index]')];
          return (
            rows.length > 0 &&
            rows[0].querySelector('td[id$="_displayName-td"] span')?.textContent?.trim() === first &&
            rows.every((tr) => {
              const img = tr.querySelector<HTMLImageElement>('td[id$="_displayName-td"] img');
              return (
                !!img &&
                img.complete &&
                img.naturalWidth > 0 &&
                !!tr.querySelector('td[id$="_week-chart-td"] svg')
              );
            })
          );
        },
        { first: firstSymbol },
        { timeout },
      )
      .then(() => true)
      .catch(() => false);
  }

  async visibleSymbols(): Promise<string[]> {
    return (await this.readRows()).map((r) => r.symbol);
  }

  /**
   * Reads every rendered row. Cells are located by the stable `id` suffixes the table
   * component generates (`_displayName-td`, `_price-td`, ...), not by column position.
   */
  async readRows(): Promise<SpotPairRow[]> {
    return this.rows.evaluateAll((trs) =>
      trs.map((tr) => {
        const cell = (suffix: string) => tr.querySelector<HTMLElement>(`td[id$="${suffix}"]`);
        const nameCell = cell('_displayName-td');
        const spans = nameCell ? [...nameCell.querySelectorAll('span')] : [];
        const changeSpan = cell('_change-td')?.querySelector('span');
        const changeClass = changeSpan?.className ?? '';
        const img = nameCell?.querySelector('img');
        return {
          symbol: spans[0]?.textContent?.trim() ?? '',
          name: spans[1]?.textContent?.trim() ?? '',
          price: cell('_price-td')?.innerText.trim() ?? '',
          change: changeSpan?.textContent?.trim() ?? '',
          direction: /text-success/.test(changeClass)
            ? 'up'
            : /text-fail/.test(changeClass)
              ? 'down'
              : 'unknown',
          iconAlt: img?.getAttribute('alt') ?? '',
          iconLoaded: !!img && img.complete && img.naturalWidth > 0,
          href: nameCell?.querySelector('a')?.getAttribute('href') ?? '',
          hasChart: !!cell('_week-chart-td')?.querySelector('svg'),
        } as const;
      }),
    );
  }
}
