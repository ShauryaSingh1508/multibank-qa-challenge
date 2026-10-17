import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/** Per-asset page reached from a spot market row, e.g. `/explore/BTC`. */
export class CoinDetailPage extends BasePage {
  protected path = '';
  readonly summary: Locator;
  readonly price: Locator;
  readonly tradeButton: Locator;
  readonly chartTimeframes: Locator;
  readonly similarAssetsHeading: Locator;
  readonly readyMarker: Locator;

  constructor(page: Page) {
    super(page);
    this.tradeButton = page.getByRole('link', { name: 'Trade', exact: true });
    // The summary card is the block that holds the Trade CTA together with the price.
    this.summary = page
      .locator('div')
      .filter({ has: this.tradeButton })
      .filter({ has: page.locator('h3') })
      .last();
    this.price = this.summary.locator('h3').first();
    this.chartTimeframes = page.getByRole('button', { name: /^(1D|1W|1M|6M|1Y|All)$/ });
    this.similarAssetsHeading = page.getByRole('heading', { name: 'Similar Assets' });
    // Responsive layouts render the CTA more than once; any visible copy means the page is ready.
    this.readyMarker = this.tradeButton.first();
  }

  forSymbol(symbol: string): this {
    this.path = `/explore/${symbol}`;
    return this;
  }

  assetName(name: string): Locator {
    return this.summary.getByText(name, { exact: true });
  }
}
