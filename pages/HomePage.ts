import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import banners from '../data/banners.json';

export class HomePage extends BasePage {
  protected readonly path = '';
  readonly heroHeading: Locator;
  readonly heroBanner: Locator;
  readonly downloadAppLink: Locator;
  readonly readyMarker: Locator;

  constructor(page: Page) {
    super(page);
    this.heroHeading = page.getByRole('heading', { name: banners.home.heading });
    this.heroBanner = page.locator('section').filter({ has: this.heroHeading });
    this.downloadAppLink = this.heroBanner.getByRole('link', { name: 'Download the app' });
    this.readyMarker = this.heroHeading;
  }

  heroCta(label: string): Locator {
    return this.heroBanner.getByRole('link', { name: label, exact: true });
  }
}
